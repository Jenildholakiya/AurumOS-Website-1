'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, type Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X, ArrowRight } from 'lucide-react';
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

  // Lock background scroll + allow ESC-to-close while the drawer is open.
  // Without the lock, the page behind scrolls while the menu is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  // Mapping links to actual routes
  const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'Wholesale', href: '/wholesale' },
    { name: 'Retail', href: '/retail' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Security', href: '/security' },
  ];

  // Staggered reveal for the drawer's nav links on open.
  const drawerContainer: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
  };
  const drawerItem: Variants = {
    hidden: { opacity: 0, x: 28 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 350, damping: 30 } },
  };

  return (
    <>
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
    </motion.nav>

    {/* Mobile side drawer — slides in from the right with a staggered reveal.
        Rendered as a sibling of <nav> (not a child) so the nav's framer-motion
        transform can't create a containing block that breaks position:fixed. */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}
        {mobileOpen && (
          <motion.aside
            key="mobile-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 z-[60] flex h-full w-[84%] max-w-sm flex-col bg-white/95 backdrop-blur-xl border-l border-rose-100/60 shadow-2xl md:hidden"
          >
            {/* Header: brand + close */}
            <div className="flex items-center justify-between px-6 pt-7 pb-5 border-b border-rose-100/50">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="text-xl font-bold tracking-tighter cursor-pointer"
              >
                Aurum<span className="text-primary">OS</span>
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center rounded-full p-2 cursor-pointer text-foreground/70 transition-colors hover:bg-rose-100 hover:text-foreground"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Nav links — staggered in on open */}
            <motion.nav
              variants={drawerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-5"
            >
              {navLinks.map((link) => (
                <motion.div key={link.name} variants={drawerItem}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="group flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-medium text-foreground/80 transition-colors hover:bg-primary/5 hover:text-primary"
                  >
                    <span>{link.name}</span>
                    <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            {/* Footer actions */}
            <div className="flex flex-col gap-3 border-t border-rose-100/50 px-6 py-5">
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
              <p className="mt-1 text-center text-xs text-foreground/40">
                Enterprise jewellery ERP
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}