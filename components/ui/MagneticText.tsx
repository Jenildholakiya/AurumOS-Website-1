'use client';
import { useRef, useState, type MouseEvent } from 'react';
import { gsap } from '@/components/anim/gsap/register';

type MagneticTextProps = {
  children: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
  className?: string;
  /** Color to transition to on hover */
  hoverColor?: string;
  /** Magnetic pull strength in px */
  strength?: number;
  /** Enable underline reveal on hover */
  underline?: boolean;
};

/**
 * Text that magnetically follows the cursor and changes color on hover.
 * Characters can be split for per-letter animation or kept as a whole word.
 */
export default function MagneticText({
  children,
  as: Tag = 'span',
  className = '',
  hoverColor = 'var(--color-primary)',
  strength = 15,
  underline = false,
}: MagneticTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, {
      x: x * 0.2,
      y: y * 0.2,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    const el = ref.current;
    if (!el) return;
    gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TagEl = Tag as any;

  return (
    <TagEl
      ref={ref}
      className={`inline-block will-change-transform cursor-default ${className}`}
      style={{
        color: isHovered ? hoverColor : undefined,
        transition: 'color 0.3s ease',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {underline && (
        <span
          className="absolute bottom-0 left-0 h-[2px] origin-left transition-transform duration-300"
          style={{
            width: '100%',
            background: hoverColor,
            transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
          }}
        />
      )}
    </TagEl>
  );
}
