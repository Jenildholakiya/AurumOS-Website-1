'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/components/anim/gsap/register';

type ParallaxProps = {
  children: React.ReactNode;
  className?: string;
  /** Vertical offset in px — positive moves down, negative moves up */
  y?: number;
  /** Speed factor — higher = more movement */
  speed?: number;
};

/**
 * Scroll-linked parallax effect. The element moves at a different rate than
 * the page scroll, creating depth. Uses GSAP ScrollTrigger scrub.
 */
export default function Parallax({
  children,
  className = '',
  y = -80,
  speed = 1,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      gsap.to(ref.current, {
        y: y * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5,
        },
      });
    },
    { scope: ref, dependencies: [y, speed] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
