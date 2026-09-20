'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Check, Eye, EyeOff, Loader2, Lock, Mail, PartyPopper, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiJson } from '@/lib/api-client';
import { AuthBrand, AuthCard, AuthCta, AuthKeyPoints, AuthShell, AuthTrust } from '@/components/auth/AuthShared';

const inputCls =
  'w-full rounded-2xl border border-border bg-background px-4 py-3.5 pl-11 text-sm font-medium outline-none transition-all placeholder:text-foreground/30 focus:border-primary focus:ring-4 focus:ring-primary/10';

function strength(password: string): { score: number; label: string } {
  let s = 0;
  if (password.length >= 8) s++;
  if (password.length >= 12) s++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
  if (/\d/.test(password)) s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;
  if (s <= 2) return { score: s, label: 'Weak' };
  if (s <= 4) return { score: s, label: 'Good' };
  return { score: s, label: 'Strong' };
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [business, setBusiness] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('pro');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<'verify' | 'account' | null>(null);

  const pw = useMemo(() => strength(password), [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !business.trim()) { setError('Tell us your name and business.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (!/^[+]?[\d\s().-]{7,20}$/.test(phone.trim())) { setError('Enter a valid phone number.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (!terms) { setError('Please accept the terms to continue.'); return; }

    setBusy(true);
    try {
      const { res, data } = await apiJson('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, business, email, phone, plan, password }),
      });
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Could not create your account.');
      // verify_required=true → email link sent (session comes after verify).
      // false (dev, SMTP off) → already signed in via cookie.
      if (data.verify_required === false) {
        window.location.href = '/account';
        return;
      }
      setDone('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <AuthBrand
        points={AuthKeyPoints()}
        quote={{ text: 'We went from day-end panic to one-click close. The license key arrived before the payment receipt did.', author: 'Jenil Dholakiya · DJ Jewellers, Rajkot' }}
      />

      <AuthCard>
        <Link href="/" className="lg:hidden text-2xl font-bold tracking-tighter mb-7">
          Aurum<span className="text-primary">OS</span>
        </Link>

        {!done ? (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} key="form">
            <h1 className="font-clash text-4xl md:text-[42px] font-bold tracking-tight leading-none mb-2">
              Create account
            </h1>
            <p className="text-foreground/55 text-sm mb-7">
              Your showroom console in under a minute.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-foreground/80">Full name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35 size-4" />
                    <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ramesh Soni" className={inputCls} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="business" className="text-sm font-semibold text-foreground/80">Business</label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35 size-4" />
                    <input id="business" value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Shree Jewellers" className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground/80">Work email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35 size-4" />
                    <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@showroom.com" className={inputCls} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-semibold text-foreground/80">Phone</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35 size-4" />
                    <input id="phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-semibold text-foreground/80">Plan of interest</span>
                <div className="grid grid-cols-3 gap-2">
                  {['lite', 'pro', 'enterprise'].map((p) => (
                    <button key={p} type="button" onClick={() => setPlan(p)}
                      className={`rounded-2xl border py-3 text-sm font-bold capitalize transition-all ${
                        plan === p ? 'border-primary bg-primary/[0.07] text-primary shadow-md shadow-primary/10' : 'border-border text-foreground/60 hover:border-primary/40'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground/80">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35 size-4" />
                    <input id="password" type={show ? 'text' : 'password'} autoComplete="new-password" value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className={`${inputCls} pr-12`} />
                    <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-primary transition-colors">
                      {show ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {password && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pw.label === 'Strong' ? 'bg-green-500' : pw.label === 'Good' ? 'bg-amber-500' : 'bg-red-400'}`}
                          style={{ width: `${(pw.score / 5) * 100}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-foreground/50">{pw.label}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm" className="text-sm font-semibold text-foreground/80">Confirm</label>
                  <div className="relative">
                    <Check className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35 size-4" />
                    <input id="confirm" type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm}
                      onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className={inputCls} />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-[13px] text-foreground/65 cursor-pointer select-none">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)}
                  className="size-4 mt-0.5 rounded accent-[#b3395a]" />
                <span>I agree to the <Link href="/security" className="font-bold text-primary hover:underline">terms</Link> and understand my showroom data stays on my machines.</span>
              </label>

              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={busy} className="w-full rounded-2xl py-6 text-base font-bold shadow-lg shadow-primary/25">
                {busy ? <><Loader2 className="mr-2 animate-spin" size={18} /> Creating account…</> : <>Create account <ArrowRight className="ml-1" size={18} /></>}
              </Button>
            </form>

            <div className="mt-7 space-y-4">
              <div className="text-center">
                <span className="text-sm text-foreground/55">Already have an account? </span>
                <AuthCta href="/login">Sign in</AuthCta>
              </div>
              <AuthTrust />
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} key="done" className="text-center py-8">
            <div className="mx-auto size-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 mb-5">
              <PartyPopper size={26} />
            </div>
            <h2 className="font-clash text-3xl font-bold tracking-tight mb-2">Check your inbox</h2>
            <p className="text-foreground/60 text-sm leading-relaxed max-w-sm mx-auto">
              <strong className="text-foreground">{name}</strong>, your <strong className="text-foreground capitalize">{plan}</strong> account
              is created — click the verification link we emailed to <strong className="text-foreground">{email}</strong> to
              sign in. Our team will also call <strong className="text-foreground">{phone}</strong> to help you onboard.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="rounded-2xl font-bold"><Link href="/login">Go to sign in</Link></Button>
              <Button asChild variant="outline" className="rounded-2xl font-bold"><Link href="/">Back to home</Link></Button>
            </div>
          </motion.div>
        )}
      </AuthCard>
    </AuthShell>
  );
}
