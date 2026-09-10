'use client';
import { useRef } from 'react';
import { gsap, SplitText, useGSAP, ScrollTrigger } from '@/components/anim/gsap/register';

type ScrollTextMorphProps = {
  /** Array of text strings to morph through as user scrolls */
  texts: string[];
  className?: string;
  /** HTML tag to render */
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  /** How tall each text segment is in viewport height */
  segmentHeight?: number;
};

/**
 * Scroll-scrubbed text morph: words scatter and reform into the next text
 * as the user scrolls. Uses SplitText for per-word animation with
 * ScrollTrigger scrub.
 */
export default function ScrollTextMorph({
  texts,
  className = '',
  as: Tag = 'h2',
  segmentHeight = 1.5,
}: ScrollTextMorphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLElement>(null);
  const splitsRef = useRef<SplitText[]>([]);

  useGSAP(
    () => {
      const container = containerRef.current;
      const textEl = textRef.current;
      if (!container || !textEl || texts.length < 2) return;

      // Clean up previous splits
      splitsRef.current.forEach((s) => s.revert());
      splitsRef.current = [];

      // Set container height for scroll space
      const totalHeight = texts.length * segmentHeight * 100;
      container.style.height = `${totalHeight}vh`;

      // Start with first text
      textEl.textContent = texts[0];

      // Create a SplitText for initial state
      const initialSplit = new SplitText(textEl, {
        type: 'words',
        mask: 'words',
      });
      splitsRef.current.push(initialSplit);

      // Animate words out, swap text, animate new words in
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          pin: textEl,
          anticipatePin: 1,
        },
      });

      for (let i = 0; i < texts.length - 1; i++) {
        const midY = (i + 0.5) * segmentHeight * 100;

        // Phase 1: Scatter current words upward
        tl.to(initialSplit.words, {
          yPercent: -120,
          opacity: 0,
          rotation: gsap.utils.wrap([-3, 2, -2, 3, 0]),
          stagger: { each: 0.02, from: 'random' },
          duration: segmentHeight * 0.4,
          ease: 'power2.in',
        });

        // Phase 2: Swap text at midpoint
        tl.call(() => {
          textEl.textContent = texts[i + 1];
          // Re-split the new text
          const newSplit = new SplitText(textEl, {
            type: 'words',
            mask: 'words',
          });
          splitsRef.current.push(newSplit);
          // Set initial state for new words
          gsap.set(newSplit.words, {
            yPercent: 120,
            opacity: 0,
            rotation: 0,
          });
        });

        // Phase 3: Animate new words in from below
        tl.to(
          splitsRef.current[splitsRef.current.length - 1].words,
          {
            yPercent: 0,
            opacity: 1,
            rotation: 0,
            stagger: { each: 0.02, from: 'random' },
            duration: segmentHeight * 0.4,
            ease: 'power2.out',
          },
        );
      }

      return () => {
        splitsRef.current.forEach((s) => s.revert());
        splitsRef.current = [];
      };
    },
    { scope: containerRef, dependencies: [texts, segmentHeight] },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TagEl = Tag as any;

  return (
    <div ref={containerRef} className="relative">
      <TagEl ref={textRef} className={`sticky top-1/2 -translate-y-1/2 ${className}`}>
        {texts[0]}
      </TagEl>
    </div>
  );
}
