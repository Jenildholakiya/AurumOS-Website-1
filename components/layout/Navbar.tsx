'use client';
import { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Link from 'next/link'; // Import Link

export default function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > 20;
    // Only re-render when the threshold is actually crossed (avoids a React
    // re-render on every scroll pixel -> smoother scrolling).
    setIsScrolled((prev) => (prev !== next ? next : prev));
  });

  // Mapping links to actual routes
  const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'Wholesale', href: '/wholesale' },
    { name: 'Retail', href: '/retail' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Security', href: '/security' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${
        isScrolled ? "bg-white/70 backdrop-blur-xl border-b border-rose-100/50 py-3" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold cursor-pointer tracking-tighter flex items-center">
          Aurum<span className="text-primary">OS</span>
        </Link>

        {/* Links with Line Reveal Animation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link href={link.href} key={link.name}>
              <motion.div className="relative cursor-pointer group">
                <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors">
                  {link.name}
                </span>
                <motion.div 
                  className="absolute -bottom-1 left-0 h-[2px] bg-primary w-0 group-hover:w-full transition-all duration-300"
                />
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="rounded-full hidden md:flex cursor-pointer hover:bg-rose-100/50">
              Login
            </Button>
          </Link>

          <Link href="/get-started" className="hidden md:flex">
            <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 transition-transform active:scale-95">
              Get Started
            </Button>
          </Link>

          {/* Mobile menu toggle (wired) */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden flex items-center justify-center rounded-full p-2 cursor-pointer hover:bg-rose-100"
          >
            {mobileOpen ? <X className="size-6 text-foreground" /> : <Menu className="size-6 text-foreground" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown — drops below the bar, above the page content. */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 z-[55] flex flex-col gap-1 border-b border-rose-100/50 bg-white/90 px-6 py-5 shadow-xl backdrop-blur-xl md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-2 py-3 text-base font-medium text-foreground/80 transition-colors hover:bg-rose-100/50 hover:text-primary"
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-3 border-t border-rose-100/40 pt-4">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full rounded-full cursor-pointer hover:bg-rose-100/50">
                  Login
                </Button>
              </Link>
              <Link href="/get-started" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-full bg-primary px-6 hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 active:scale-95">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}