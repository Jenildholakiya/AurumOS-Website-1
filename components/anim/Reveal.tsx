'use client';
import { motion, type HTMLMotionProps } from 'framer-motion';

type RevealProps = HTMLMotionProps<'div'> & {
  delay?: number;
  y?: number;
};

/**
 * Scroll-triggered entrance. Respects prefers-reduced-motion globally via
 * MotionConfig in MotionProvider, so no animation runs for those users.
 */
export default function Reveal({ children, delay = 0, y = 24, className, ...rest }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98], delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
