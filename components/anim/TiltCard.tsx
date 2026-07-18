'use client';
import { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from 'framer-motion';

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees at the card edges. */
  tilt?: number;
  glow?: boolean;
};

/**
 * Interactive 3D tilt card. Pointer position drives a spring-smoothed
 * rotateX/rotateY plus a cursor-following rose-gold glow — implemented with
 * framer-motion (already bundled) so GSAP stays out of the initial load.
 * Pure transform/opacity — no layout thrash.
 */
export default function TiltCard({
  children,
  className = '',
  tilt = 8,
  glow = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0); // -0.5 .. 0.5
  const py = useMotionValue(0);

  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [tilt, -tilt]), {
    stiffness: 150,
    damping: 15,
  });
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-tilt, tilt]), {
    stiffness: 150,
    damping: 15,
  });

  const glowX = useTransform(px, [-0.5, 0.5], ['0%', '100%']);
  const glowY = useTransform(py, [-0.5, 0.5], ['0%', '100%']);
  const glowBg = useMotionTemplate`radial-gradient(260px circle at ${glowX} ${glowY}, rgba(199,123,107,0.20), transparent 62%)`;

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 900 }}
      className={`group/tilt relative [transform-style:preserve-3d] ${className}`}
    >
      {children}
      {glow && (
        <motion.span
          aria-hidden
          style={{ background: glowBg }}
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
        />
      )}
    </motion.div>
  );
}
