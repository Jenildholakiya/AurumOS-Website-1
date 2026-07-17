'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
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
};

export default function GemCanvas({ className = '', height = 360 }: GemCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '300px' },
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
      {inView && <GemScene frameloop={frameloop} className="!absolute inset-0" />}
    </div>
  );
}
