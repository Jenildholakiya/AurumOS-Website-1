'use client';
import { useRef, useState, type MouseEvent } from 'react';
import { gsap } from '@/components/anim/gsap/register';

type MagneticButtonProps = {
  children: React.ReactNode;
  className?: string;
  /** Strength of the magnetic pull (px) */
  strength?: number;
  onClick?: () => void;
};

/**
 * Button that subtly follows the cursor when hovered, creating a magnetic
 * feel. On click: shrinks then snaps back with elastic overshoot + a ripple
 * ring that expands outward. Pure GSAP — no layout thrash.
 */
export default function MagneticButton({
  children,
  className = '',
  strength = 25,
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);

  const handleMouseMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.4,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    gsap.to(el, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.4)',
    });
  };

  const handleClick = () => {
    const el = ref.current;
    const ripple = rippleRef.current;
    if (!el) return;

    // Snap shrink → elastic overshoot back
    gsap.timeline()
      .to(el, {
        scale: 0.92,
        duration: 0.1,
        ease: 'power2.in',
      })
      .to(el, {
        scale: 1,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)',
      });

    // Ripple ring expand
    if (ripple) {
      gsap.fromTo(
        ripple,
        {
          scale: 0,
          opacity: 0.6,
        },
        {
          scale: 2.5,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
        },
      );
    }

    onClick?.();
  };

  return (
    <button
      ref={ref}
      className={`magnetic-btn relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      {/* Ripple ring */}
      <span
        ref={rippleRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 m-auto size-full rounded-[inherit] border-2 border-current opacity-0"
        style={{ transform: 'scale(0)' }}
      />
    </button>
  );
}
