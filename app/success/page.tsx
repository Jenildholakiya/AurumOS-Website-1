'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, Check, Copy, Download, KeyRound,
  Loader2, MailCheck, MailWarning, MonitorDown, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiJson } from '@/lib/api-client';

interface LicenseInfo {
  key: string;
  plan_type: string;
  software_type: string;
  duration_days: number;
  subscription_expires_at: string;
}

const STEPS = [
  { icon: MonitorDown, title: 'Open AurumOS', text: 'Launch the app on your shop PC.' },
  { icon: KeyRound, title: 'Enter your key', text: 'Paste it in when prompted at startup.' },
  { icon: ShieldCheck, title: 'Locked & secured', text: 'The key binds to that PC on first use.' },
];

function SuccessBody() {
  const search = useSearchParams();
  const orderKey = search.get('order') ?? '';
  const [loading, setLoading] = useState(() => Boolean(search.get('order')));
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [paymentId, setPaymentId] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [isMock, setIsMock] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(() =>
    search.get('order') ? '' : 'No order reference found. Complete checkout first.'
  );

  useEffect(() => {
    if (!orderKey) return;
    let cancelled = false;
    // Webhook may still be minting: poll a few times before giving up.
    // Transient HTML answers (proxy hiccups) retry like a not-ready order.
    const fetchStatus = async (attempt: number): Promise<void> => {
      try {
        const { data } = await apiJson(`/api/public/order-status?idempotency_key=${encodeURIComponent(orderKey)}`);
        if (cancelled) return;
        if (data?.ok && data?.license) {
          setLicense(data.license);
          setPaymentId(data.payment_id ?? '');
          setBuyerEmail(data.email ?? '');
          setIsMock(Boolean(data.mock));
          setLoading(false);
          return;
        }
        if (attempt < 6) {
          setTimeout(() => fetchStatus(attempt + 1), 2000);
          return;
        }
        setError('Payment received — your key is still generating. Check your email shortly, or contact support with this order reference.');
        setLoading(false);
      } catch {
        // Network/HTML hiccup: keep polling like a not-ready order.
        if (!cancelled && attempt < 6) {
          setTimeout(() => fetchStatus(attempt + 1), 2000);
          return;
        }
        if (!cancelled) {
          setError('Could not load your key. Refresh, or contact support with your payment ID.');
          setLoading(false);
        }
      }
    };
    fetchStatus(0);
    return () => {
      cancelled = true;
    };
  }, [orderKey]);

  const copyKey = useCallback(async () => {
    if (!license) return;
    try {
      await navigator.clipboard.writeText(license.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [license]);

  const downloadKey = useCallback(() => {
    if (!license) return;
    const text = [
      'AurumOS License Key',
      '===================',
      '',
      `Key: ${license.key}`,
      `Plan: ${license.plan_type}`,
      `Software: ${license.software_type}`,
      `Valid until: ${license.subscription_expires_at.slice(0, 10)}`,
      paymentId ? `Payment ref: ${paymentId}` : null,
      '',
      'How to activate:',
      '1. Open AurumOS on your shop PC.',
      '2. Enter the key above when prompted.',
      '3. The key locks to the first PC it is activated on.',
    ]
      .filter(Boolean)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aurumos-license-${license.key}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [license, paymentId]);

  return (
    <main className="relative min-h-screen px-6 py-14 md:py-20 flex items-center justify-center overflow-hidden">
      {/* Ambience */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 9, repeat: Infinity }}
        className="pointer-events-none absolute top-[-180px] left-1/2 -translate-x-1/2 size-[620px] rounded-full bg-primary/25 blur-[140px]"
      />
      <div className="pointer-events-none absolute bottom-[-220px] left-[8%] size-[380px] rounded-full bg-amber-400/15 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 34 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-xl"
      >
        {/* Brand */}
        <p className="text-center text-2xl font-bold tracking-tighter mb-8">
          Aurum<span className="text-primary">OS</span>
        </p>

        <div className="bg-card/90 backdrop-blur border border-border rounded-[36px] px-7 py-10 md:px-12 shadow-2xl shadow-primary/15 text-center overflow-hidden">
          {loading ? (
            <div className="py-12 space-y-5">
              <div className="relative mx-auto size-20">
                <span className="absolute inset-0 rounded-full border-2 border-primary/15" />
                <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                <KeyRound size={26} className="absolute inset-0 m-auto text-primary" />
              </div>
              <h1 className="font-clash text-3xl font-bold tracking-tight">Minting your key…</h1>
              <p className="text-foreground/55 text-sm">Payment confirmed. Engraving your license now.</p>
              <div className="flex justify-center gap-1.5 pt-2">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    className="size-1.5 rounded-full bg-primary"
                  />
                ))}
              </div>
            </div>
          ) : license ? (
            <>
              {/* Success seal */}
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                className="relative mx-auto size-20 mb-6"
              >
                <motion.span
                  animate={{ scale: [1, 1.35], opacity: [0.35, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-green-500/30"
                />
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/40 flex items-center justify-center">
                  <Check size={36} strokeWidth={3} className="text-white" />
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="font-clash text-4xl md:text-5xl font-bold tracking-tight mb-3">
                  Payment <span className="text-primary italic">successful</span>
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
                  <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary capitalize">{license.plan_type}</span>
                  <span className="px-3 py-1.5 rounded-full bg-foreground/5 text-foreground/70 capitalize">{license.software_type}</span>
                  <span className="px-3 py-1.5 rounded-full bg-foreground/5 text-foreground/70">
                    Valid till {license.subscription_expires_at.slice(0, 10)}
                  </span>
                </div>
              </motion.div>

              {isMock && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2"
                >
                  <MailWarning size={14} /> Test payment — no real money moved.
                </motion.div>
              )}

              {/* Ticket */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="mt-7 rounded-[28px] overflow-hidden border border-primary/20 bg-gradient-to-b from-primary/[0.08] to-amber-400/[0.06] shadow-xl shadow-primary/10"
              >
                <div className="relative px-6 pt-7 pb-6">
                  <p className="relative text-[10px] font-bold uppercase tracking-[3px] text-primary mb-3">
                    Your license key
                  </p>
                  <button
                    type="button"
                    onClick={copyKey}
                    title="Click to copy"
                    className="relative font-mono text-[22px] md:text-[26px] font-bold tracking-[0.12em] break-all leading-relaxed text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    {license.key}
                  </button>
                  <p className="relative mt-2 text-[11px] text-foreground/45">
                    {copied ? <span className="text-green-600 font-bold">Copied to clipboard ✓</span> : 'Tap the key to copy'}
                  </p>
                </div>
                {/* Perforation */}
                <div className="relative">
                  <div className="border-t-2 border-dashed border-primary/25 mx-6" />
                  <span className="absolute -left-3 -top-3 size-6 rounded-full bg-card border-r border-primary/20" />
                  <span className="absolute -right-3 -top-3 size-6 rounded-full bg-card border-l border-primary/20" />
                </div>
                <div className="px-6 py-4 flex items-center justify-center gap-2 text-xs font-semibold text-foreground/60">
                  <BadgeCheck size={14} className="text-green-600" />
                  {license.duration_days}-day subscription · activates on first use
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                className="mt-6 grid sm:grid-cols-2 gap-3"
              >
                <Button onClick={copyKey} className="rounded-2xl py-6 font-bold shadow-lg shadow-primary/25">
                  {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
                  {copied ? 'Copied!' : 'Copy key'}
                </Button>
                <Button onClick={downloadKey} variant="outline" className="rounded-2xl py-6 font-bold">
                  <Download size={18} className="mr-2" /> Download .txt
                </Button>
              </motion.div>

              {/* Activation steps */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 grid sm:grid-cols-3 gap-3 text-left"
              >
                {STEPS.map((s, i) => (
                  <div key={s.title} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <s.icon size={15} />
                      </span>
                      <span className="text-[10px] font-bold text-foreground/35">0{i + 1}</span>
                    </div>
                    <p className="text-[13px] font-bold">{s.title}</p>
                    <p className="text-xs text-foreground/55 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 flex items-start justify-center gap-2 text-xs text-foreground/45 leading-relaxed"
              >
                <MailCheck size={14} className="mt-0.5 shrink-0 text-primary" />
                <span>
                  A copy was emailed{buyerEmail ? <> to <strong className="text-foreground/70">{buyerEmail}</strong></> : ''} — keep it safe, you need the key to reinstall.
                  {paymentId && <> Payment ref: <span className="font-mono">{paymentId}</span>.</>}
                </span>
              </motion.p>
            </>
          ) : (
            <div className="py-10 space-y-5">
              <div className="mx-auto size-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                <MailWarning size={30} />
              </div>
              <h1 className="font-clash text-3xl font-bold tracking-tight">Key is on its way</h1>
              <p className="text-foreground/55 text-sm max-w-md mx-auto leading-relaxed">{error}</p>
              {orderKey && <p className="text-xs font-mono text-foreground/35 break-all">Order ref: {orderKey}</p>}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button asChild className="rounded-2xl font-bold"><Link href="/pricing">Back to pricing</Link></Button>
                <Button asChild variant="outline" className="rounded-2xl font-bold"><Link href="/#contact">Contact support</Link></Button>
              </div>
            </div>
          )}
        </div>

        {license && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-7 text-center"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all"
            >
              Back to home <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen px-6 py-20 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </main>
    }>
      <SuccessBody />
    </Suspense>
  );
}
