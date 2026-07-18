'use client';
import { motion, useScroll, useSpring } from 'framer-motion';

/** Rose-gold scroll-progress bar pinned to the top. Uses framer-motion's
 *  useScroll (already in the bundle) instead of GSAP, so no extra animation
 *  library is pulled into the initial load. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[60] h-0.5 origin-left bg-primary"
    />
  );
}
