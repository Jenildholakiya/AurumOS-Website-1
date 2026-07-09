'use client';
import { motion } from 'framer-motion';
import { BarChart3, ShieldCheck, Warehouse, Zap, Users, ReceiptText } from 'lucide-react';

const features = [
  { 
    title: "Wholesale Command", 
    desc: "Manage multi-location inventory, automated stock replenishment, and B2B order fulfillment with real-time sync.", 
    icon: Warehouse 
  },
  { 
    title: "Retail Point-of-Sale", 
    desc: "A frictionless billing interface tailored for high-volume jewellery retail, supporting instant tax calculations and digital receipts.", 
    icon: Zap 
  },
  { 
    title: "HUID Compliance", 
    desc: "Seamlessly integrate hallmarking protocols. Automated logs ensure every item meets regulatory standards with zero manual entry.", 
    icon: ShieldCheck 
  },
  { 
    title: "Executive Analytics", 
    desc: "Interactive dashboards visualizing revenue trends, metal weight fluctuations, and high-margin product performance.", 
    icon: BarChart3 
  },
  { 
    title: "Smart Ledger", 
    desc: "A relationship-first financial engine. Track customer credit, gold savings schemes, and long-term loyalty history.", 
    icon: ReceiptText 
  },
  { 
    title: "Staff Management", 
    desc: "Comprehensive workforce oversight: manage roles, monitor sales performance, and handle attendance data in one secure hub.", 
    icon: Users 
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="mb-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Core Modules</h2>
        <p className="text-lg text-foreground/70">The complete command core for your jewellery enterprise.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-primary/5 cursor-pointer"
            >
              <div className="mb-6 inline-block p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Icon className="size-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-foreground/70 leading-relaxed">{feature.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}