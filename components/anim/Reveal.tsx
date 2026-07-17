'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/components/anim/gsap/register';

type RevealProps = {
  children: React.ReactNode;
  as?: 'div' | 'section' | 'ul' | 'li' | 'article' | 'header' | 'p';
  className?: string;
  /** Vertical travel distance in px. */
  y?: number;
  delay?: number;
  duration?: number;
  start?: string;
  /** When > 0, the element's direct children are revealed in a staggered sequence. */
  stagger?: number;
};

/**
 * Scroll-triggered entrance built on GSAP ScrollTrigger. Runs inside a layout
 * effect (useGSAP) so the "from" state is applied before first paint — no flash.
 * Set `stagger` to cascade direct children (e.g. a grid of cards).
 */
export default function Reveal({
  children,
  as = 'div',
  className = '',
  y = 40,
  delay = 0,
  duration = 0.9,
  start = 'top 85%',
  stagger = 0,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const targets = stagger > 0 ? Array.from(el.children) : el;
      gsap.from(targets, {
        y,
        autoAlpha: 0,
        duration,
        ease: 'power3.out',
        delay,
        stagger,
        scrollTrigger: { trigger: el, start, once: true },
      });
    },
    { scope: ref },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = as as any;
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
