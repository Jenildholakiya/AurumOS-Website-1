'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/components/anim/gsap/register';

type StaggeredRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger order: 'random' | 'start' | 'center' | 'edges' | 'end' */
  from?: 'random' | 'start' | 'center' | 'edges' | 'end';
  /** Delay between each child in seconds */
  stagger?: number;
  /** Y travel distance */
  y?: number;
  /** Extra rotation range in degrees */
  rotation?: number;
  /** Extra scale range */
  scale?: number;
  start?: string;
};

/**
 * Staggered grid reveal with unique motion paths per card.
 * Each child enters with slightly different y, rotation, and scale
 * for a premium, organic feel.
 */
export default function StaggeredReveal({
  children,
  className = '',
  from = 'random',
  stagger = 0.1,
  y = 60,
  rotation = 3,
  scale = 0.92,
  start = 'top 85%',
}: StaggeredRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const children_arr = Array.from(el.children) as HTMLElement[];
      if (!children_arr.length) return;

      const rotations = children_arr.map((_, i) =>
        from === 'random'
          ? gsap.utils.random(-rotation, rotation)
          : i % 2 === 0
          ? -rotation
          : rotation,
      );

      gsap.from(children_arr, {
        y,
        rotation: (i: number) => rotations[i],
        scale,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: { each: stagger, from },
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
        },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
