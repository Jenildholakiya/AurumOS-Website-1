import type { ReactNode } from 'react';

type ScrollStageProps = {
  /** Stable id — used as the scroll anchor for in-page links. */
  id?: string;
  children: ReactNode;
  className?: string;
  /** Fill the viewport height so the section reads as a full-screen block. Default true. */
  minHeight?: boolean;
};

/**
 * Plain page section. The scrollytelling layer (pin / reveal / scrubbed
 * timelines + chapter nav) was removed — sections now render statically in
 * normal document flow.
 */
export default function ScrollStage({
  id,
  children,
  className = '',
  minHeight = true,
}: ScrollStageProps) {
  return (
    <section
      id={id}
      className={`relative w-full ${minHeight ? 'min-h-screen' : ''} ${className}`}
    >
      {children}
    </section>
  );
}
