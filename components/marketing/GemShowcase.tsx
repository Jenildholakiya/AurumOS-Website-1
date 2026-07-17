'use client';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GemCanvas from '@/components/three/GemCanvas';
import { gsap, SplitText, useGSAP } from '@/components/anim/gsap/register';

/** Home-page centerpiece that pairs copy with the interactive 3D gem. */
export default function GemShowcase() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scope = root.current!;

      const title = scope.querySelector('[data-gem-title]') as HTMLElement;
      const split = new SplitText(title, { type: 'words', mask: 'words', autoSplit: true });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: scope, start: 'top 70%', once: true },
        defaults: { ease: 'power3.out' },
      });
      tl.from(split.words, { yPercent: 115, opacity: 0, duration: 0.9, stagger: 0.08 })
        .from('[data-gem-eyebrow]', { y: 20, autoAlpha: 0, duration: 0.6 }, 0.1)
        .from('[data-gem-copy]', { y: 24, autoAlpha: 0, duration: 0.7 }, '-=0.6')
        .from('[data-gem-cta]', { y: 20, autoAlpha: 0, duration: 0.6 }, '-=0.45')
        .from('[data-gem-visual]', { autoAlpha: 0, scale: 0.92, duration: 1, ease: 'power2.out' }, '-=0.9');

      // Scroll-linked vertical drift on the gem itself.
      gsap.to('[data-gem-visual]', {
        y: -50,
        ease: 'none',
        scrollTrigger: { trigger: scope, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });

      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden px-6 py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div className="space-y-8">
          <span
            data-gem-eyebrow
            className="inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-primary"
          >
            Live Product Core
          </span>

          <h2
            data-gem-title
            className="text-4xl font-bold tracking-tight md:text-5xl"
          >
            Engineered with <span className="italic text-primary">Absolute Precision.</span>
          </h2>

          <p data-gem-copy className="max-w-lg text-lg leading-relaxed text-foreground/70">
            Every surface of AurumOS is cut like a brilliant stone — balanced, reflective,
            and built to last. The core turns on its own; grab it and spin to inspect every
            facet from any angle.
          </p>

          <div data-gem-cta>
            <Button
              size="lg"
              className="h-12 rounded-full bg-primary px-8 text-lg shadow-xl shadow-primary/20 transition-shadow hover:bg-primary/90 cursor-pointer"
            >
              Explore the Platform <ArrowRight className="ml-2 size-5" />
            </Button>
          </div>
        </div>

        <div data-gem-visual className="mx-auto w-full max-w-md">
          <GemCanvas className="mx-auto w-full max-w-md" height={420} />
        </div>
      </div>
    </section>
  );
}
