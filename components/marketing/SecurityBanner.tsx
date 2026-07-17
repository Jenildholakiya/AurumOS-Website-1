'use client';
import { Lock, ShieldCheck, Database, Fingerprint } from 'lucide-react';
import SplitHeading from '@/components/anim/SplitHeading';
import Reveal from '@/components/anim/Reveal';

const securityFeatures = [
  { title: 'Bank-Grade Encryption', desc: 'AES-256 bit security guards every ledger entry, at rest and in transit.', icon: <Lock /> },
  { title: 'Zero-Knowledge Access', desc: 'Role-based control — data is visible only to those who own it.', icon: <Fingerprint /> },
  { title: 'Immutable Audit Logs', desc: 'Every weight adjustment is time-stamped, signed, and tracked.', icon: <ShieldCheck /> },
  { title: 'Regional Data Residency', desc: 'Your data stays within your sovereign, chosen jurisdiction.', icon: <Database /> },
];

export default function SecurityBanner() {
  return (
    <section className="px-6 py-24">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent p-12">
        <div className="relative z-10">
          <SplitHeading
            as="h2"
            text="Enterprise-Grade Data Sovereignty"
            splitBy="lines"
            duration={1}
            stagger={0.16}
            className="mb-12 text-3xl font-bold leading-tight md:text-4xl"
          />

          <Reveal as="div" stagger={0.12} y={30} className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {securityFeatures.map((item) => (
              <div
                key={item.title}
                className="group relative space-y-3 rounded-2xl border border-transparent p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:bg-white/50"
              >
                <div className="mb-4 text-primary transition-transform duration-300 group-hover:scale-110">
                  <span className="inline-block size-8">{item.icon}</span>
                </div>
                <h4 className="text-lg font-bold">{item.title}</h4>
                <p className="text-sm leading-relaxed text-foreground/60">{item.desc}</p>
              </div>
            ))}
          </Reveal>
        </div>

        {/* Static Background Glow (no animation -> zero per-frame cost) */}
        <div
          aria-hidden
          className="absolute -bottom-20 -right-20 size-80 rounded-full bg-primary/20 blur-[100px]"
        />
      </div>
    </section>
  );
}
