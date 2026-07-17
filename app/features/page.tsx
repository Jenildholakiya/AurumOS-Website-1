'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Lock, Fingerprint, History, Cpu, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SplitHeading from '@/components/anim/SplitHeading';
import Reveal from '@/components/anim/Reveal';
import TiltCard from '@/components/anim/TiltCard';
import GemCanvas from '@/components/three/GemCanvas';
import { gsap, SplitText, useGSAP } from '@/components/anim/gsap/register';

const features = [
  { title: 'Wholesale Command', desc: 'Master multi-location inventory with automated replenishment and B2B fulfilment synced across every branch.', advantage: 'Reduces dead stock by 40%.', icon: Globe },
  { title: 'Retail Point-of-Sale', desc: 'A high-speed billing surface built for high-traffic showrooms — instant tax, digital receipts, zero queue friction.', advantage: 'Instant HUID verification.', icon: Zap },
  { title: 'HUID Compliance', desc: 'Automated hallmarking logs and regulatory audit trails woven directly into the workflow.', advantage: '100% audit-ready documentation.', icon: Lock },
  { title: 'Executive Analytics', desc: 'Interactive dashboards for revenue, weight drift, and your highest-margin lines at a single glance.', advantage: 'Real-time metal margin visibility.', icon: Globe },
  { title: 'Smart Ledger', desc: 'A relationship-first engine for customer credit, gold-savings schemes, and loyalty history.', advantage: 'Automated gold-savings tracking.', icon: History },
  { title: 'Staff Management', desc: 'Granular workforce oversight, attendance, and performance tracking in one secure hub.', advantage: 'KPI-driven sales incentives.', icon: Fingerprint },
];

const stats = [
  { label: 'System Uptime', val: '99.99%', color: 'text-emerald-500' },
  { label: 'HUIDs Verified', val: '1.2M+', color: 'text-primary' },
  { label: 'Data Integrity', val: '100%', color: 'text-primary' },
  { label: 'Support', val: '24/7', color: 'text-primary' },
];

const ecosystem = [
  { title: 'IoT Scale Integration', desc: 'Direct RS232/USB weight capture to eliminate manual-entry fraud and rounding errors.', icon: Cpu },
  { title: 'Global Cloud Architecture', desc: 'Sub-100ms latency across multi-continent showroom synchronization.', icon: Globe },
];

