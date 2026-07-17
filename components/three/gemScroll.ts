import type { MutableRefObject } from 'react';

/**
 * Bridge between GSAP ScrollTrigger (DOM/scroll world) and the R3F render loop
 * (WebGL world). A single mutable object is written by the scroll handler and
 * read every frame inside `useFrame`, so the 3D model can be posed directly
 * from scroll position without re-rendering React on every scroll tick.
 */
export type GemScrollState = {
  /** 0 → 1 across the GemShowcase scroll range (from `top bottom` to `bottom top`). */
  progress: number;
  /** Scroll velocity in px/s reported by ScrollTrigger; decays toward 0 when idle. */
  velocity: number;
};

export type GemScrollRef = MutableRefObject<GemScrollState>;
