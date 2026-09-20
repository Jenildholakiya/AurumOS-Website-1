'use client';

// First-paint wrapper. Implemented as a pure CSS animation (not framer-motion)
// so the page can NEVER get stuck at opacity 0 if JS animation libraries
// fail to initialise — the browser guarantees keyframe animations play.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`@keyframes aurum-page-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div style={{ animation: 'aurum-page-in 0.4s ease-out both' }}>{children}</div>
    </>
  );
}
