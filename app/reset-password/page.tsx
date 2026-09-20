'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiJson } from '@/lib/api-client';
import { AuthBrand, AuthCard, AuthKeyPoints, AuthShell } from '@/components/auth/AuthShared';

function ResetBody() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8 || password.length > 128) { setError('Password must be 8–128 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const { res, data } = await apiJson('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Could not reset the password.');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <AuthBrand points={AuthKeyPoints()} />
      <AuthCard>
        {!token ? (
          <div className="text-center py-8">
            <h1 className="font-clash text-3xl font-bold tracking-tight mb-2">Invalid link</h1>
            <p className="text-foreground/60 text-sm mb-6">This reset link is missing or malformed.</p>
            <Button asChild className="rounded-2xl font-bold"><Link href="/forgot-password">Request a new link</Link></Button>
          </div>
        ) : !done ? (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} key="form">
            <h1 className="font-clash text-4xl font-bold tracking-tight mb-2">New password</h1>
            <p className="text-foreground/55 text-sm mb-7">Choose a fresh password — all other sessions will be signed out.</p>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-foreground/80">New password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35 size-4" />
                  <input id="password" type="password" autoComplete="new-password" value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 pl-11 text-sm font-medium outline-none transition-all placeholder:text-foreground/30 focus:border-primary focus:ring-4 focus:ring-primary/10" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm" className="text-sm font-semibold text-foreground/80">Confirm</label>
                <input id="confirm" type="password" autoComplete="new-password" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm font-medium outline-none transition-all placeholder:text-foreground/30 focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </div>
              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-600">{error}</div>
              )}
              <Button type="submit" disabled={busy} className="w-full rounded-2xl py-6 text-base font-bold shadow-lg shadow-primary/25">
                {busy ? <><Loader2 className="mr-2 animate-spin" size={18} /> Resetting…</> : 'Set new password'}
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} key="done" className="text-center py-8">
            <div className="mx-auto size-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 mb-5">
              <Check size={26} />
            </div>
            <h2 className="font-clash text-3xl font-bold tracking-tight mb-2">Password updated</h2>
            <p className="text-foreground/60 text-sm mb-7">Sign in with your new password.</p>
            <Button className="rounded-2xl font-bold" onClick={() => router.push('/login')}>Go to sign in</Button>
          </motion.div>
        )}
      </AuthCard>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></main>}>
      <ResetBody />
    </Suspense>
  );
}
