'use client';
import { useRef } from 'react';
import GemCanvas from '@/components/three/GemCanvas';
import ScrollStage from '@/components/anim/ScrollStage';
import { gsap, useGSAP } from '@/components/anim/gsap/register';
import SplitHeading from '@/components/anim/SplitHeading';
import Reveal from '@/components/anim/Reveal';
import Parallax from '@/components/anim/Parallax';
import MagneticButton from '@/components/ui/MagneticButton';
import MagneticText from '@/components/ui/MagneticText';

export default function GemShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const gem = sectionRef.current.querySelector('[data-gem]');
      if (gem) {
        gsap.from(gem, {
          x: 80,
          autoAlpha: 0,
          scale: 0.9,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gem,
            start: 'top 80%',
            once: true,
          },
        });
      }
    },
    { scope: sectionRef },
  );

  return (
    <ScrollStage
      id="gem"
      className="flex items-center px-6 py-24 overflow-hidden"
    >
      <div ref={sectionRef} className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div className="space-y-8">
          <Reveal as="div" y={30}>
            <MagneticText
              as="span"
              hoverColor="oklch(0.50 0.14 25)"
              strength={8}
              className="inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-primary cursor-default"
            >
              Live Product Core
            </MagneticText>
          </Reveal>

          <SplitHeading
            as="h2"
            text="Engineered with Absolute Precision."
            className="font-clash text-4xl font-bold tracking-tight md:text-5xl"
          />

          <Reveal as="p" y={20} delay={0.1} className="max-w-lg text-lg leading-relaxed text-foreground/70">
            Every surface of AurumOS is cut like a brilliant stone — balanced, reflective,
            and built to last. The core turns on its own; grab it and spin to inspect every
            facet from any angle.
          </Reveal>

          <Reveal as="div" y={20} delay={0.2}>
            <MagneticButton className="inline-flex items-center justify-center h-12 rounded-full bg-gradient-to-r from-primary to-rose-600 px-8 text-lg font-bold text-primary-foreground shadow-xl shadow-primary/20 btn-shimmer btn-glow cursor-pointer">
              Explore the Platform <span className="btn-arrow">→</span>
            </MagneticButton>
          </Reveal>
        </div>

        <div data-gem className="mx-auto w-full max-w-lg">
          <Parallax y={-40} speed={0.3}>
            <GemCanvas className="mx-auto w-full max-w-lg" height={420} />
          </Parallax>
        </div>
      </div>
    </ScrollStage>
  );
}
