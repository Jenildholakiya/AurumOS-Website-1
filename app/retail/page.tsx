'use client';
import { motion } from 'framer-motion';
import {
  Zap, Users, Star, CreditCard, ShieldCheck,
  Smartphone, BarChart3, ReceiptText, ArrowRight, Camera,
  Briefcase, TrendingUp, Gem, Monitor, History, Cpu, Check
} from 'lucide-react';
import GemCanvas from "@/components/three/GemCanvas";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function RetailPage() {
  return (
    <main className="min-h-screen text-foreground overflow-x-hidden">
      
      {/* 1. HERO: The Showroom Experience */}
      <section className="pt-40 pb-24 px-6 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter mb-8"
        >
          Showroom <span className="text-primary italic">Elegance.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-xl text-foreground/80 max-w-2xl mx-auto"
        >
          Transform your showroom floor into a high-conversion hub with lightning-fast billing, HUID-integrated POS, and personalized customer insights.
        </motion.p>
      </section>

      {/* 1B. INTERACTIVE 3D CORE */}
      <section className="pb-16 px-6 max-w-3xl mx-auto">
        <GemCanvas className="mx-auto w-full max-w-md" height={360} />
      </section>

      {/* 2. LIVE OPERATIONAL TICKER (New Section) */}
      <section className="py-12 border-y border-border bg-primary/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Orders/Day", val: "450+" },
            { label: "Billing Time", val: "< 15s" },
            { label: "HUID Accuracy", val: "100%" },
            { label: "Showroom Uptime", val: "99.99%" },
          ].map((stat, i) => (
            <motion.div key={i} {...fadeInUp} className="text-center">
              <div className="text-sm font-bold uppercase tracking-widest text-foreground/70">{stat.label}</div>
              <div className="text-3xl font-bold text-primary">{stat.val}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. POS INTERFACE */}
      <section className="py-32 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        <motion.div {...fadeInUp} className="space-y-8">
          <h2 className="text-5xl font-bold tracking-tight">Billing that feels like Art.</h2>
          <p className="text-foreground/70 leading-relaxed text-lg">
            Our Retail POS is designed for high-traffic days. With one-tap HUID scanning and instant gold-rate adjustment, your staff can finish an order in seconds.
          </p>
          <div className="grid grid-cols-2 gap-6">
            {['Instant Billing', 'HUID Verified', 'Multi-Mode Pay', 'Digital Tags'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 font-bold text-sm bg-primary/5 p-4 rounded-xl border border-primary/10">
                <Zap className="text-primary" size={18} /> {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ rotateY: -20 }} whileInView={{ rotateY: 0 }} className="bg-card border p-8 rounded-[40px] shadow-2xl">
           <div className="space-y-4">
              <div className="h-40 bg-primary/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-primary/20">
                 <Camera className="text-primary/20" size={64} />
              </div>
              <div className="flex justify-between items-center py-4 border-b border-border">
                <span>Gold Necklace #882</span>
                <span className="font-bold text-xl">₹1,24,000</span>
              </div>
              <button className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:scale-95 transition-all">Finalize Sale</button>
           </div>
        </motion.div>
      </section>

      {/* 4. COMPLIANCE ENGINE (New Section) */}
      <section className="py-32 px-6 bg-card">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
           <motion.div {...fadeInUp} className="space-y-6">
              <ShieldCheck className="text-primary" size={48} />
              <h2 className="text-4xl font-bold">Regulatory Auto-Pilot</h2>
              <p className="text-foreground/70">Compliance isn't optional. AurumOS automatically maps HUID numbers to your invoices in real-time. If a hallmark is missing, the system locks the transaction—keeping you audit-proof forever.</p>
           </motion.div>
           <div className="bg-background p-8 rounded-3xl border font-mono text-sm space-y-4">
              <p className="text-primary">{`> HUID_VERIFYING...`}</p>
              <p className="text-emerald-500">{`> Hallmark_Found: BIS_750`}</p>
              <p className="text-emerald-500">{`> Mapping_Complete: HUID_9921_822`}</p>
              <p>{`> Invoice_Generated: #99102`}</p>
           </div>
        </div>
      </section>

      {/* 5. GOLD SAVINGS SCHEME (New Section) */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
         <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold">Gold Savings Engine</h2>
            <p className="text-foreground/70">Automate your most complex monthly schemes.</p>
         </motion.div>
         <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Monthly Tracking", desc: "Automatic installment reminders." },
              { title: "Maturity Alerts", desc: "Notify clients when they can redeem." },
              { title: "Weight Conversion", desc: "Instant conversion of cash to grams." }
            ].map((c, i) => (
              <div key={i} className="p-8 border rounded-3xl hover:border-primary transition-all">
                <Gem className="text-primary mb-6" />
                <h4 className="font-bold text-xl mb-2">{c.title}</h4>
                <p className="text-foreground/70">{c.desc}</p>
              </div>
            ))}
         </div>
      </section>

      {/* 6. STAFF & PERFORMANCE */}
      <section className="py-32 px-6 bg-primary/5">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Empower Your Sales Force</h2>
            <p className="text-foreground/70">Turn every employee into a top-performer with real-time KPI tracking.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Briefcase, title: "Staff KPIs", desc: "Automated sales-per-hour tracking." },
              { icon: TrendingUp, title: "Margin Analysis", desc: "View profit margins per transaction." },
              { icon: Users, title: "Customer Affinity", desc: "Sales staff assigned to loyal clients." }
            ].map((card, i) => (
              <motion.div key={i} whileHover={{ y: -10 }} className="p-10 rounded-[32px] bg-background border">
                <card.icon className="text-primary mb-6" size={40} />
                <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
                <p className="text-foreground/70">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA */}
      <section className="py-24 px-6 text-center">
        <motion.div {...fadeInUp} className="max-w-3xl mx-auto p-12 bg-foreground text-background rounded-[40px]">
          <h2 className="text-5xl font-bold mb-8">Modernize your Showroom.</h2>
          <button className="bg-primary text-primary-foreground px-12 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-all">
            Request Showroom Demo
          </button>
        </motion.div>
      </section>
    </main>
  );
}