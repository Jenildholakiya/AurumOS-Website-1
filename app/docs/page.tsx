'use client';
import { useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen, Download, Code, FileText, Layers, Database,
  Settings, AlertTriangle, HelpCircle, GraduationCap,
  HeadphonesIcon, Shield, Scale, ArrowRight
} from 'lucide-react';
import { gsap, useGSAP } from '@/components/anim/gsap/register';
import Reveal from '@/components/anim/Reveal';

const docs = [
  { title: 'User Manual', description: 'Complete guide to using AurumOS for billing, inventory, POS, and more.', href: '/docs/user-manual', icon: BookOpen, color: 'from-rose-500/10 to-rose-500/5' },
  { title: 'Installation Guide', description: 'System requirements, setup steps, and configuration instructions.', href: '/docs/installation', icon: Download, color: 'from-amber-500/10 to-amber-500/5' },
  { title: 'API Documentation', description: 'REST API endpoints, LAN sync protocol, and bridge API reference.', href: '/docs/api', icon: Code, color: 'from-violet-500/10 to-violet-500/5' },
  { title: 'Architecture Overview', description: 'System architecture, component design, and data flow diagrams.', href: '/docs/architecture', icon: Layers, color: 'from-cyan-500/10 to-cyan-500/5' },
  { title: 'Database Schema', description: 'SQLite schema, tables, relationships, and sync mechanisms.', href: '/docs/database-schema', icon: Database, color: 'from-emerald-500/10 to-emerald-500/5' },
  { title: 'Configuration Guide', description: 'Config files, network settings, and environment variables.', href: '/docs/configuration', icon: Settings, color: 'from-orange-500/10 to-orange-500/5' },
  { title: 'Release Notes', description: 'Version history, changelogs, and upgrade instructions.', href: '/docs/release-notes', icon: FileText, color: 'from-blue-500/10 to-blue-500/5' },
  { title: 'Troubleshooting', description: 'Common issues, error codes, and step-by-step solutions.', href: '/docs/troubleshooting', icon: AlertTriangle, color: 'from-red-500/10 to-red-500/5' },
  { title: 'FAQ', description: 'Frequently asked questions and quick answers.', href: '/docs/faq', icon: HelpCircle, color: 'from-indigo-500/10 to-indigo-500/5' },
  { title: 'Training Materials', description: 'Video tutorials, guides, and onboarding resources.', href: '/docs/training', icon: GraduationCap, color: 'from-teal-500/10 to-teal-500/5' },
  { title: 'Support Procedures', description: 'How to get help, contact support, and report issues.', href: '/docs/support', icon: HeadphonesIcon, color: 'from-pink-500/10 to-pink-500/5' },
  { title: 'Security Policy', description: 'Data protection, encryption, and security practices.', href: '/docs/security', icon: Shield, color: 'from-emerald-500/10 to-emerald-500/5' },
  { title: 'Compliance Docs', description: 'Regulatory compliance, HUID standards, and audit trails.', href: '/docs/compliance', icon: Scale, color: 'from-slate-500/10 to-slate-500/5' },
];

export default function DocsIndexPage() {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll('[data-doc-card]');
      gsap.from(cards, {
        y: 40,
        autoAlpha: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.05,
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 85%',
          once: true,
        },
      });
    },
    { scope: gridRef },
  );

  return (
    <div className="max-w-4xl">
      {/* Hero */}
      <Reveal as="div" y={30} className="mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
          <BookOpen className="size-3.5" />
          Documentation
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          AurumOS <span className="italic text-primary">Docs</span>
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-foreground/70">
          Everything you need to deploy, configure, and operate AurumOS. From first
          installation to advanced API integrations.
        </p>
      </Reveal>

      {/* Quick links */}
      <Reveal as="div" y={30} delay={0.15} className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/docs/user-manual"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-white/70 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <BookOpen className="size-5" />
          </div>
          <div className="flex-1">
            <div className="font-bold">Quick Start</div>
            <div className="text-sm text-foreground/60">New to AurumOS? Start here.</div>
          </div>
          <ArrowRight className="size-4 text-foreground/30 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
        <Link
          href="/docs/api"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-white/70 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white">
            <Code className="size-5" />
          </div>
          <div className="flex-1">
            <div className="font-bold">API Reference</div>
            <div className="text-sm text-foreground/60">Endpoints, schemas, and protocols.</div>
          </div>
          <ArrowRight className="size-4 text-foreground/30 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
      </Reveal>

      {/* All docs grid */}
      <Reveal as="div" y={20} className="mb-6">
        <h2 className="text-lg font-bold">All Documentation</h2>
      </Reveal>
      <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc) => {
          const Icon = doc.icon;
          return (
            <Link
              key={doc.href}
              href={doc.href}
              data-doc-card
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/60 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${doc.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              <div className="relative">
                <div className="mb-4 inline-flex rounded-xl bg-foreground/5 p-2.5 transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110 group-hover:-rotate-3">
                  <Icon className="size-5 text-foreground/60 transition-colors group-hover:text-primary" />
                </div>
                <h3 className="mb-1.5 font-bold">{doc.title}</h3>
                <p className="text-sm leading-relaxed text-foreground/60">{doc.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
