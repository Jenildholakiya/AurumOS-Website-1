'use client';
import { useRef, useEffect, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/components/anim/gsap/register';

type NumberCounterProps = {
  /** The target number to count up to */
  target: number;
  /** Optional prefix (e.g. "₹", "<") */
  prefix?: string;
  /** Optional suffix (e.g. "+", "%", "s", "ms") */
  suffix?: string;
  /** Duration in seconds */
  duration?: number;
  /** Decimal places */
  decimals?: number;
  className?: string;
};

export default function NumberCounter({
  target,
  prefix = '',
  suffix = '',
  duration = 2.5,
  decimals = 0,
  className = '',
}: NumberCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration,
        ease: 'power2.out',
        snap: { val: decimals > 0 ? Math.pow(10, -decimals) : 1 },
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: () => setHasAnimated(true),
        },
        onUpdate: () => {
          el.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`;
        },
      });
    },
    { scope: ref, dependencies: [target, duration, decimals, prefix, suffix] },
  );

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
