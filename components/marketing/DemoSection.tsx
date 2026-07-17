'use client';
import React from 'react';
import { CheckCircle2, ArrowRight, Headphones, ShieldCheck } from 'lucide-react';
import SplitHeading from '@/components/anim/SplitHeading';
import Reveal from '@/components/anim/Reveal';

export default function DemoSection() {
  const [form, setForm] = React.useState({ firstName: '', lastName: '', email: '', phone: '', message: '' });
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [plan, setPlan] = React.useState('');

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
    'Personalized 30-minute walkthrough',
    'Tailored to your business scale',
    'Full HUID compliance roadmap',
  ];

  return (
    <section id="contact" className="mx-auto max-w-7xl overflow-hidden px-6 py-24">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        {/* Left: Text & Trust Factors */}
        <div className="space-y-8">
          <SplitHeading
            as="h2"
            text="Ready to Calibrate Your Business?"
            className="text-4xl font-bold tracking-tight md:text-5xl"
          />

          <Reveal as="p" y={20} className="max-w-lg text-lg leading-relaxed text-foreground/70">
            Stop juggling spreadsheets and siloed data. See how AurumOS unifies your wholesale and
            retail operations into a single, high-performance ecosystem.
          </Reveal>

          <Reveal as="ul" stagger={0.12} y={20} className="space-y-4">
            {benefits.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 font-medium text-foreground/90"
              >
                <CheckCircle2 className="size-5 text-primary" />
                {item}
              </li>
            ))}
          </Reveal>

          <Reveal
            as="div"
            y={20}
            className="flex gap-6 border-t border-border pt-6 mt-8"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/60">
              <Headphones className="size-5 text-primary" /> 24/7 Support
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/60">
              <ShieldCheck className="size-5 text-primary" /> Enterprise Security
            </div>
          </Reveal>
        </div>

        {/* Right: Form Card */}
        <Reveal
          y={50}
          className="rounded-3xl border border-border bg-white/70 p-8 shadow-xl backdrop-blur-sm md:p-10"
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <input
                required
                placeholder="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full rounded-xl border-2 border-border bg-background/50 p-4 outline-none transition-all focus:border-primary"
              />
              <input
                required
                placeholder="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full rounded-xl border-2 border-border bg-background/50 p-4 outline-none transition-all focus:border-primary"
              />
            </div>
            <input
              required
              type="email"
              placeholder="Work Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border-2 border-border bg-background/50 p-4 outline-none transition-all focus:border-primary"
            />
            <input
              required
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border-2 border-border bg-background/50 p-4 outline-none transition-all focus:border-primary"
            />
            <textarea
              required
              placeholder="Tell us about your business..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="h-32 w-full rounded-xl border-2 border-border bg-background/50 p-4 outline-none transition-all focus:border-primary"
            />

            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary p-4 font-bold text-primary-foreground transition-all hover:bg-primary/90 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
            >
              {status === 'sending' ? 'Sending…' : 'Request Private Demo'}{' '}
              <ArrowRight className="size-5" />
            </button>

            {status === 'success' && (
              <p className="text-center text-sm font-semibold text-emerald-600">
                Thanks! Your request has been sent — we&apos;ll be in touch shortly.
              </p>
            )}
            {status === 'error' && (
              <p className="text-center text-sm font-semibold text-red-600">{errorMsg}</p>
            )}
            <p className="text-center text-xs text-foreground/40">
              Book a session directly with our founder. 100% confidential.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
