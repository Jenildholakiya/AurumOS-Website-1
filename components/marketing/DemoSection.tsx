'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Clock, ShieldCheck, Headphones } from 'lucide-react';

export default function DemoSection() {
  const [form, setForm] = React.useState({ firstName: '', lastName: '', email: '', phone: '', message: '' });
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [plan, setPlan] = React.useState('');

  // Capture the plan of interest if the visitor arrived from a pricing CTA (?plan=Lite).
  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('plan');
    if (p) setPlan(p);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus('success');
        setForm({ firstName: '', lastName: '', email: '', phone: '', message: '' });
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  }

  const benefits = [
    "Personalized 30-minute walkthrough",
    "Tailored for your business scale",
    "Full HUID compliance roadmap",
  ];

  // Helper for consistent hover animation on inputs
  const fieldVariants = {
    hover: { scale: 1.01, borderColor: "var(--primary)" },
    initial: { scale: 1, borderColor: "transparent" }
  };

  return (
    <section id="contact" className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Animated Text & Trust Factors */}
        <div className="space-y-8">
          <motion.h2 initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="text-4xl md:text-5xl font-bold tracking-tight">
            Ready to calibrate your business?
          </motion.h2>
          
          <motion.p initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="text-lg text-foreground/70 leading-relaxed">
            Stop juggling spreadsheets and siloed data. See how AurumOS can unify your wholesale and retail operations into a single, high-performance ecosystem.
          </motion.p>
          
          <ul className="space-y-4">
            {benefits.map((item, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (i * 0.1) }} className="flex items-center gap-3 text-foreground/90 font-medium">
                <CheckCircle2 className="size-5 text-primary" />
                {item}
              </motion.li>
            ))}
          </ul>

          {/* New Trust Factors */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex gap-6 pt-6 border-t border-border mt-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/60">
              <Headphones className="size-5 text-primary" /> 24/7 Support
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/60">
              <ShieldCheck className="size-5 text-primary" /> Enterprise Security
            </div>
          </motion.div>
        </div>

        {/* Right: Animated Form Card with Field Hover Effects */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, type: "spring" }}
          whileHover={{ y: -5 }}
          className="bg-card border border-border p-8 md:p-10 rounded-3xl shadow-xl"
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <motion.input variants={fieldVariants} whileHover="hover" type="text" required placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full p-4 rounded-xl border-2 border-border bg-background/50 outline-none transition-all" />
              <motion.input variants={fieldVariants} whileHover="hover" type="text" required placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full p-4 rounded-xl border-2 border-border bg-background/50 outline-none transition-all" />
            </div>
            <motion.input variants={fieldVariants} whileHover="hover" type="email" required placeholder="Work Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-4 rounded-xl border-2 border-border bg-background/50 outline-none transition-all" />
            <motion.input variants={fieldVariants} whileHover="hover" type="tel" required placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full p-4 rounded-xl border-2 border-border bg-background/50 outline-none transition-all" />
            <motion.textarea variants={fieldVariants} whileHover="hover" required placeholder="Tell us about your business..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full p-4 rounded-xl border-2 border-border bg-background/50 outline-none transition-all h-32" />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={status === 'sending'}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground p-4 rounded-xl font-bold hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending…' : 'Request Private Demo'} <ArrowRight className="size-5" />
            </motion.button>

            {status === 'success' && (
              <p className="text-sm font-semibold text-emerald-600 text-center">
                Thanks! Your request has been sent — we&apos;ll be in touch shortly.
              </p>
            )}
            {status === 'error' && (
              <p className="text-sm font-semibold text-red-600 text-center">{errorMsg}</p>
            )}
            <p className="text-xs text-foreground/40 text-center">
              Book a session directly with our founder. 100% confidential.
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
}