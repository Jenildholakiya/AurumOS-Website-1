'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Mail, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthBrand, AuthCard, AuthKeyPoints, AuthShell } from '@/components/auth/AuthShared';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => null);
    } finally {
      // Always show success — never reveal whether the email has an account.
      setSent(true);
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <AuthBrand points={AuthKeyPoints()} />
      <AuthCard>
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-primary transition-colors mb-7">
          <ArrowLeft size={15} /> Back to sign in
        </Link>
        {!sent ? (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} key="form">
            <h1 className="font-clash text-4xl font-bold tracking-tight mb-2">Reset password</h1>
            <p className="text-foreground/55 text-sm mb-7">Enter your account email — we’ll send a one-hour reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-foreground/80">Work email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35 size-4" />
                  <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@showroom.com"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 pl-11 text-sm font-medium outline-none transition-all placeholder:text-foreground/30 focus:border-primary focus:ring-4 focus:ring-primary/10" />
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full rounded-2xl py-6 text-base font-bold shadow-lg shadow-primary/25">
                {busy ? <><Loader2 className="mr-2 animate-spin" size={18} /> Sending…</> : 'Send reset link'}
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} key="sent" className="text-center py-8">
            <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-5">
              <MailCheck size={26} />
            </div>
            <h2 className="font-clash text-3xl font-bold tracking-tight mb-2">Check your inbox</h2>
            <p className="text-foreground/60 text-sm max-w-sm mx-auto">
              If <strong className="text-foreground">{email}</strong> has an account, a reset link is on its way (valid 1 hour).
            </p>
          </motion.div>
        )}
      </AuthCard>
    </AuthShell>
  );
}
