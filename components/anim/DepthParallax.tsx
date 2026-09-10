'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/components/anim/gsap/register';

type DepthLayerProps = {
  children: React.ReactNode;
  className?: string;
  /** Depth multiplier — higher = moves faster (foreground). Negative = moves slower (background) */
  depth?: number;
};

/**
 * Wraps children in a parallax layer. Nest multiple DepthLayer components
 * inside a DepthScene to create 2.5D scroll-linked depth.
 */
export function DepthLayer({
  children,
  className = '',
  depth = 1,
}: DepthLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      gsap.to(ref.current, {
        y: () => depth * -120,
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.3,
        },
      });
    },
    { scope: ref, dependencies: [depth] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

type DepthSceneProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Container for DepthLayer children. Sets up the perspective context
 * for the 2.5D parallax effect.
 */
export function DepthScene({
  children,
  className = '',
}: DepthSceneProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ perspective: '1200px' }}
    >
      {children}
    </div>
  );
}

/**
 * Scroll-linked blur + opacity fade based on distance from viewport center.
 * Elements far from center get blurred and dimmed — creates depth of field.
 */
export function ScrollFocus({
  children,
  className = '',
  maxBlur = 4,
  range = 300,
}: {
  children: React.ReactNode;
  className?: string;
  maxBlur?: number;
  range?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      gsap.to(ref.current, {
        scrollTrigger: {
          trigger: ref.current,
          start: `top ${50 - range / 10}%`,
          end: `bottom ${50 + range / 10}%`,
          scrub: 0.5,
          onUpdate: (self) => {
            const el = ref.current;
            if (!el) return;
            // Distance from center (0 = center, 1 = edge)
            const dist = Math.abs(self.progress - 0.5) * 2;
            const blur = dist * maxBlur;
            const opacity = 1 - dist * 0.3;
            el.style.filter = `blur(${blur}px)`;
            el.style.opacity = `${opacity}`;
          },
        },
      });
    },
    { scope: ref, dependencies: [maxBlur, range] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
