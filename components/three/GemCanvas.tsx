'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { GemScrollRef } from './gemScroll';
// NOTE: useReducedMotion is kept from framer-motion purely to detect the
// user's preference; all animation itself is driven by GSAP / three.js.

// three.js + r3f are loaded ONLY when this canvas scrolls into view, keeping
// them out of the initial bundle (critical for Lighthouse Performance).
const GemScene = dynamic(() => import('./GemScene'), {
  ssr: false,
  loading: () => null,
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
    const el = wrapRef.current;
    if (!el) return;
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
    return () => observer.disconnect();
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
