'use client';
import { motion } from 'framer-motion';
import {
  Check, X, ArrowRight, Zap, ShieldCheck,
  Building2, Cpu, BarChart3, Users,
  MessageSquare, History, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import GemCanvas from "@/components/three/GemCanvas";

// Animation Variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" as const }
};

const stagger = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } }
};

export default function PricingPage() {
  const plans = [
    {
      name: "Lite",
      price: "15,000",
      annual: "3,000",
      desc: "For single-shop jewelers who need solid local billing, stock, and security.",
      features: [
        "Single-PC local mode only",
        "Billing & retail billing",
        "Basic weight stock entry + stock ledger",
        "Basic product master + categories",
        "Basic client ledger / outstanding",
        "Owner + 1 staff login, lockout",
        "Local tag printing (basic printer)",
        "Scale weighing",
        "Basic sales report",
        "Core Bastion security (DB watchdog + lock screen)"
      ],
      notIncluded: [
        "Multi-PC LAN network mode",
        "Full accounts & statements",
        "Cloud sync engine",
      ],
      cta: "Start with Lite",
      highlight: false
    },
    {
      name: "Pro",
      price: "35,000",
      annual: "7,000",
      desc: "For multi-PC shops needing full accounts, analytics, and advanced security.",
      features: [
        "Everything in Lite, plus:",
        "Multi-PC LAN network mode (brain server/client, discovery, handshake)",
        "Karigar / Katti vouchers + Uchak stock/inward",
        "Touch groups / touch ledger / touch-stock report",
        "Full accounts: journal, credit ledger, statements, customer purchases",
        "Tag audit (book vs scanned reconciliation)",
        "Stock Med, stagnant + low-stock reports",
        "TSC network printing",
        "Multiple staff + sessions",
        "Full analytics dashboard + reporting",
        "Year close + archive",
        "Enhanced Bastion (session guard, auto-healer, pattern learner, email alerts, forensic PDF)"
      ],
      notIncluded: [
        "Cloud sync engine",
        "Fleet Bastion intelligence",
        "API / integration access"
      ],
      cta: "Go Pro",
      highlight: true
    },
    {
      name: "Enterprise",
      price: "75,000",
      annual: "15,000",
      desc: "For multi-location chains needing cloud sync, fleet intelligence, and priority SLA.",
      features: [
        "Everything in Pro, plus:",
        "Cloud sync engine (cross-shop sync, conflict resolution)",
        "Fleet Bastion intelligence (global signatures via bastion_sync/Supabase)",
        "Customer accounts + loyalty",
        "Advanced Bastion AI (cloud-brain behavioral detection)",
        "Remote admin / Nexus node management + live telemetry stream",
        "Bridge server (multi-location link)",
        "Custom DB location + audit logs",
        "Priority support / SLA",
        "API / integration access"
      ],
      notIncluded: [],
      cta: "Talk to Sales",
      highlight: false
    }
  ];

  const comparison = [
    { feature: "Local Billing & Retail", lite: true, pro: true, enterprise: true },
    { feature: "Multi-PC LAN Network", lite: false, pro: true, enterprise: true },
    { feature: "Karigar / Katti Vouchers", lite: false, pro: true, enterprise: true },
    { feature: "Full Accounts & Statements", lite: false, pro: true, enterprise: true },
    { feature: "Tag Audit Reconciliation", lite: false, pro: true, enterprise: true },
    { feature: "Analytics Dashboard", lite: "Basic", pro: "Full", enterprise: "Full" },
    { feature: "Cloud Sync Engine", lite: false, pro: false, enterprise: true },
    { feature: "Fleet Bastion Intelligence", lite: false, pro: false, enterprise: true },
    { feature: "Customer Loyalty", lite: false, pro: false, enterprise: true },
    { feature: "API / Integration Access", lite: false, pro: false, enterprise: true },
    { feature: "Priority Support / SLA", lite: false, pro: false, enterprise: true },
  ];

  return (
    <main className="min-h-screen text-foreground pt-40 pb-24 overflow-x-hidden">
      
      {/* 1. HERO & TOGGLE */}
      <section className="relative px-6 text-center mb-32 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 left-1/2 -translate-x-1/2 size-[500px] bg-primary/20 rounded-full blur-[100px] -z-10" 
        />
        
        <motion.h1 {...fadeInUp} className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9]">
          Investment in <br /><span className="text-primary italic">Absolute Integrity.</span>
        </motion.h1>

        <motion.p {...fadeInUp} transition={{ delay: 0.2 }} className="text-foreground/70 text-lg max-w-xl mx-auto">
          One-time license fee, billed with an annual maintenance plan. Upgrade anytime as your operation grows.
        </motion.p>
      </section>

      {/* 2. PRICING CARDS */}
      <section className="max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-8 mb-40 relative z-10">
        {plans.map((plan, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-10 rounded-[40px] border flex flex-col justify-between group transition-all duration-500 ${
              plan.highlight ? 'bg-card border-primary/50 shadow-2xl scale-105' : 'bg-background border-border hover:border-primary/30'
            }`}
          >
            <div className="space-y-8">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                {plan.highlight && <span className="text-[10px] font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full uppercase tracking-widest">Recommended</span>}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold">₹{plan.price}</span>
                <span className="text-foreground/70 text-sm">one-time</span>
              </div>
              <div className="text-foreground/70 text-sm">
                + ₹{plan.annual}/yr maintenance
              </div>

              <p className="text-foreground/70 text-sm leading-relaxed">{plan.desc}</p>
              
              <div className="h-px bg-border" />
              
              <ul className="space-y-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm font-medium">
                    <Check size={16} className="text-primary mt-1 shrink-0" /> {f}
                  </li>
                ))}
                {plan.notIncluded.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm font-medium text-foreground/20 italic">
                    <X size={16} className="mt-1 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            <Button asChild className={`w-full mt-12 rounded-2xl py-7 font-bold text-lg group ${plan.highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground'}`}>
              <Link href={`/#contact?plan=${encodeURIComponent(plan.name)}`}>
                {plan.cta} <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        ))}
      </section>

      {/* 3. FEATURE COMPARISON MATRIX (Animated Grid) */}
      <section className="py-32 bg-primary/5 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-4xl font-bold text-center mb-20 tracking-tight">Technical Capability <span className="text-primary">Matrix</span></motion.h2>
          <div className="rounded-[40px] border border-border bg-background overflow-hidden shadow-xl">
             <div className="grid grid-cols-4 p-8 border-b border-border bg-card/50 text-xs font-bold uppercase tracking-widest text-foreground/70">
                <div className="col-span-1">Feature</div>
                <div className="text-center">Lite</div>
                <div className="text-center">Pro</div>
                <div className="text-center">Enterprise</div>
             </div>
             {comparison.map((row, i) => (
               <motion.div
                key={i} {...fadeInUp}
                className="grid grid-cols-4 p-8 border-b border-border last:border-0 hover:bg-primary/5 transition-colors"
               >
                 <div className="font-bold text-sm">{row.feature}</div>
                 <div className="flex justify-center">{typeof row.lite === 'boolean' ? (row.lite ? <Check className="text-primary" size={20}/> : <X className="text-foreground/10" size={20}/>) : <span className="text-xs font-bold">{row.lite}</span>}</div>
                 <div className="flex justify-center">{typeof row.pro === 'boolean' ? (row.pro ? <Check className="text-primary" size={20}/> : <X className="text-foreground/10" size={20}/>) : <span className="text-xs font-bold">{row.pro}</span>}</div>
                 <div className="flex justify-center">{typeof row.enterprise === 'boolean' ? (row.enterprise ? <Check className="text-primary" size={20}/> : <X className="text-foreground/10" size={20}/>) : <span className="text-xs font-bold">{row.enterprise}</span>}</div>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* 4. IMPLEMENTATION ROADMAP (The 3-Step Process) */}
      <section className="py-40 px-6 max-w-7xl mx-auto">
         <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Onboarding in Weeks. <br />Not Months.</h2>
            <p className="text-foreground/70 text-xl">Our strategic engineers handle the heavy lifting.</p>
         </div>
         <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-primary/20 -z-10" />
            {[
              { step: "01", t: "Legacy Migration", d: "We sanitize and migrate your current Excel/ERP data into our high-fidelity database.", icon: Database },
              { step: "02", t: "System Calibration", d: "Custom configuration of branch ledgers, HUID maps, and staff role access.", icon: Cpu },
              { step: "03", t: "Launch & Sync", d: "Go-live with 24/7 dedicated support for the first 30 days of operation.", icon: Zap },
            ].map((step, i) => (
              <motion.div key={i} {...fadeInUp} transition={{ delay: i * 0.2 }} className="bg-card p-10 rounded-3xl border border-border relative">
                 <div className="size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-6">{step.step}</div>
                 <step.icon className="text-primary mb-4" size={32} />
                 <h4 className="text-2xl font-bold mb-3">{step.t}</h4>
                 <p className="text-foreground/70 text-sm leading-relaxed">{step.d}</p>
              </motion.div>
            ))}
         </div>
      </section>

      {/* 5. INFRASTRUCTURE & SECURITY TRUST */}
      <section className="py-32 px-6 bg-foreground text-background overflow-hidden relative">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <motion.div {...fadeInUp} className="space-y-8">
               <h2 className="text-4xl md:text-7xl font-bold tracking-tight leading-[0.9]">Global Cloud <br />Redundancy.</h2>
               <p className="text-background/60 text-lg">
                 Your business cannot stop. AurumOS operates on a high-availability infrastructure with automated daily backups and 100ms global synchronization.
               </p>
               <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 border border-background/20 rounded-2xl">
                     <ShieldCheck className="text-primary mb-2" />
                     <h5 className="font-bold">SOC2 Type II</h5>
                     <p className="text-xs text-background/50">Enterprise Compliance</p>
                  </div>
                  <div className="p-6 border border-background/20 rounded-2xl">
                     <History className="text-primary mb-2" />
                     <h5 className="font-bold">99.99% Uptime</h5>
                     <p className="text-xs text-background/50">Service Level Agreement</p>
                  </div>
               </div>
            </motion.div>
            <div className="relative">
               <GemCanvas className="mx-auto w-full max-w-md" height={420} />
            </div>
         </div>
      </section>

      {/* 6. TECHNICAL FAQ (Simplified) */}
      <section className="py-40 px-6 max-w-4xl mx-auto text-center space-y-12">
        <h2 className="text-4xl font-bold">Calibration FAQs</h2>
        <div className="space-y-4">
          {[
            { q: "Is hardware included?", a: "IoT Scale integration is standard in Enterprise. Hardware units are sold separately." },
            { q: "Can we move from local Tally?", a: "Yes, our Migration Engine is specifically tuned for local accounting formats." },
            { q: "What about staff training?", a: "The Enterprise plan includes 2 full days of on-site or virtual training for your entire team." }
          ].map((faq, i) => (
            <motion.div key={i} {...fadeInUp} className="text-left p-8 rounded-2xl bg-card border border-border">
              <h4 className="font-bold mb-2">Q: {faq.q}</h4>
              <p className="text-foreground/70 text-sm leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 7. FINAL CONVERSION BANNER */}
      <section className="py-32 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-7xl mx-auto bg-primary p-12 md:p-24 rounded-[60px] text-primary-foreground text-center space-y-8 shadow-2xl shadow-primary/40 relative overflow-hidden"
        >
           <h2 className="text-5xl md:text-8xl font-bold tracking-tighter">Ready to <span className="italic">Calibrate?</span></h2>
           <p className="text-primary-foreground/70 text-xl font-medium max-w-xl mx-auto">
             Join 120+ showrooms scaling with AurumOS. Stop managing data, start managing revenue.
           </p>
           <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
              <Button size="lg" className="bg-background text-foreground hover:scale-105 rounded-2xl px-12 py-8 text-xl font-bold">
                Book System Audit
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 rounded-2xl px-12 py-8 text-xl font-bold">
                Talk to Support
              </Button>
           </div>
        </motion.div>
      </section>

    </main>
  );
}