'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Download, Code, FileText, Layers, Database,
  Settings, AlertTriangle, HelpCircle, GraduationCap,
  HeadphonesIcon, Shield, Scale, ChevronDown, Menu, X
} from 'lucide-react';

const docSections = [
  {
    title: 'Getting Started',
    items: [
      { name: 'User Manual', href: '/docs/user-manual', icon: BookOpen },
      { name: 'Installation Guide', href: '/docs/installation', icon: Download },
    ],
  },
  {
    title: 'Core Reference',
    items: [
      { name: 'API Documentation', href: '/docs/api', icon: Code },
      { name: 'Architecture Overview', href: '/docs/architecture', icon: Layers },
      { name: 'Database Schema', href: '/docs/database-schema', icon: Database },
      { name: 'Configuration Guide', href: '/docs/configuration', icon: Settings },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Release Notes', href: '/docs/release-notes', icon: FileText },
      { name: 'Troubleshooting', href: '/docs/troubleshooting', icon: AlertTriangle },
      { name: 'FAQ', href: '/docs/faq', icon: HelpCircle },
    ],
  },
  {
    title: 'Resources',
    items: [
      { name: 'Training Materials', href: '/docs/training', icon: GraduationCap },
      { name: 'Support Procedures', href: '/docs/support', icon: HeadphonesIcon },
      { name: 'Security Policy', href: '/docs/security', icon: Shield },
      { name: 'Compliance Docs', href: '/docs/compliance', icon: Scale },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  const [expandedSections, setExpandedSections] = useState<string[]>(
    docSections.map((s) => s.title)
  );

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    );
  };

  // Scroll active item into view on mount / route change
  useEffect(() => {
    const timer = setTimeout(() => {
      activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <nav className="flex flex-col">
      {docSections.map((section, sIdx) => {
        const isExpanded = expandedSections.includes(section.title);
        return (
          <div key={section.title} className={sIdx > 0 ? 'mt-4' : ''}>
            <button
              onClick={() => toggleSection(section.title)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-foreground/40 transition-colors hover:text-foreground/70 cursor-pointer"
            >
              {section.title}
              <ChevronDown
                className={`size-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-0.5 py-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          ref={isActive ? activeRef : undefined}
                          href={item.href}
                          onClick={onNavigate}
                          className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground/90'
                          }`}
                        >
                          <Icon
                            className={`size-4 shrink-0 transition-colors duration-150 ${
                              isActive ? 'text-primary' : 'text-foreground/30 group-hover:text-foreground/50'
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-lg bg-primary/10 -z-10"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}

export default function DocsSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile FAB */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 md:hidden cursor-pointer"
        aria-label="Open docs menu"
      >
        <Menu className="size-6" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-0 left-0 z-[80] flex h-full w-[82%] max-w-sm flex-col border-r border-border bg-white/95 backdrop-blur-xl shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <Link href="/docs" onClick={() => setMobileOpen(false)} className="text-xl font-bold tracking-tighter">
                  Aurum<span className="text-primary">OS</span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full p-2 text-foreground/70 hover:bg-foreground/5 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-sidebar">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <div className="sticky top-24 h-[calc(100vh-7rem)] flex flex-col">
          {/* Brand card */}
          <Link href="/docs" className="group flex items-center gap-2.5 rounded-xl px-4 py-3 mb-4 bg-primary/5 border border-primary/10 transition-colors hover:bg-primary/10">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="size-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Documentation</div>
              <div className="text-xs text-foreground/50">v1.0.2</div>
            </div>
          </Link>

          {/* Scrollable nav */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-sidebar">
            <SidebarNav />
          </div>
        </div>
      </div>
    </>
  );
}
