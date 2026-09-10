'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/components/anim/gsap/register';

type MarqueeProps = {
  items: string[];
  speed?: number;
  className?: string;
};

export default function Marquee({ items, speed = 30, className = '' }: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const track = containerRef.current.querySelector('[data-marquee-track]') as HTMLElement;
      if (!track) return;

      const totalWidth = track.scrollWidth / 2;

      gsap.to(track, {
        x: -totalWidth,
        duration: totalWidth / speed,
        ease: 'none',
        repeat: -1,
      });
    },
    { scope: containerRef, dependencies: [speed] },
  );

  const repeatedItems = [...items, ...items];

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Gradient fades on edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />

      <div data-marquee-track className="flex w-max gap-8 py-4">
        {repeatedItems.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-3 whitespace-nowrap text-sm font-medium text-foreground/30 select-none"
          >
            <span className="size-1.5 rounded-full bg-primary/30" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
