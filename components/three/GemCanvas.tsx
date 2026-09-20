'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { GemScrollRef } from './gemScroll';
// NOTE: useReducedMotion is kept from framer-motion purely to detect the
// user's preference; all animation itself is driven by GSAP / three.js.

// three.js + r3f are loaded ONLY when this canvas scrolls into view, keeping
// them out of the initial bundle (critical for Lighthouse Performance).
// The chunk is PRE-COMPILED shortly after page load (see effect below) so
// dev-mode's slow three.js compile finishes before the user scrolls here.
const GemScene = dynamic(() => import('./GemScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
    </div>
  ),
});

type GemCanvasProps = {
  className?: string;
  height?: number;
  /** Shared scroll state; when provided the gem's rotation is driven by scroll. */
  progressRef?: GemScrollRef;
};

export default function GemCanvas({ className = '', height = 360, progressRef }: GemCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    // Warm the three.js chunk shortly after page load so its (slow, ~1MB)
    // compile finishes before the user scrolls here. Mounting still waits
    // for intersection below — this only pre-compiles the code.
    const warm = setTimeout(() => {
      void import('./GemScene');
    }, 2500);
    const el = wrapRef.current;
    if (!el) return () => clearTimeout(warm);
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      // Negative bottom margin: the hero is a full viewport tall, so the gem
      // canvas sits right at the fold. A positive margin would fire this
      // immediately on load and pull the ~890KB three.js chunk into the initial
      // bundle (killing TBT). Requiring it to be ~30% into view keeps three.js
      // off the critical path until the user actually scrolls to it.
      { rootMargin: '0px 0px -30% 0px' },
    );
    observer.observe(el);
    return () => {
      clearTimeout(warm);
      observer.disconnect();
    };
  }, []);

  // Auto-rotate whenever the gem is on screen (no hover required). The render
  // loop only runs while in view, so it costs nothing once scrolled away.
  // Reduced-motion users get a single static frame instead of continuous spin.
  const frameloop = inView && !reduced ? 'always' : 'demand';

  return (
    <div ref={wrapRef} className={`relative ${className}`} style={{ height }}>
      {inView && (
        <GemScene frameloop={frameloop} className="!absolute inset-0" progressRef={progressRef} />
      )}
    </div>
  );
}
