'use client';
import { motion, type HTMLMotionProps } from 'framer-motion';

type StaggerProps = HTMLMotionProps<'div'> & {
  stagger?: number;
  delayChildren?: number;
};

/** Container that reveals children one-by-one. Use with <StaggerItem>. */
export function Stagger({ children, className, stagger = 0.09, delayChildren = 0.05, ...rest }: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Single item animated by its parent <Stagger>. */
export function StaggerItem({ children, className, y = 24, ...rest }: HTMLMotionProps<'div'> & { y?: number }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
