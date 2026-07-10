/**
 * Global, fixed ambient backdrop in the Rose Gold theme. Deliberately STATIC
 * (no animation, no client JS) so it costs nothing per frame — zero continuous
 * repaint, zero jank. All motion on the page comes from scroll/entrance
 * animations instead. This element renders as plain server HTML.
 */
export default function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-1/3 -left-1/4 size-[42vmax] rounded-full blur-[60px]"
        style={{ background: 'radial-gradient(circle, rgba(199,123,107,0.13), transparent 60%)' }}
      />
      <div
        className="absolute -bottom-1/3 -right-1/4 size-[38vmax] rounded-full blur-[60px]"
        style={{ background: 'radial-gradient(circle, rgba(230,194,182,0.12), transparent 60%)' }}
      />
    </div>
  );
}
