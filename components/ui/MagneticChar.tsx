'use client';
import { useRef, type MouseEvent } from 'react';
import { gsap } from '@/components/anim/gsap/register';

type MagneticCharProps = {
  children: string;
  className?: string;
  /** Per-character color on hover */
  hoverColor?: string;
  /** Magnetic pull strength */
  strength?: number;
  /** Enable scale bounce on hover */
  bounce?: boolean;
};

/**
 * Text where each character individually reacts to the cursor —
 * characters lift, color-shift, and bounce independently.
 */
export default function MagneticChar({
  children,
  className = '',
  hoverColor = 'var(--color-primary)',
  strength = 20,
  bounce = true,
}: MagneticCharProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const chars = container.querySelectorAll<HTMLElement>('[data-char]');
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    chars.forEach((char) => {
      const rect = char.getBoundingClientRect();
      const charCenterX = rect.left - containerRect.left + rect.width / 2;
      const charCenterY = rect.top - containerRect.top + rect.height / 2;
      const distX = mouseX - charCenterX;
      const distY = mouseY - charCenterY;
      const dist = Math.sqrt(distX * distX + distY * distY);
      const maxDist = 120;

      if (dist < maxDist) {
        const power = 1 - dist / maxDist;
        gsap.to(char, {
          x: distX * power * 0.4,
          y: distY * power * 0.4 - (bounce ? power * 8 : 0),
          color: hoverColor,
          scale: bounce ? 1 + power * 0.15 : 1,
          duration: 0.3,
          ease: 'power2.out',
        });
      } else {
        gsap.to(char, {
          x: 0,
          y: 0,
          color: 'inherit',
          scale: 1,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)',
        });
      }
    });
  };

  const handleMouseLeave = () => {
    const container = containerRef.current;
    if (!container) return;
    const chars = container.querySelectorAll<HTMLElement>('[data-char]');
    chars.forEach((char) => {
      gsap.to(char, {
        x: 0,
        y: 0,
        color: 'inherit',
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.4)',
      });
    });
  };

  const chars = children.split('');

  return (
    <div
      ref={containerRef}
      className={`inline-flex flex-wrap cursor-default ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          data-char
          className="inline-block will-change-transform"
          style={{ transition: 'color 0.3s ease' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
}
