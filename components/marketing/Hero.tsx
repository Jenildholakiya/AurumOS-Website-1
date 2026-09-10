'use client';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ScrollStage from '@/components/anim/ScrollStage';
import { gsap, SplitText, useGSAP } from '@/components/anim/gsap/register';
import Reveal from '@/components/anim/Reveal';
import Parallax from '@/components/anim/Parallax';
import MagneticButton from '@/components/ui/MagneticButton';

export default function Hero() {
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope) return;

      const title = scope.querySelector('[data-hero-title]') as HTMLElement;
      if (!title) return;

      const split = new SplitText(title, {
        type: 'words',
        mask: 'words',
        autoSplit: true,
      });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(split.words, {
        yPercent: 120,
        opacity: 0,
        duration: 1,
        stagger: 0.06,
      })
        .from(
          '[data-hero-eyebrow]',
          { y: 20, autoAlpha: 0, duration: 0.7 },
          0.15,
        )
        .from(
          '[data-hero-sub]',
          { y: 30, autoAlpha: 0, duration: 0.8 },
          '-=0.5',
        )
        .from(
          '[data-hero-cta]',
          { y: 20, autoAlpha: 0, duration: 0.6 },
          '-=0.4',
        )
        .from(
          '[data-hero-image]',
          { y: 60, autoAlpha: 0, scale: 0.95, duration: 1.2, ease: 'power2.out' },
          '-=0.9',
        )
        .from(
          '[data-hero-glow]',
          { scale: 0, autoAlpha: 0, duration: 1.5, ease: 'power2.out' },
          '-=1.2',
        );

      return () => split.revert();
    },
    { scope: scopeRef },
  );

  return (
    <ScrollStage
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-32 pt-24"
    >
      {/* Background Glow */}
      <div className="absolute -z-10 top-0 h-full w-full bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-rose-100/30 via-background to-background" />

      {/* Floating orbs — parallax on scroll */}
      <Parallax y={-120} speed={0.6} className="absolute top-1/4 left-1/4 -z-10 pointer-events-none">
        <div
          data-hero-glow
          className="size-[500px] rounded-full bg-primary/10 blur-[120px]"
        />
      </Parallax>
      <Parallax y={80} speed={0.4} className="absolute bottom-1/4 right-1/4 -z-10 pointer-events-none">
        <div
          data-hero-glow
          className="size-[400px] rounded-full bg-rose-300/10 blur-[100px]"
        />
      </Parallax>

      <div ref={scopeRef} className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        {/* Text Content */}
        <div className="space-y-8">
          <span
            data-hero-eyebrow
            className="inline-block cursor-default rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-primary"
          >
            Jewellery ERP for Wholesalers &amp; Retailers
          </span>

          <h1
            data-hero-title
            className="font-clash text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl"
          >
            Precision. Luxury. <br />
            <span className="italic text-primary">Synchronized.</span>
          </h1>

          <p
            data-hero-sub
            className="max-w-xl text-xl leading-relaxed text-foreground/90"
          >
            AurumOS unifies wholesale inventory, retail point-of-sale, and
            hallmarking compliance into one beautifully engineered command core
            — so your craft stays the focus, not the paperwork.
          </p>

          <div data-hero-cta className="flex gap-4 pt-4">
            <Link href="/get-started">
              <MagneticButton className="inline-flex items-center justify-center h-12 rounded-full bg-primary px-8 text-base font-bold text-primary-foreground shadow-xl shadow-primary/20 btn-shimmer btn-glow cursor-pointer">
                Request Demo <span className="btn-arrow">→</span>
              </MagneticButton>
            </Link>
            <Link href="/features">
              <MagneticButton className="inline-flex items-center justify-center h-12 rounded-full border-2 border-border bg-transparent px-8 text-base font-bold text-foreground btn-border-draw cursor-pointer hover:text-primary hover:border-primary/40">
                View Features
              </MagneticButton>
            </Link>
          </div>
        </div>

        {/* Floating Dashboard Preview */}
        <div
          data-hero-image
          className="group relative cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="Open the AurumOS executive dashboard preview"
          onClick={() => window.open('/dashboard.png', '_blank')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.open('/dashboard.png', '_blank');
            }
          }}
        >
          <div className="rounded-3xl border border-border/50 bg-white/50 p-2 shadow-2xl backdrop-blur-sm transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-primary/10">
            <Image
              src="/dashboard.png"
              alt="AurumOS Executive Dashboard"
              width={1200}
              height={675}
              className="w-full h-auto rounded-2xl object-cover shadow-inner"
              priority
            />
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/10 to-transparent" />
          </div>
          <div className="absolute -bottom-10 -right-10 -z-10 size-40 rounded-full bg-primary/20 blur-3xl transition-all duration-700 group-hover:scale-150 group-hover:bg-primary/30" />
        </div>
      </div>

      {/* Scroll indicator */}
      <Reveal as="div" y={20} delay={1.5} className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-foreground/40">
          <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
          <div className="size-5 rounded-full border-2 border-foreground/20 p-1">
            <div className="size-full animate-bounce rounded-full bg-primary/40" />
          </div>
        </div>
      </Reveal>
    </ScrollStage>
  );
}
