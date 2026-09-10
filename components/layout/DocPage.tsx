'use client';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

export interface DocMeta {
  title: string;
  description: string;
  icon: React.ReactNode;
  lastUpdated: string;
  readTime: string;
}

export interface DocNavLink {
  label: string;
  href: string;
}

interface DocPageProps {
  meta: DocMeta;
  prev?: DocNavLink;
  next?: DocNavLink;
  children: React.ReactNode;
}

export default function DocPage({ meta, prev, next, children }: DocPageProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl"
    >
      {/* Header */}
      <div className="mb-10 border-b border-border pb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {meta.icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{meta.title}</h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-foreground/70">
          {meta.description}
        </p>
        <div className="mt-5 flex items-center gap-4 text-xs text-foreground/50">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {meta.readTime} read
          </span>
          <span className="flex items-center gap-1.5">
            <Edit className="size-3.5" />
            Updated {meta.lastUpdated}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="prose-aurumos">{children}</div>

      {/* Prev / Next nav */}
      <div className="mt-16 grid grid-cols-1 gap-4 border-t border-border pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            href={prev.href}
            className="group flex flex-col gap-1 rounded-2xl border border-border p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">Previous</span>
            <span className="flex items-center gap-2 font-bold text-foreground/80 group-hover:text-primary">
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              {prev.label}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={next.href}
            className="group flex flex-col items-end gap-1 rounded-2xl border border-border p-5 text-right transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">Next</span>
            <span className="flex items-center gap-2 font-bold text-foreground/80 group-hover:text-primary">
              {next.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </motion.article>
  );
}
