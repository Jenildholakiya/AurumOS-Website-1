'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/components/anim/gsap/register';

/** Rose-gold scroll-progress bar pinned to the top, scrubbed by GSAP ScrollTrigger. */
export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      ref.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
      },
    );
  });

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed left-0 right-0 top-0 z-[60] h-0.5 origin-left bg-primary"
      style={{ transform: 'scaleX(0)' }}
    />
  );
}
