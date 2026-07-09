'use client';
import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link'; // Import Link

export default function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
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
          
          <Link href="/get-started">
            <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 transition-transform active:scale-95">
              Get Started
            </Button>
          </Link>
          
          {/* Mobile Menu Icon (placeholder — not yet wired) */}
          <div aria-hidden="true" className="md:hidden cursor-pointer p-2 hover:bg-rose-100 rounded-full">
            <Menu className="w-6 h-6 text-foreground" />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}