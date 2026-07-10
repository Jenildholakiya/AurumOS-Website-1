'use client';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Scroll-linked parallax — transform/opacity only, so it stays on the
  // compositor and runs smoothly at the display's native refresh (up to 120Hz).
  const yText = useSpring(useTransform(scrollYProgress, [0, 1], [0, -90]), {
    stiffness: 80,
    damping: 20,
  });
  const yImage = useSpring(useTransform(scrollYProgress, [0, 1], [0, 70]), {
    stiffness: 80,
    damping: 20,
  });

  return (
    <section
      ref={ref}
      className="relative flex flex-col items-center justify-center pt-24 pb-32 px-6 overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-0 -z-10 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-rose-100/30 via-background to-background" />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ y: yText }}
          className="space-y-8"
        >
          <motion.span
            className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-semibold tracking-widest uppercase cursor-default"
          >
            Jewellery ERP for Wholesalers & Retailers
          </motion.span>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
            Precision. Luxury. <br />
            <span className="text-primary italic">Synchronized.</span>
          </h1>

          <p className="text-xl text-foreground/80 leading-relaxed max-w-lg">
            AurumOS is the dual-purpose command core for your entire supply chain.
            From wholesale inventory tracking to retail point-of-sale efficiency—scale your enterprise with absolute data integrity.
          </p>

          <div className="flex gap-4 pt-4">
            {/* Added cursor-pointer classes explicitly for touch/mouse UX */}
            <Button size="lg" className="rounded-full px-8 h-12 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 cursor-pointer transition-all hover:scale-105">
              Request Demo
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-lg cursor-pointer transition-all hover:scale-105">
              View Features
            </Button>
          </div>
        </motion.div>

        {/* Floating Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: 'circOut' }}
          style={{ y: yImage }}
          className="relative cursor-pointer group"
          onClick={() => window.open('/dashboard.png', '_blank')}
        >
          <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-2xl bg-white/50 backdrop-blur-sm p-2 transition-transform duration-500 group-hover:scale-[1.02]">
            <Image
              src="/dashboard.png"
              alt="AurumOS Executive Dashboard"
              width={1200}
              height={675}
              className="rounded-2xl shadow-inner w-full h-auto object-cover"
              priority
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
          </div>

          {/* Decorative blur */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
