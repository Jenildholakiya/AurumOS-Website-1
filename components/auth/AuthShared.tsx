'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, KeyRound, ShieldCheck, Zap } from 'lucide-react';

/** Shared brand panel for auth pages (rose-gold, light theme). */
export function AuthBrand({ quote, points }: { quote?: { text: string; author: string }; points: { icon: typeof Zap; title: string; text: string }[] }) {
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden rounded-[36px] border border-border bg-card p-10 xl:p-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(150deg, rgba(179,57,90,0.12), rgba(214,91,124,0.05) 40%, transparent 65%)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 9, repeat: Infinity }}
        className="pointer-events-none absolute -top-24 -right-24 size-[340px] rounded-full bg-primary/20 blur-[100px]"
      />

      <Link href="/" className="relative text-[26px] font-bold tracking-tighter">
        Aurum<span className="text-primary">OS</span>
      </Link>

      <div className="relative space-y-7">
        <h2 className="font-clash text-4xl xl:text-[44px] font-bold leading-[1.05] tracking-tight">
          The intelligence core for the <span className="text-primary italic">modern jeweller.</span>
        </h2>
        <ul className="space-y-4">
          {points.map((p) => (
            <li key={p.title} className="flex items-start gap-3.5">
              <span className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <p.icon size={18} />
              </span>
              <span>
                <span className="block text-sm font-bold">{p.title}</span>
                <span className="block text-[13px] text-foreground/55">{p.text}</span>
              </span>
            </li>
          ))}
        </ul>
        {quote && (
          <figure className="rounded-2xl border border-border bg-background p-5">
            <blockquote className="text-sm leading-relaxed text-foreground/75">“{quote.text}”</blockquote>
            <figcaption className="mt-2 text-xs font-bold text-primary">— {quote.author}</figcaption>
          </figure>
        )}
      </div>

      <div className="relative flex items-center gap-2 text-xs text-foreground/45">
        <ShieldCheck size={14} className="text-primary" />
        Bastion-secured · SOC2-aligned infrastructure · 99.99% uptime
      </div>
    </div>
  );
}

/** Small trust row under auth forms. */
export function AuthTrust() {
  return (
    <div className="flex items-center justify-center gap-5 pt-1 text-[11px] font-semibold text-foreground/40">
      {['Bastion security', 'Instant keys', 'UPI · Cards · Netbanking'].map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <BadgeCheck size={13} className="text-primary" /> {t}
        </span>
      ))}
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen px-4 sm:px-6 py-8 md:py-12 flex items-center justify-center overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="pointer-events-none absolute top-[-160px] left-1/2 -translate-x-1/2 size-[560px] rounded-full bg-primary/20 blur-[130px]"
      />
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative w-full max-w-5xl grid lg:grid-cols-2 gap-5 items-stretch"
      >
        {children}
      </motion.div>
    </main>
  );
}

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card/95 backdrop-blur border border-border rounded-[36px] p-8 md:p-11 shadow-2xl shadow-primary/10 flex flex-col justify-center">
      {children}
    </div>
  );
}

export function AuthCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center justify-center gap-2 text-sm font-bold text-primary">
      {children}
      <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}

export function AuthKeyPoints() {
  return [
    { icon: Zap, title: 'Keys in seconds', text: 'Pay online, license auto-mints instantly.' },
    { icon: KeyRound, title: 'One key, one PC', text: 'Locks to your shop computer on activation.' },
    { icon: ShieldCheck, title: 'Bastion protection', text: 'Watchdog, lock screen and forensic alerts.' },
  ];
}
