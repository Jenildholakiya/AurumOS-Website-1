'use client';
import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '@/components/anim/gsap/register';

type SplitHeadingProps = {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div';
  className?: string;
  delay?: number;
  duration?: number;
  /** Split into words (default), individual characters, or whole lines. */
  splitBy?: 'words' | 'chars' | 'lines';
  /** ScrollTrigger start position. */
  start?: string;
  stagger?: number;
};

/**
 * Advanced heading reveal powered by GSAP SplitText. The text is sliced into
 * words/characters, each wrapped in a clipping mask, then driven up from below
 * with an eased, staggered cascade as it scrolls into view. `autoSplit` keeps
 * the split correct across viewport/resize changes.
 */
export default function SplitHeading({
  text,
  as = 'h2',
  className = '',
  delay = 0,
  duration = 0.9,
  splitBy = 'words',
  start = 'top 85%',
  stagger,
}: SplitHeadingProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const split = new SplitText(el, {
        type: splitBy,
        mask: splitBy,
        autoSplit: true,
      });

      const targets =
        splitBy === 'chars' ? split.chars : splitBy === 'lines' ? split.lines : split.words;
      gsap.from(targets, {
        yPercent: 115,
        opacity: 0,
        duration,
        ease: 'power4.out',
        stagger: stagger ?? (splitBy === 'chars' ? 0.02 : splitBy === 'lines' ? 0.14 : 0.08),
        delay,
        scrollTrigger: { trigger: el, start, once: true },
      });

      return () => split.revert();
    },
    { scope: ref },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = as as any;
  return (
    <Tag ref={ref} className={className}>
      {text}
    </Tag>
  );
}
