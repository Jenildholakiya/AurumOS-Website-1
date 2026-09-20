'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, KeyRound, Loader2,
  Lock, Mail, MapPin, Phone, ShieldCheck, Store, User, Warehouse, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiJson } from '@/lib/api-client';
import { PLANS, dueTodayRupees, formatINR, normalizePlan, type PlanId, type SoftwareType } from '@/lib/plans';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay script failed to load'));
    document.body.appendChild(script);
  });
}

const inputCls =
  'w-full rounded-2xl border border-border bg-background px-4 py-3.5 pl-11 text-sm font-medium outline-none transition-all placeholder:text-foreground/30 focus:border-primary focus:ring-4 focus:ring-primary/10';

const STEPS = ['Your details', 'Payment', 'Get key'];

const SOFTWARE_OPTIONS: { id: SoftwareType; label: string; hint: string; prefix: string; icon: typeof Store }[] = [
  { id: 'retail', label: 'Retail', hint: 'Single-brand showroom', prefix: 'AR-', icon: Store },
  { id: 'wholesale', label: 'Wholesale', hint: 'Bullion / B2B', prefix: 'AU-', icon: Warehouse },
];

function Field({
  id, label, hint, icon: Icon, children,
}: {
  id: string; label: string; hint?: string; icon?: typeof User; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-foreground/80">
        {label} {hint && <span className="font-normal text-foreground/45">{hint}</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35 size-4" />}
        {children}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const plan: PlanId = useMemo(() => normalizePlan(params?.plan), [params]);
  const planDef = PLANS[plan];
  const dueToday = dueTodayRupees(plan);

  const [softwareType, setSoftwareType] = useState<SoftwareType>('retail');
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function verifyAndRedirect(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    idempotency_key: string;
    mock?: boolean;
  }) {
    const { res, data } = await apiJson('/api/public/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok || !data.ok) {
      throw new Error(
        data?.error ||
          'Payment received but key generation failed. Check your email or contact support with your payment ID.'
      );
    }
    router.push(`/success?order=${encodeURIComponent(payload.idempotency_key)}`);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // 1. Create order server-side (validates form + prices from PLANS).
      const { res, data: order } = await apiJson('/api/public/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          software_type: softwareType,
          business_name: businessName,
          owner_name: ownerName,
          city,
          phone,
          email,
          notes,
        }),
      });
      if (!res.ok || !order.ok) throw new Error(order?.error || 'Could not start the payment.');

      // 2a. Dev/test mode (no Razorpay keys): simulate a captured payment.
      if (order.mock) {
        await verifyAndRedirect({
          razorpay_order_id: order.order_id,
          razorpay_payment_id: `pay_mock_${Date.now().toString(36)}`,
          razorpay_signature: 'mock',
          idempotency_key: order.idempotency_key,
          mock: true,
        });
        return;
      }

      // 2b. Live: open Razorpay Checkout.
      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error('Razorpay failed to load.');

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'AurumOS',
        description: `${order.plan_name} (${softwareType}) license`,
        order_id: order.order_id,
        prefill: { name: ownerName, email, contact: phone },
        notes: { idempotency_key: order.idempotency_key },
        theme: { color: '#b3395a' },
        handler: async (resp: { razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verifyAndRedirect({
              razorpay_order_id: order.order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              idempotency_key: order.idempotency_key,
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed.');
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen pt-36 pb-24 px-6 overflow-x-hidden">
      {/* Ambience */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 size-[560px] bg-primary/25 rounded-full blur-[130px] -z-10"
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-primary transition-colors mb-5">
              <ArrowLeft size={16} /> Back to pricing
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="font-clash text-4xl md:text-5xl font-bold tracking-tight">
                Checkout — <span className="text-primary italic">{planDef.name}</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <Lock size={12} /> Secure
              </span>
            </div>
            <p className="text-foreground/60 text-[15px]">Pay once, get your license key instantly. No manual steps, no waiting.</p>
          </div>

          {/* Steps */}
          <ol className="flex items-center gap-2 text-xs font-semibold">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                  i === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/50'
                }`}>
                  <span className={`size-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    i === 0 ? 'bg-primary-foreground/25' : 'bg-foreground/10'
                  }`}>{i + 1}</span>
                  {s}
                </span>
                {i < STEPS.length - 1 && <span className="w-3 h-px bg-border" />}
              </li>
            ))}
          </ol>
        </div>

        {/* Plan switcher */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {(Object.keys(PLANS) as PlanId[]).map((p) => (
            <Link
              key={p}
              href={`/checkout/${p}`}
              className={`rounded-2xl border px-5 py-4 flex items-center justify-between transition-all ${
                p === plan
                  ? 'border-primary bg-primary/[0.07] shadow-lg shadow-primary/10'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <span>
                <span className="flex items-center gap-2 font-bold text-sm">
                  {p === plan && <BadgeCheck size={15} className="text-primary" />}
                  {PLANS[p].name}
                </span>
                <span className="text-xs text-foreground/55">{formatINR(dueTodayRupees(p))} first year</span>
              </span>
              <span className="text-sm font-bold text-foreground/70">{formatINR(PLANS[p].price)}</span>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          {/* Form card */}
          <motion.section
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-[32px] p-7 md:p-10 shadow-xl shadow-primary/5"
          >
            <form onSubmit={handlePay} className="space-y-8">
              {/* 01 Software type */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-primary">01 · Software type</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {SOFTWARE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSoftwareType(t.id)}
                      aria-pressed={softwareType === t.id}
                      className={`rounded-2xl border p-5 text-left transition-all ${
                        softwareType === t.id
                          ? 'border-primary bg-primary/[0.07] shadow-lg shadow-primary/10 ring-4 ring-primary/10'
                          : 'border-border hover:border-primary/40 hover:bg-primary/[0.02]'
                      }`}
                    >
                      <span className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 font-bold">
                          <t.icon size={17} className={softwareType === t.id ? 'text-primary' : 'text-foreground/40'} />
                          {t.label}
                        </span>
                        <span className={`font-mono text-xs font-bold px-2 py-1 rounded-lg ${
                          softwareType === t.id ? 'bg-primary text-primary-foreground' : 'bg-foreground/10 text-foreground/50'
                        }`}>{t.prefix}····</span>
                      </span>
                      <span className="text-xs text-foreground/55">{t.hint} · key starts with {t.prefix}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* 02 Business details */}
              <div className="space-y-5">
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-primary">02 · Business details</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field id="biz" label="Business name *" icon={Building2}>
                    <input id="biz" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Shree Jewellers" className={inputCls} />
                  </Field>
                  <Field id="owner" label="Owner name *" icon={User}>
                    <input id="owner" required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Ramesh Soni" className={inputCls} />
                  </Field>
                  <Field id="city" label="City" icon={MapPin}>
                    <input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Rajkot" className={inputCls} />
                  </Field>
                  <Field id="phone" label="Phone *" icon={Phone}>
                    <input id="phone" required inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
                  </Field>
                </div>
                <Field id="email" label="Email *" hint="(your key is emailed here)" icon={Mail}>
                  <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@shop.com" className={inputCls} />
                </Field>
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-semibold text-foreground/80">
                    Notes <span className="font-normal text-foreground/45">(optional — GSTIN, requirements)</span>
                  </label>
                  <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know" rows={2}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm font-medium outline-none transition-all placeholder:text-foreground/30 focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none" />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <Button type="submit" disabled={busy} className="w-full rounded-2xl py-7 text-lg font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                  {busy ? (
                    <><Loader2 className="mr-2 animate-spin" /> Processing payment…</>
                  ) : (
                    <>Pay {formatINR(dueToday)} & Get Key <ArrowRight className="ml-2" /></>
                  )}
                </Button>
                <p className="flex items-center justify-center gap-2 text-xs text-foreground/50 mt-4">
                  <ShieldCheck size={14} className="text-primary" /> Secured by Razorpay · Key auto-generated on payment success
                </p>
              </div>
            </form>
          </motion.section>

          {/* Summary */}
          <motion.aside
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:sticky lg:top-28 rounded-[32px] overflow-hidden"
          >
            <div className="relative bg-card border border-border p-8 md:p-9 overflow-hidden">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: 'linear-gradient(135deg, rgba(179,57,90,0.09), rgba(214,91,124,0.04) 45%, transparent 70%)' }}
              />
              <div className="absolute top-0 left-8 right-8 h-1 rounded-full bg-gradient-to-r from-primary via-primary/60 to-amber-400/70" />
              <h2 className="relative font-clash text-2xl font-bold mb-6">Order summary</h2>

              <div className="relative rounded-2xl bg-primary/[0.07] border border-primary/15 px-4 py-3 flex items-center justify-between text-sm mb-6">
                <span className="font-bold">{planDef.name} <span className="font-normal text-foreground/55 capitalize">· {softwareType}</span></span>
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                  {softwareType === 'wholesale' ? 'AU-' : 'AR-'}····
                </span>
              </div>

              {/* Price breakdown */}
              <dl className="relative space-y-3.5 text-[15px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-foreground/60">License <span className="text-foreground/40">(one-time)</span></dt>
                  <dd className="font-bold tabular-nums">{formatINR(planDef.price)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-foreground/60">Maintenance <span className="text-foreground/40">(year 1)</span></dt>
                  <dd className="font-bold tabular-nums text-primary">+ {formatINR(planDef.annual)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-[13px] text-foreground/45">
                  <dt>Renewal from year 2</dt>
                  <dd className="tabular-nums">{formatINR(planDef.annual)}/yr</dd>
                </div>
              </dl>

              <div className="relative h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent my-6" />

              <div className="relative flex items-end justify-between mb-1">
                <span className="font-clash text-xl font-bold">Due today</span>
                <span className="text-right">
                  <span className="block text-[11px] text-foreground/45 tabular-nums">
                    {formatINR(planDef.price)} + {formatINR(planDef.annual)}
                  </span>
                  <span className="font-clash text-4xl font-bold tabular-nums text-primary">{formatINR(dueToday)}</span>
                </span>
              </div>
              <p className="relative text-[11px] text-foreground/45 mb-6">Inclusive of all taxes as applicable · UPI, cards & netbanking</p>

              <ul className="relative space-y-3 text-[13px]">
                {[
                  { icon: Zap, text: 'Key delivered instantly after payment' },
                  { icon: KeyRound, text: '1-year subscription (365 days) included' },
                  { icon: ShieldCheck, text: 'Locks to your shop PC on first activation' },
                ].map((r) => (
                  <li key={r.text} className="flex items-start gap-2.5 text-foreground/70">
                    <r.icon size={15} className="mt-0.5 shrink-0 text-primary" /> {r.text}
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        </div>
      </div>
    </main>
  );
}
