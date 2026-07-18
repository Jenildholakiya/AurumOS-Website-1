'use client';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Lock, Fingerprint, History, Server, EyeOff,
  ShieldAlert, Cpu, Globe, Database, Key, Activity, Check
} from 'lucide-react';
import GemCanvas from "@/components/three/GemCanvas";

// Animation Variants
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, ease: "easeOut" as const }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } }
};

export default function SecurityPage() {
  return (
    <main className="min-h-screen text-foreground overflow-x-hidden">
      
      {/* 1. HERO: The Digital Vault */}
      <section className="relative pt-40 pb-24 px-6 text-center overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1] 
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-0 left-1/2 -translate-x-1/2 size-[600px] bg-primary/10 rounded-full blur-[120px] -z-10" 
        />
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="inline-block p-4 rounded-3xl bg-primary/10 text-primary mb-8"
        >
          <ShieldCheck size={64} />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter mb-8"
        >
          Digital <span className="text-primary italic">Sovereignty.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed"
        >
          We treat your data like your gold: with absolute security, total redundancy, and zero-compromise integrity. Engineered for the most demanding enterprises.
        </motion.p>
      </section>

      {/* 1B. INTERACTIVE 3D CORE */}
      <section className="pb-16 px-6 max-w-3xl mx-auto">
        <GemCanvas className="mx-auto w-full max-w-md" height={360} />
      </section>

      {/* 2. REAL-TIME THREAT MONITORING TICKER */}
      <section className="py-12 border-y border-border bg-card/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-12">
          {[
            { label: "Encryption", val: "AES-256", icon: Lock },
            { label: "Uptime", val: "99.99%", icon: Activity },
            { label: "Architecture", val: "Zero-Knowledge", icon: EyeOff },
            { label: "Compliance", val: "BIS / HUID", icon: Check },
          ].map((item, i) => (
            <motion.div key={i} {...fadeInUp} transition={{ delay: i * 0.1 }} className="flex items-center gap-3">
              <item.icon size={18} className="text-primary" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 leading-none">{item.label}</div>
                <div className="text-lg font-bold">{item.val}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. THE SECURITY PILLARS: Bento Stagger */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <motion.div 
          variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { icon: Key, title: "Owner-Only Keys", desc: "Decryption keys are generated on your device. We cannot see your data." },
            { icon: Fingerprint, title: "Biometric Access", desc: "Native integration with hardware security keys and biometric auth." },
            { icon: Globe, title: "Geographic Failover", desc: "Automatic data mirroring across 3 global secure regions." },
            { icon: ShieldAlert, title: "Instant Kill-Switch", desc: "Remote session termination and device-level locking." },
          ].map((pillar, i) => (
            <motion.div 
              key={i} variants={fadeInUp} whileHover={{ y: -10 }}
              className="p-8 rounded-[32px] border bg-card hover:border-primary/40 transition-all group"
            >
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <pillar.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">{pillar.title}</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">{pillar.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 4. TECHNICAL DEEP-DIVE: Immutability Engine */}
      <section className="py-32 px-6 bg-primary/5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <motion.div {...fadeInUp} className="space-y-8">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight">The Ledger <br /><span className="text-primary">Immutability</span> Engine.</h2>
            <p className="text-lg text-foreground/70 leading-relaxed">
              Every inventory adjustment, hallmark record, and weight calibration is cryptographically hashed. In AurumOS, <strong>history cannot be deleted.</strong> 
            </p>
            <div className="space-y-4">
              <div className="flex gap-4 p-6 rounded-2xl bg-background border border-border">
                <History className="text-primary shrink-0" />
                <div>
                  <h4 className="font-bold">Temporal Versioning</h4>
                  <p className="text-sm text-foreground/70">"Time Travel" to see any stock state at any precise millisecond in history.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl bg-background border border-border">
                <Database className="text-primary shrink-0" />
                <div>
                  <h4 className="font-bold">Checksum Validation</h4>
                  <p className="text-sm text-foreground/70">Continuous background integrity checks ensure zero database corruption.</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }}
            className="relative p-1 bg-gradient-to-br from-primary/30 to-transparent rounded-[42px]"
          >
            <div className="bg-background rounded-[40px] p-10 shadow-2xl space-y-6">
              <div className="flex gap-2">
                <div className="size-3 rounded-full bg-red-500/20" />
                <div className="size-3 rounded-full bg-amber-500/20" />
                <div className="size-3 rounded-full bg-emerald-500/20" />
              </div>
              <div className="font-mono text-sm space-y-2 text-foreground/40">
                <p className="text-primary animate-pulse">{`> initializing_secure_ledger...`}</p>
                <p>{`> [SYSTEM] item_882_sync: success`}</p>
                <p>{`> [HASH] 0x882f...a12c verified`}</p>
                <p>{`> [AUDIT] state_change_locked`}</p>
                <div className="h-px bg-border my-4" />
                <p className="text-xs italic">{`// Temporal State preserved at 2024-03-20 14:22:01.002`}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. HARDWARE-LEVEL SECURITY: Device Locking */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <motion.h2 {...fadeInUp} className="text-4xl md:text-6xl font-bold tracking-tight">Showroom Hardware <br />Locking.</motion.h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <motion.div {...fadeInUp} className="p-10 rounded-[40px] border bg-card space-y-6">
              <Cpu className="text-primary" size={40} />
              <h3 className="text-2xl font-bold">IP & Device Pinning</h3>
              <p className="text-foreground/70 leading-relaxed">
                Ensure AurumOS is only accessible from your physical showroom. Restrict logins to specific IP ranges and authorized MAC addresses, preventing unauthorized remote access.
              </p>
            </motion.div>
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="p-10 rounded-[40px] border bg-card space-y-6">
              <Lock className="text-primary" size={40} />
              <h3 className="text-2xl font-bold">Encrypted Local Cache</h3>
              <p className="text-foreground/70 leading-relaxed">
                Even during internet outages, local data is encrypted with ephemeral keys, ensuring that your inventory remains secure if a device is physically compromised.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. COMPLIANCE & REGULATORY MASTERY */}
      <section className="py-32 px-6 bg-foreground text-background overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div {...fadeInUp}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Engineered for <br />Compliance.</h2>
            <div className="space-y-6">
              {[
                { t: "BIS / HUID Standards", d: "Built-in workflows for mandatory hallmarking compliance." },
                { t: "Data Residency", d: "Sovereign cloud storage ensuring your data stays in your jurisdiction." },
                { t: "Tax Integrity", d: "Automatic GST/VAT calibration with immutable tax-invoice logs." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="size-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                    <Check size={14} className="text-background" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl">{item.t}</h4>
                    <p className="text-background/50">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
          <div className="relative h-[400px] flex items-center justify-center">
             <motion.div 
               animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 border border-primary/20 rounded-full" 
             />
             <motion.div 
               animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="absolute inset-20 border border-primary/40 rounded-full border-dashed" 
             />
             <ShieldCheck size={100} className="text-primary" />
          </div>
        </div>
        {/* Background glow */}
        <div className="absolute top-0 right-0 size-96 bg-primary/20 blur-[150px] rounded-full" />
      </section>

      {/* 7. FINAL TRUST ANCHOR */}
      <section className="py-32 px-6 max-w-4xl mx-auto text-center space-y-12">
        <motion.div {...fadeInUp}>
          <p className="text-3xl md:text-4xl font-bold leading-tight">
            "Your word is your currency. My word is your digital security. I personally guarantee the integrity of every byte stored in the AurumOS ecosystem."
          </p>
          <div className="mt-12">
            <div className="font-['Dancing_Script',_cursive] text-6xl text-primary mb-2">Jenil Dholakiya</div>
            <div className="text-xs uppercase tracking-[0.4em] font-bold text-foreground/40">Strategic Founder & CTO</div>
          </div>
        </motion.div>
      </section>

    </main>
  );
}