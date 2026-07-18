'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Check, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const plans = [
  { id: 'lite', name: 'Lite', note: 'Single-shop' },
  { id: 'pro', name: 'Pro', note: 'Multi-PC' },
  { id: 'enterprise', name: 'Enterprise', note: 'Cloud + fleet' },
];

export default function GetStartedPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [plan, setPlan] = useState('pro');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No backend wired yet — surface a confirmation state for now.
    setSubmitted(true);
  };

  return (
    <main className="relative flex-1 min-h-screen pt-40 pb-32 px-6 flex items-center justify-center overflow-x-hidden">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.16, 0.1] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[480px] bg-primary/20 rounded-full blur-[120px] -z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-lg bg-card border border-border rounded-[40px] p-10 md:p-12 shadow-2xl shadow-primary/10"
      >
        <Link href="/" className="text-2xl font-bold tracking-tighter block mb-8">
          Aurum<span className="text-primary">OS</span>
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Get started</h1>
        <p className="text-foreground/70 text-sm mb-8">
          Provision your jewellery command center in minutes.
        </p>

        {submitted ? (
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Check size={24} />
            </div>
            <h2 className="text-xl font-bold">You’re on the list</h2>
            <p className="text-foreground/70 text-sm">
              Provisioning isn’t wired up yet — this is a placeholder confirmation for{' '}
              <span className="font-medium text-foreground">{email}</span> on the{' '}
              <span className="font-medium text-foreground capitalize">{plan}</span> plan.
            </p>
            <Button variant="outline" className="rounded-2xl" onClick={() => setSubmitted(false)}>
              Edit details
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground/80">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 size-4" />
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jewel Merchant"
                    className="w-full rounded-2xl border border-border bg-background py-3.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-ring/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium text-foreground/80">
                  Showroom / Company
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 size-4" />
                  <input
                    id="company"
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Aurum Atelier"
                    className="w-full rounded-2xl border border-border bg-background py-3.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-ring/30"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground/80">
                Work email
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 size-4" />
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
              <span className="text-sm font-medium text-foreground/80">Choose a plan</span>
              <div className="grid grid-cols-3 gap-3">
                {plans.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      plan === p.id
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/20'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="font-bold text-sm">{p.name}</div>
                    <div className="text-[11px] text-foreground/70">{p.note}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full rounded-2xl py-7 text-base font-bold">
              Create account <ArrowRight className="ml-2" />
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-foreground/70">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
