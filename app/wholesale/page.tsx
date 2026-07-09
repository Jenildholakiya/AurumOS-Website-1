'use client';
import { motion } from 'framer-motion';
import {
  ArrowRight, ShieldCheck, Box, RefreshCw,
  BarChart3, Globe, Zap, Layers, Database, TrendingUp,
  Truck, ArrowUpRight
} from 'lucide-react';
import GemCanvas from "@/components/three/GemCanvas";

// Animation Constants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function WholesalePage() {
  return (
    <main className="min-h-screen text-foreground overflow-x-hidden">
      
      {/* 1. VISIONARY HERO */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4 -z-10" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <span className="px-4 py-1.5 rounded-full border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest bg-primary/5">
              Enterprise Command Center
            </span>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9]">
              Wholesale <br /> <span className="text-primary">Command.</span>
            </h1>
            <p className="text-xl text-foreground/80 max-w-lg leading-relaxed">
              Managing 10,000+ SKUs across multiple continents requires more than software. It requires an <strong>Intelligence Core.</strong>
            </p>
            <div className="flex gap-4">
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-primary/20">
                Onboard Warehouse
              </button>
              <button className="border border-border px-8 py-4 rounded-2xl font-bold hover:bg-card transition-all">
                System Specs
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative hidden lg:block"
          >
            <div className="bg-card border border-border p-8 rounded-[40px] shadow-2xl relative z-10">
               <div className="flex justify-between items-center mb-8">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-foreground/40 font-bold uppercase">Live Inventory Value</div>
                    <div className="text-2xl font-bold">₹84.22 Cr</div>
                  </div>
               </div>
               <div className="space-y-4">
                  {[72, 54, 88].map((w, i) => (
                    <div key={i} className="h-4 bg-primary/5 rounded-full w-full overflow-hidden">
                       <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${w}%` }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                        className="h-full bg-primary/40"
                       />
                    </div>
                  ))}
               </div>
            </div>
            {/* Floating Orbs */}
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-10 -right-10 size-32 bg-primary/20 rounded-full blur-3xl" />
            <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -bottom-10 -left-10 size-32 bg-primary/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* 2. THE SYNC ENGINE: Animated Logic */}
      <section className="py-24 px-6 bg-card/50 border-y border-border">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          {[
            { label: "Global Sync", val: "< 85ms", desc: "Real-time branch updates", icon: RefreshCw },
            { label: "Bulk Capacity", val: "100k+", desc: "SKU limit per location", icon: Layers },
            { label: "API Integrity", val: "99.9%", desc: "Uptime guarantee", icon: Database },
            { label: "Audit Speed", val: "Instant", desc: "Digital HUID mapping", icon: ShieldCheck },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="space-y-3"
            >
              <div className="text-primary"><stat.icon size={24} /></div>
              <div className="text-3xl font-bold">{stat.val}</div>
              <div className="text-sm font-bold uppercase tracking-tighter text-foreground/40">{stat.label}</div>
              <p className="text-xs text-foreground/50">{stat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. BENTO MODULES: The Wholesale Pillars */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          {/* Main Module */}
          <motion.div variants={itemVariants} className="md:col-span-8 p-10 rounded-[32px] border bg-card flex flex-col justify-between group hover:border-primary/50 transition-all">
            <div className="max-w-md space-y-4">
              <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Box size={32} />
              </div>
              <h3 className="text-4xl font-bold">Intelligent <br />Batch Processing</h3>
              <p className="text-foreground/60 text-lg">
                Upload 1,000+ items via HUID Excel or Direct Scanner integration. Our system automatically calibrates weight discrepancies and hallmark logs.
              </p>
            </div>
            <div className="mt-12 flex gap-4 overflow-hidden">
               {[1,2,3,4].map(i => <div key={i} className="size-16 rounded-xl bg-primary/5 border border-primary/10 animate-pulse" />)}
            </div>
          </motion.div>

          {/* Secondary Module */}
          <motion.div variants={itemVariants} className="md:col-span-4 p-10 rounded-[32px] border bg-foreground text-background flex flex-col justify-between">
            <h3 className="text-2xl font-bold">B2B Trade <br />Portal.</h3>
            <p className="text-background/50 text-sm">
              Give your retailers a private dashboard to browse collections, view real-time gold rates, and place bulk orders without a single phone call.
            </p>
            <button className="mt-8 size-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-all">
              <ArrowUpRight />
            </button>
          </motion.div>

          {/* Logistics Module */}
          <motion.div variants={itemVariants} className="md:col-span-4 p-10 rounded-[32px] border bg-card hover:border-primary/50 transition-all">
            <Truck className="text-primary mb-6" />
            <h3 className="text-xl font-bold mb-2">Branch Transfers</h3>
            <p className="text-sm text-foreground/50">Secure "In-Transit" status tracking for moving gold between showrooms with digital OTP verification.</p>
          </motion.div>

          {/* Analytics Module */}
          <motion.div variants={itemVariants} className="md:col-span-8 p-10 rounded-[32px] border bg-card hover:border-primary/50 transition-all flex items-center gap-8">
            <div className="hidden md:block size-32 rounded-full border-8 border-primary/10 border-t-primary animate-spin" />
            <div className="space-y-2">
               <h3 className="text-xl font-bold">Metal Volatility Guard</h3>
               <p className="text-sm text-foreground/50 leading-relaxed">
                 AurumOS automatically re-calculates your total wholesale inventory value based on live LBMA gold rates, protecting your margins against market swings.
               </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 4. THE VIRTUAL VAULT: Security Deep Dive */}
      <section className="py-32 px-6 bg-primary/5 relative">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-block p-6 rounded-full bg-background border border-primary/20 shadow-2xl"
          >
            <ShieldCheck size={64} className="text-primary" />
          </motion.div>
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">The Virtual Vault.</h2>
            <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
              Every wholesale transaction is backed by **Temporal Logic.** This means you can "Time Travel" through your ledger to see exact stock states at any second in history.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { t: "Conflict Resolution", d: "Automatic flagging of weight mismatches." },
              { t: "Role Access", d: "Restrict warehouse access by IP & Device." },
              { t: "Immutable Logs", d: "Deletion-proof transaction history." },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-background border border-border">
                <h4 className="font-bold mb-1">{item.t}</h4>
                <p className="text-xs text-foreground/50">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. GLOBAL REACH SECTION */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-1/2 space-y-8">
            <h2 className="text-5xl font-bold tracking-tight">One Warehouse. <br />Global Visibility.</h2>
            <p className="text-lg text-foreground/60">
              Whether your stock is in a vault in Mumbai, a showroom in Dubai, or a workshop in Surat, AurumOS provides a unified "Single Source of Truth."
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 font-bold">
                <Globe className="text-primary" /> Multi-Currency Support
              </div>
              <div className="flex items-center gap-3 font-bold">
                <Zap className="text-primary" /> Auto-Tax Calibration (GST/VAT)
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
             <GemCanvas className="mx-auto w-full max-w-md" height={420} />
          </div>
        </div>
      </section>

      {/* 6. FINAL WHOLESALE CTA */}
      <section className="py-32 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto bg-primary p-12 md:p-24 rounded-[60px] text-primary-foreground text-center space-y-8 shadow-2xl shadow-primary/40"
        >
          <h2 className="text-4xl md:text-7xl font-bold tracking-tighter">Ready to scale bulk?</h2>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto font-medium">
            Join the elite wholesalers who have eliminated 90% of their operational errors using the AurumOS Command engine.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
             <button className="bg-background text-foreground px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-all">
               Book a Technical Walkthrough
             </button>
             <button className="bg-primary-foreground/10 border border-primary-foreground/20 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-primary-foreground/20 transition-all">
               Contact Enterprise Sales
             </button>
          </div>
        </motion.div>
      </section>

    </main>
  );
}