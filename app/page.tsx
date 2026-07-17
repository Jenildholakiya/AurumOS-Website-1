import DemoSection from "@/components/marketing/DemoSection";
import FeaturesBento from "@/components/marketing/FeaturesBento";
import FounderSection from "@/components/marketing/FounderSection";
import Hero from "@/components/marketing/Hero";
import GemShowcase from "@/components/marketing/GemShowcase";

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
