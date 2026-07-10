'use client';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Database, Fingerprint } from 'lucide-react';

const securityFeatures = [
  { 
    title: "Bank-Grade Encryption", 
    desc: "AES-256 bit security for all ledger data.", 
    icon: <Lock /> 
  },
  { 
    title: "Zero-Knowledge Access", 
    desc: "Role-based control; data is only visible to the owner.", 
    icon: <Fingerprint /> 
  },
  { 
    title: "Immutable Audit Logs", 
    desc: "Every weight adjustment is time-stamped & tracked.", 
    icon: <ShieldCheck /> 
  },
  { 
    title: "Regional Data Residency", 
    desc: "Your data stays within your sovereign control.", 
    icon: <Database /> 
  }
];

export default function SecurityBanner() {
  return (
    <section className="py-24 px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-3xl p-12 overflow-hidden relative"
      >
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Enterprise Data Sovereignty</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {securityFeatures.map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="space-y-3"
              >
                <div className="text-primary size-8 mb-4">{item.icon}</div>
                <h4 className="font-bold text-lg">{item.title}</h4>
                <p className="text-foreground/60 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Static Background Glow (no animation -> zero per-frame cost) */}
        <div
          className="absolute -bottom-20 -right-20 size-80 bg-primary/20 rounded-full blur-[100px]"
        />
      </motion.div>
    </section>
  );
}