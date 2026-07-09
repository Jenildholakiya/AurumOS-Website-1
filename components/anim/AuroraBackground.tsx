'use client';
import { motion } from 'framer-motion';

/**
 * Global, fixed, GPU-only (transform) ambient backdrop in the Rose Gold theme.
 * Sits behind all page content; pauses automatically under prefers-reduced-motion
 * via MotionConfig. No layout shift, no heavy paint.
 */
export default function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-1/3 -left-1/4 size-[70vmax] rounded-full blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgba(199,123,107,0.16), transparent 60%)' }}
        animate={{ x: [0, 60, -20, 0], y: [0, 40, 20, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-1/3 -right-1/4 size-[65vmax] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(230,194,182,0.15), transparent 60%)' }}
        animate={{ x: [0, -50, 30, 0], y: [0, -30, 10, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
