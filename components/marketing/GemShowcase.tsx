'use client';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GemCanvas from '@/components/three/GemCanvas';

/** Home-page centerpiece that pairs copy with the interactive 3D gem. */
export default function GemShowcase() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const yGem = useSpring(useTransform(scrollYProgress, [0, 1], [60, -60]), {
    stiffness: 80,
    damping: 20,
  });

  return (
    <section ref={ref} className="relative py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-semibold tracking-widest uppercase"
          >
            Live Product Core
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            Engineered with <span className="text-primary italic">Absolute Precision.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-foreground/70 leading-relaxed max-w-lg"
          >
            Every facet of AurumOS is calibrated like a cut stone — balanced, reflective, and built to last. Hover the core to watch it turn, or drag to inspect it from any angle.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              className="rounded-full px-8 h-12 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 cursor-pointer"
            >
              Explore the Platform <ArrowRight className="ml-2 size-5" />
            </Button>
          </motion.div>
        </div>

        <motion.div style={{ y: yGem }}>
          <GemCanvas className="mx-auto w-full max-w-md" height={420} />
        </motion.div>
      </div>
    </section>
  );
}