export default function FeaturesPage() {
  const hero = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scope = hero.current!;
      const title = scope.querySelector('[data-feat-title]') as HTMLElement;
      const split = new SplitText(title, { type: 'words', mask: 'words', autoSplit: true });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(split.words, { yPercent: 120, opacity: 0, duration: 0.9, stagger: 0.08 })
        .from('[data-feat-eyebrow]', { y: 18, autoAlpha: 0, duration: 0.6 }, 0.1)
        .from('[data-feat-sub]', { y: 24, autoAlpha: 0, duration: 0.7 }, '-=0.6')
        .from('[data-feat-visual]', { y: 50, autoAlpha: 0, scale: 0.94, duration: 1, ease: 'power2.out' }, '-=0.9');

      return () => split.revert();
    },
    { scope: hero },
  );

  return (
    <main className="min-h-screen text-foreground overflow-x-hidden">

      {/* 1. HERO */}
      <section ref={hero} className="relative px-6 pt-40 pb-16 text-center overflow-hidden">
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-primary/20 blur-[120px] -z-10"
        />

        <span
          data-feat-eyebrow
          className="inline-block rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary"
        >
          Version 1.0.0 Now Live
        </span>

        <h1
          data-feat-title
          className="mx-auto mt-8 mb-6 max-w-4xl text-5xl font-bold tracking-tight md:text-8xl"
        >
          The Operating System <br /> for <span className="italic text-primary">Excellence.</span>
        </h1>

        <p
          data-feat-sub
          className="mx-auto max-w-2xl text-xl leading-relaxed text-foreground/80"
        >
          AurumOS unifies every facet of your jewellery enterprise — from raw gold
          weigh-ins to retail hallmarking — into a single, high-fidelity command center.
        </p>

        <div data-feat-visual className="mx-auto mt-16 w-full max-w-md">
          <GemCanvas className="mx-auto w-full max-w-md" height={360} />
        </div>
      </section>

      {/* 2. LIVE METRICS */}
      <section className="border-y border-border bg-card/50 py-12 backdrop-blur-sm">
        <Reveal
          as="div"
          stagger={0.1}
          y={20}
          className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1 text-center">
              <div className="text-xs font-bold uppercase tracking-tighter text-foreground/40">{stat.label}</div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.val}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* 3. CORE PILLARS */}
      <section id="pillars" className="mx-auto max-w-7xl px-6 py-32">
        <div className="mb-16 flex max-w-xl flex-col gap-4">
          <SplitHeading
            as="h2"
            text="Built for Scale. Calibrated for Precision."
            className="text-4xl font-bold tracking-tight md:text-5xl"
          />
          <Reveal as="p" y={20} className="text-foreground/60">
            Every module is engineered to eliminate the friction of manual administration.
          </Reveal>
        </div>

        <Reveal as="div" stagger={0.12} y={50} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <TiltCard key={feature.title} tilt={7} className="rounded-3xl">
                <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border/60 bg-white/70 p-8 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-2xl hover:shadow-primary/10">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-x-12 -top-16 h-40 -rotate-12 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:translate-x-40 group-hover:opacity-100"
                  />
                  <div>
                    <div className="relative mb-6 inline-flex rounded-2xl bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="relative mb-3 text-xl font-bold">{feature.title}</h3>
                    <p className="relative leading-relaxed text-foreground/70">{feature.desc}</p>
                  </div>
                  <div className="relative mt-8 flex items-center gap-2 text-sm font-bold text-primary">
                    <Check className="size-4" /> {feature.advantage}
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </Reveal>
      </section>

      {/* 4. HARDWARE ECOSYSTEM */}
      <section id="ecosystem" className="bg-primary/5 px-6 py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-20 lg:grid-cols-2">
          <Reveal as="div" y={40} className="space-y-8">
            <SplitHeading
              as="h2"
              text="The Hardware Ecosystem."
              className="text-4xl font-bold tracking-tight md:text-6xl"
            />
            <p className="text-lg leading-relaxed text-foreground/70">
              AurumOS doesn&apos;t just sit in the cloud. It breathes with your showroom —
              natively integrating industrial electronic scales, barcode scanners, and
              thermal tag printers.
            </p>

            <div className="space-y-6">
              {ecosystem.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-6">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold">{item.title}</h4>
                      <p className="text-foreground/50">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal y={50} className="flex justify-center">
            <div className="relative aspect-square w-full max-w-md rounded-full border border-primary/10 bg-gradient-to-br from-primary/20 to-transparent p-12">
              <div
                aria-hidden
                className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-primary/20"
                style={{ animationDuration: '20s' }}
              />
              <div className="relative flex size-full items-center justify-center rounded-full border border-border bg-background shadow-2xl">
                <Globe className="absolute size-20 text-primary/20 opacity-20" />
                <Fingerprint className="size-28 animate-pulse text-primary" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. DATA SOVEREIGNTY */}
      <section className="px-6 py-24">
        <Reveal
          y={50}
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[40px] bg-foreground p-12 text-background md:p-24"
        >
          <div className="relative z-10 grid items-center gap-16 lg:grid-cols-2">
            <div className="space-y-8">
              <SplitHeading
                as="h2"
                text="Your Data. Your Sovereignty."
                className="text-4xl font-bold tracking-tighter text-background md:text-6xl"
              />
              <p className="text-lg text-background/60">
                In the jewellery trade, privacy is as valuable as the inventory. AurumOS uses a
                Zero-Knowledge architecture — only you hold the keys to your financial legacy.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-full border border-background/20 px-6 py-3">
                  <Lock className="size-[18px] text-primary" /> Bank-Grade Encryption
                </div>
                <div className="flex items-center gap-2 rounded-full border border-background/20 px-6 py-3">
                  <Fingerprint className="size-[18px] text-primary" /> Multi-Factor RBAC
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-background/10 bg-background/5 p-8 backdrop-blur-md">
                <History className="mb-4 text-primary" />
                <h4 className="mb-2 text-xl font-bold">Immutable Audit Logs</h4>
                <p className="text-sm text-background/50">
                  Every weight adjustment, sale, and login is timestamped into an unalterable
                  digital ledger.
                </p>
              </div>
            </div>
          </div>
          <div aria-hidden className="absolute top-0 right-0 size-96 rounded-full bg-primary/20 blur-[120px]" />
        </Reveal>
      </section>

      {/* 6. FOUNDER'S PLEDGE */}
      <section className="mx-auto max-w-4xl px-6 py-32 text-center">
        <Reveal as="div" y={30}>
          <p className="text-2xl font-medium leading-relaxed italic text-foreground/80 md:text-3xl">
            &ldquo;We aren&apos;t building a software company. We are building a trust ecosystem.
            AurumOS is my personal commitment to ensuring the jewellery trade operates with the
            absolute digital integrity it deserves.&rdquo;
          </p>
          <div className="mt-12">
            <div className="mb-2 font-['Dancing_Script',_cursive] text-5xl text-primary">Jenil Dholakiya</div>
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-foreground/40">Strategic Founder &amp; CTO</div>
          </div>
        </Reveal>
      </section>

      {/* 7. FINAL CONVERSION HUB */}
      <section className="border-t border-border px-6 py-32">
        <div className="mx-auto max-w-3xl space-y-12 text-center">
          <SplitHeading
            as="h2"
            text="Calibrate your Business today."
            className="text-5xl font-bold tracking-tight md:text-7xl"
          />
          <Reveal as="div" y={20} className="flex flex-col justify-center gap-4 md:flex-row">
            <Button asChild size="lg" className="h-12 rounded-2xl px-8 text-lg shadow-xl shadow-primary/20">
              <Link href="/#contact">
                Request Private Demo <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl px-8 text-lg">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </Reveal>
          <p className="text-sm italic text-foreground/40">
            Join 120+ high-performance showrooms already using AurumOS.
          </p>
        </div>
      </section>

    </main>
  );
}
