import dynamic from 'next/dynamic';
import Hero from "@/components/marketing/Hero";
import Marquee from "@/components/marketing/Marquee";
import ScrollTextMorph from "@/components/anim/ScrollTextMorph";

const GemShowcase = dynamic(() => import("@/components/marketing/GemShowcase"));
const FeaturesBento = dynamic(() => import("@/components/marketing/FeaturesBento"));
const FounderSection = dynamic(() => import("@/components/marketing/FounderSection"));
const DemoSection = dynamic(() => import("@/components/marketing/DemoSection"));

const tickerItems = [
  'Wholesale Billing',
  'Retail POS',
  'HUID Compliance',
  'Inventory Management',
  'Smart Ledger',
  'Karigar Tracking',
  'Weighing Scale Integration',
  'Thermal Printer Support',
  'Multi-PC LAN Sync',
  'BASTION AI Security',
  'Chart of Accounts',
  'Client Management',
  'Role-Based Access',
  'Auto Updates',
];

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <ScrollTextMorph
        texts={[
          'Precision.',
          'Luxury.',
          'Synchronized.',
          'Engineered.',
          'Intelligent.',
        ]}
        className="font-clash text-5xl md:text-7xl font-bold tracking-tight text-center text-foreground"
        as="h2"
        segmentHeight={1.2}
      />
      <Marquee items={tickerItems} speed={25} className="border-y border-border bg-primary/[0.02] py-6" />
      <GemShowcase />
      <FeaturesBento />
      <FounderSection />
      <DemoSection />
    </main>
  );
}
