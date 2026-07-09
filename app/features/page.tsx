'use client';
import { motion } from 'framer-motion';
import {
  BarChart3, ShieldCheck, Warehouse, Zap, Users, ReceiptText,
  Lock, Fingerprint, History, Cpu, Globe, ArrowRight, Check
} from 'lucide-react';
import Image from 'next/image';
import GemCanvas from "@/components/three/GemCanvas";

// Animation Variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" as const }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } }
};

const features = [
  { title: "Wholesale Command", desc: "Master multi-location inventory with automated replenishment.", advantage: "Reduces 'dead stock' by 40%.", icon: Warehouse },
  { title: "Retail Point-of-Sale", desc: "High-speed billing interface for high-traffic showrooms.", advantage: "Instant HUID verification.", icon: Zap },
  { title: "HUID Compliance", desc: "Automated hallmarking logs & regulatory audit trails.", advantage: "100% Audit-ready documentation.", icon: ShieldCheck },
  { title: "Executive Analytics", desc: "Interactive dashboards for revenue and weight tracking.", advantage: "Real-time metal margin visibility.", icon: BarChart3 },
  { title: "Smart Ledger", desc: "A relationship-first engine for credit & loyalty.", advantage: "Automated gold-savings tracking.", icon: ReceiptText },
  { title: "Staff Management", desc: "Granular workforce oversight & performance tracking.", advantage: "KPI-driven sales incentives.", icon: Users },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen text-foreground overflow-x-hidden">
      
      {/* 1. HERO SECTION: Animated Reveal */}
      <section className="relative pt-40 pb-24 px-6 text-center overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 left-1/2 -translate-x-1/2 size-[600px] bg-primary/20 rounded-full blur-[120px] -z-10" 
        />
        
        <motion.span 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-4 py-1.5 rounded-full border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest bg-primary/5"
        >
          Version 1.0.0 Now Live
        </motion.span>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-5xl md:text-8xl font-bold tracking-tight mt-8 mb-6"
        >
          The Operating System <br /> for <span className="text-primary italic">Excellence.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed"
        >
          AurumOS unifies every facet of your jewellery enterprise—from raw gold weigh-ins to retail hallmarking—into a single, high-fidelity command center.
        </motion.p>
      </section>

      {/* 1B. INTERACTIVE 3D CORE */}
      <section className="pb-16 px-6 max-w-3xl mx-auto">
        <GemCanvas className="mx-auto w-full max-w-md" height={360} />
      </section>

      {/* 2. LIVE METRICS TICKER */}
      <section className="py-12 border-y border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "System Uptime", val: "99.99%", color: "text-emerald-500" },
            { label: "HUIDs Verified", val: "1.2M+", color: "text-primary" },
            { label: "Data Integrity", val: "100%", color: "text-primary" },
            { label: "Support", val: "24/7", color: "text-primary" },
          ].map((stat, i) => (
            <motion.div key={i} {...fadeInUp} transition={{ delay: i * 0.1 }} className="text-center space-y-1">
              <div className="text-xs font-bold uppercase tracking-tighter text-foreground/40">{stat.label}</div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.val}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. CORE PILLARS: Bento Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Built for Scale. <br />Calibrated for Precision.</h2>
            <p className="text-foreground/60">Every module is engineered to eliminate the friction of manual administration.</p>
          </div>
          <button className="text-primary font-bold flex items-center gap-2 hover:gap-4 transition-all">
            Explore Documentation <ArrowRight size={20} />
          </button>
        </div>

        <motion.div 
          variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div 
              key={i} variants={fadeInUp} whileHover={{ y: -10 }}
              className="group p-8 rounded-3xl border bg-card hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="mb-6 inline-block p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <feature.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-foreground/60 leading-relaxed mb-8">{feature.desc}</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                <Check size={16} /> {feature.advantage}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 4. HARDWARE ECOSYSTEM: The Technical Edge */}
      <section className="py-32 px-6 bg-primary/5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <motion.div {...fadeInUp} className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">The Hardware <br />Ecosystem.</h2>
            <p className="text-lg text-foreground/70 leading-relaxed">
              AurumOS doesn't just sit in the cloud. It breathes with your showroom. We provide native integration with industrial electronic scales, barcode scanners, and thermal tag printers.
            </p>
            
            <div className="space-y-6">
              {[
                { title: "IoT Scale Integration", desc: "Direct RS232/USB weight capturing to prevent manual entry fraud.", icon: Cpu },
                { title: "Global Cloud Architecture", desc: "Sub-100ms latency across multi-continent showroom sync.", icon: Globe },
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="size-12 rounded-xl bg-background flex items-center justify-center shrink-0 border border-border">
                    <item.icon className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl">{item.title}</h4>
                    <p className="text-foreground/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
            className="relative aspect-square bg-gradient-to-br from-primary/20 to-transparent rounded-full border border-primary/10 flex items-center justify-center p-12"
          >
             <motion.div 
               animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-full" 
             />
             <div className="relative size-full bg-background rounded-full border border-border flex items-center justify-center shadow-2xl">
                <Warehouse size={80} className="text-primary/20 absolute opacity-20" />
                <Fingerprint size={120} className="text-primary animate-pulse" />
             </div>
          </motion.div>
        </div>
      </section>

      {/* 5. DATA SOVEREIGNTY: High-Trust Banner */}
      <section className="py-24 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-7xl mx-auto bg-foreground text-background rounded-[40px] p-12 md:p-24 overflow-hidden relative"
        >
          <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">Your Data. <br />Your Sovereignty.</h2>
              <p className="text-background/60 text-lg">
                In the jewellery trade, privacy is as valuable as the inventory. AurumOS utilizes a Zero-Knowledge architecture, ensuring only you hold the keys to your financial legacy.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-3 rounded-full border border-background/20 flex items-center gap-2">
                  <Lock size={18} className="text-primary" /> Bank-Grade Encryption
                </div>
                <div className="px-6 py-3 rounded-full border border-background/20 flex items-center gap-2">
                  <Fingerprint size={18} className="text-primary" /> Multi-Factor RBAC
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
               <div className="p-8 rounded-3xl bg-background/5 border border-background/10 backdrop-blur-md">
                 <History className="text-primary mb-4" />
                 <h4 className="font-bold text-xl mb-2">Immutable Audit Logs</h4>
                 <p className="text-background/50 text-sm">Every weight adjustment, every sale, and every system login is timestamped in an unalterable digital ledger.</p>
               </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 size-96 bg-primary/20 blur-[120px] rounded-full" />
        </motion.div>
      </section>

      {/* 6. THE FOUNDER'S PLEDGE */}
      <section className="py-32 px-6 max-w-4xl mx-auto text-center">
        <motion.div {...fadeInUp}>
          <p className="text-2xl md:text-3xl font-medium leading-relaxed italic text-foreground/80">
            "We aren't building a software company. We are building a trust ecosystem. AurumOS is my personal commitment to ensuring the jewellery trade operates with the absolute digital integrity it deserves."
          </p>
          <div className="mt-12">
            <div className="font-['Dancing_Script',_cursive] text-5xl text-primary mb-2">Jenil Dholakiya</div>
            <div className="text-xs uppercase tracking-[0.3em] font-bold text-foreground/40">Strategic Founder & CTO</div>
          </div>
        </motion.div>
      </section>

      {/* 7. FINAL CONVERSION HUB */}
      <section className="py-32 px-6 border-t border-border">
         <div className="max-w-3xl mx-auto text-center space-y-12">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight">Calibrate your <br />Business today.</h2>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button className="px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-primary/20">
                Request Private Demo
              </button>
              <button className="px-10 py-5 rounded-2xl border border-border font-bold text-lg hover:bg-card transition-all">
                View Pricing
              </button>
            </div>
            <p className="text-foreground/40 text-sm italic">Join 120+ High-Performance Showrooms already using AurumOS.</p>
         </div>
      </section>

    </main>
  );
}