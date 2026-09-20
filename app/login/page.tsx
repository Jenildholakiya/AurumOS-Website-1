'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiJson } from '@/lib/api-client';
import { AuthBrand, AuthCard, AuthCta, AuthKeyPoints, AuthShell, AuthTrust } from '@/components/auth/AuthShared';

const inputCls =
  'w-full rounded-2xl border border-border bg-background px-4 py-3.5 pl-11 text-sm font-medium outline-none transition-all placeholder:text-foreground/30 focus:border-primary focus:ring-4 focus:ring-primary/10';

function LoginBody() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/account';
  const verified = search.get('verified');

  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('aurumos-login-email') ?? ''; } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid work email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    setBusy(true);
    try {
      const { res, data } = await apiJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Could not sign you in.');
      if (remember) {
        try { localStorage.setItem('aurumos-login-email', email.trim()); } catch { /* ignore */ }
      } else {
        try { localStorage.removeItem('aurumos-login-email'); } catch { /* ignore */ }
      }
      router.push(next.startsWith('/') ? next : '/account');
      router.refresh();
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
        quote={{ text: 'Billing, stock and karigar accounts finally live in one calm screen. Our evenings are ours again.', author: 'Ramesh Soni · Shree Jewellers, Rajkot' }}
      />

      <AuthCard>
        <Link href="/" className="lg:hidden text-2xl font-bold tracking-tighter mb-7">
          Aurum<span className="text-primary">OS</span>
        </Link>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} key="form">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-primary mb-3">
            <Sparkles size={13} /> Welcome back
          </p>
          <h1 className="font-clash text-4xl md:text-[42px] font-bold tracking-tight leading-none mb-2">
            Sign in
          </h1>
          <p className="text-foreground/55 text-sm mb-8">
            Access your showroom console, keys and billing.
          </p>

          {verified === '1' && (
            <div className="mb-5 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-[13px] font-medium text-green-700 flex items-center gap-2">
              <CheckCircle2 size={16} /> Email verified — sign in below.
            </div>
          )}
          {verified === 'invalid' && (
            <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] font-medium text-amber-700">
              That verification link is invalid or expired. Sign in to request a fresh one.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-foreground/80">Work email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35 size-4" />
                <input id="email" type="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@showroom.com" className={inputCls} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-foreground/80">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35 size-4" />
                <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${inputCls} pr-12`} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-primary transition-colors">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-[13px] font-medium text-foreground/65 cursor-pointer select-none">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                className="size-4 rounded accent-[#b3395a]" />
              Remember me on this device
            </label>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full rounded-2xl py-6 text-base font-bold shadow-lg shadow-primary/25">
              {busy ? <><Loader2 className="mr-2 animate-spin" size={18} /> Signing in…</> : <>Sign in <ArrowRight className="ml-1" size={18} /></>}
            </Button>
          </form>

          <div className="mt-7 space-y-4">
            <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-foreground/30">
              <span className="h-px flex-1 bg-border" /> New here? <span className="h-px flex-1 bg-border" />
            </div>
            <div className="text-center">
              <AuthCta href="/signup">Create your account</AuthCta>
            </div>
            <AuthTrust />
          </div>
        </motion.div>
      </AuthCard>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></main>}>
      <LoginBody />
    </Suspense>
  );
}
