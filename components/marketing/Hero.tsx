'use client';
import { useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { gsap, SplitText, useGSAP } from '@/components/anim/gsap/register';

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scope = root.current!;

      // --- Headline: SplitText into masked words, cascade up on load ---
      const title = scope.querySelector('[data-hero-title]') as HTMLElement;
      const split = new SplitText(title, {
        type: 'words',
        mask: 'words',
        autoSplit: true,
      });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(split.words, {
        yPercent: 120,
        opacity: 0,
        duration: 0.9,
        stagger: 0.08,
      })
        .from('[data-hero-eyebrow]', { y: 18, autoAlpha: 0, duration: 0.6 }, 0.1)
        .from('[data-hero-sub]', { y: 24, autoAlpha: 0, duration: 0.7 }, '-=0.6')
        .from('[data-hero-cta]', { y: 20, autoAlpha: 0, duration: 0.6, stagger: 0.12 }, '-=0.45')
        .from(
          '[data-hero-visual]',
          { y: 50, autoAlpha: 0, scale: 0.94, duration: 1, ease: 'power2.out' },
          '-=0.9',
        );

      // --- Scroll-scrubbed parallax (transform/opacity only) ---
      gsap.to('[data-hero-text]', {
        yPercent: -14,
        ease: 'none',
        scrollTrigger: { trigger: scope, start: 'top top', end: 'bottom top', scrub: 1 },
      });
      gsap.to('[data-hero-visual]', {
        yPercent: 16,
        ease: 'none',
        scrollTrigger: { trigger: scope, start: 'top top', end: 'bottom top', scrub: 1 },
      });

      // --- Magnetic CTAs ---
      gsap.utils.toArray<HTMLElement>('[data-magnetic]').forEach((btn) => {
        const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
        const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
        const move = (e: PointerEvent) => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
        };
        const leave = () => {
          xTo(0);
          yTo(0);
        };
        btn.addEventListener('pointermove', move);
        btn.addEventListener('pointerleave', leave);
        // store for cleanup
        (btn as HTMLElement & { _cleanup?: () => void })._cleanup = () => {
          btn.removeEventListener('pointermove', move);
          btn.removeEventListener('pointerleave', leave);
        };
      });

      return () => {
        split.revert();
        scope
          .querySelectorAll<HTMLElement>('[data-magnetic]')
          .forEach((b) => (b as HTMLElement & { _cleanup?: () => void })._cleanup?.());
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex flex-col items-center justify-center px-6 pb-32 pt-24 overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute -z-10 top-0 h-full w-full bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-rose-100/30 via-background to-background" />

      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        {/* Text Content */}
        <div data-hero-text className="space-y-8">
          <span
            data-hero-eyebrow
            className="inline-block cursor-default rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-primary"
          >
            Jewellery ERP for Wholesalers &amp; Retailers
          </span>

          <h1
            data-hero-title
            className="text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-7xl"
          >
            Precision. Luxury. <br />
            <span className="italic text-primary">Synchronized.</span>
          </h1>

          <p data-hero-sub className="max-w-lg text-xl leading-relaxed text-foreground/80">
            AurumOS unifies wholesale inventory, retail point-of-sale, and hallmarking
            compliance into one beautifully engineered command core — so your craft
            stays the focus, not the paperwork.
          </p>

          <div className="flex gap-4 pt-4">
            <Button
              data-magnetic
              data-hero-cta
              size="lg"
              className="h-12 rounded-full bg-primary px-8 text-lg shadow-xl shadow-primary/20 transition-shadow hover:bg-primary/90 hover:shadow-primary/30 cursor-pointer"
            >
              Request Demo
            </Button>
            <Button
              data-magnetic
              data-hero-cta
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-border px-8 text-lg transition-colors cursor-pointer"
            >
              View Features
            </Button>
          </div>
        </div>

        {/* Floating Dashboard Preview */}
        <div
          data-hero-visual
          className="group relative cursor-pointer"
          onClick={() => window.open('/dashboard.png', '_blank')}
        >
          <div className="rounded-3xl border border-border/50 bg-white/50 p-2 shadow-2xl backdrop-blur-sm transition-transform duration-500 group-hover:scale-[1.02]">
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
          <div className="absolute -bottom-10 -right-10 -z-10 size-40 rounded-full bg-primary/20 blur-3xl" />
        </div>
      </div>
    </section>
  );
}
