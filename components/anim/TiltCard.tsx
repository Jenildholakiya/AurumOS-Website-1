'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/components/anim/gsap/register';

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees at the card edges. */
  tilt?: number;
  glow?: boolean;
};

/**
 * Interactive 3D tilt card driven by GSAP. A pointer-following cursor tracks
 * the pointer (quickTo for buttery smoothing) and paints a rose-gold glow that
 * follows the cursor. Pure transform/opacity — no layout thrash, no jank.
 */
export default function TiltCard({
  children,
  className = '',
  tilt = 8,
  glow = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      gsap.set(el, { transformPerspective: 900 });
      const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
      const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rotY(px * tilt * 2);
        rotX(-py * tilt * 2);
        if (glowRef.current) {
          gsap.set(glowRef.current, {
            opacity: 1,
            background: `radial-gradient(260px circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(199,123,107,0.20), transparent 62%)`,
          });
        }
      };
      const onLeave = () => {
        rotX(0);
        rotY(0);
        if (glowRef.current) gsap.to(glowRef.current, { opacity: 0, duration: 0.3 });
      };

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
      return () => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={`group/tilt relative [transform-style:preserve-3d] ${className}`}>
      {children}
      {glow && (
        <span
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0"
        />
      )}
    </div>
  );
}
