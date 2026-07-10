'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

// three.js + r3f are loaded ONLY when this canvas scrolls into view, keeping
// them out of the initial bundle (critical for Lighthouse Performance).
const GemScene = dynamic(() => import('./GemScene'), {
  ssr: false,
  loading: () => <GemPoster />,
});

/** CSS-only rose-gold gem used as the instant LCP visual and 3D fallback. */
function GemPoster() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
      <div
        className="relative size-40 md:size-56 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #F6DDD5 0%, #C77B6B 55%, #8E4E44 100%)',
          boxShadow: '0 24px 70px -12px rgba(199,123,107,0.55)',
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 210deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.45) 90deg, rgba(255,255,255,0) 200deg)',
          }}
        />
      </div>
    </div>
  );
}

type GemCanvasProps = {
  className?: string;
  height?: number;
};

export default function GemCanvas({ className = '', height = 360 }: GemCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
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

  // Continuous rendering ONLY while the pointer is over the gem (intentional
  // interaction). Otherwise the loop is "demand" -> zero per-frame cost while
  // idle or scrolling, so the page stays perfectly smooth.
  const frameloop = inView && !reduced && hovered ? 'always' : 'demand';

  return (
    <div
      ref={wrapRef}
      className={`relative ${className}`}
      style={{ height }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <GemPoster />
      {inView && <GemScene frameloop={frameloop} className="!absolute inset-0" />}
    </div>
  );
}
