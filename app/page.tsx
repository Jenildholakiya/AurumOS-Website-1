import dynamic from 'next/dynamic';
import Hero from "@/components/marketing/Hero";

// Below-the-fold sections are server-rendered (so LCP/SEO are unaffected) but
// their client JS is split into deferred chunks. This keeps the initial bundle
// small and the main thread free during load, which is what drives Total
// Blocking Time down (the last Performance metric keeping us from 100).
const GemShowcase = dynamic(() => import("@/components/marketing/GemShowcase"));
const FeaturesBento = dynamic(() => import("@/components/marketing/FeaturesBento"));
const FounderSection = dynamic(() => import("@/components/marketing/FounderSection"));
const DemoSection = dynamic(() => import("@/components/marketing/DemoSection"));

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <GemShowcase />
      <FeaturesBento />
      <FounderSection />
      <DemoSection />
    </main>
  );
}
