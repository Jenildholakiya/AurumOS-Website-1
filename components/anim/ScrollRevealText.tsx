'use client';
import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '@/components/anim/gsap/register';

type ScrollRevealTextProps = {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div';
  className?: string;
  /** Animation style */
  variant?: 'clipUp' | 'fadeSlide' | 'chars' | 'lines';
  /** ScrollTrigger start position */
  start?: string;
};

/**
 * Scroll-linked text reveal with multiple animation variants.
 * Text is split into words/chars and animated as you scroll.
 */
export default function ScrollRevealText({
  text,
  as = 'h2',
  className = '',
  variant = 'clipUp',
  start = 'top 85%',
}: ScrollRevealTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      if (variant === 'chars') {
        const split = new SplitText(el, { type: 'chars', mask: 'chars', autoSplit: true });
        gsap.from(split.chars, {
          yPercent: 100,
          opacity: 0,
          duration: 0.8,
          stagger: 0.02,
          ease: 'power4.out',
          scrollTrigger: { trigger: el, start, once: true },
        });
        return () => split.revert();
      }

      if (variant === 'lines') {
        const split = new SplitText(el, { type: 'lines', mask: 'lines', autoSplit: true });
        gsap.from(split.lines, {
          yPercent: 110,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power4.out',
          scrollTrigger: { trigger: el, start, once: true },
        });
        return () => split.revert();
      }

      if (variant === 'fadeSlide') {
        const split = new SplitText(el, { type: 'words', mask: 'words', autoSplit: true });
        gsap.from(split.words, {
          x: -30,
          opacity: 0,
          duration: 0.7,
          stagger: 0.04,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start, once: true },
        });
        return () => split.revert();
      }

      // Default: clipUp
      const split = new SplitText(el, { type: 'words', mask: 'words', autoSplit: true });
      gsap.from(split.words, {
        yPercent: 115,
        opacity: 0,
        duration: 0.9,
        stagger: 0.06,
        ease: 'power4.out',
        scrollTrigger: { trigger: el, start, once: true },
      });
      return () => split.revert();
    },
    { scope: ref, dependencies: [variant, start] },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = as as any;
  return (
    <Tag ref={ref} className={className}>
      {text}
    </Tag>
  );
}
