'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No auth backend wired yet — surface a confirmation state for now.
    setSubmitted(true);
  };

  return (
    <main className="relative flex-1 min-h-screen pt-40 pb-32 px-6 flex items-center justify-center overflow-x-hidden">
      {/* ambient glow */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.16, 0.1] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[480px] bg-primary/20 rounded-full blur-[120px] -z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md bg-card border border-border rounded-[40px] p-10 md:p-12 shadow-2xl shadow-primary/10"
      >
        <Link href="/" className="text-2xl font-bold tracking-tighter block mb-8">
          Aurum<span className="text-primary">OS</span>
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Welcome back</h1>
        <p className="text-foreground/70 text-sm mb-8">
          Sign in to your enterprise jewellery console.
        </p>

        {submitted ? (
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Lock size={24} />
            </div>
            <h2 className="text-xl font-bold">Check your inbox</h2>
            <p className="text-foreground/70 text-sm">
              Authentication isn’t wired up yet — this is a placeholder confirmation for{' '}
              <span className="font-medium text-foreground">{email}</span>.
            </p>
            <Button variant="outline" className="rounded-2xl" onClick={() => setSubmitted(false)}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground/80">
                Work email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 size-4" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@showroom.com"
                  className="w-full rounded-2xl border border-border bg-background py-3.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-ring/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground/80">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 size-4" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-border bg-background py-3.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-ring/30"
                />
              </div>
            </div>

            <Button type="submit" className="w-full rounded-2xl py-7 text-base font-bold">
              Sign in <ArrowRight className="ml-2" />
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-foreground/70">
          New to AurumOS?{' '}
          <Link href="/get-started" className="font-semibold text-primary hover:underline">
            Get started
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
