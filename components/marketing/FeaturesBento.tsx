'use client';
import { BarChart3, ShieldCheck, Warehouse, Zap, Users, ReceiptText } from 'lucide-react';
import ScrollStage from '@/components/anim/ScrollStage';
import TiltCard from '@/components/anim/TiltCard';

const features = [
  {
    title: 'Wholesale Command',
    desc: 'Orchestrate multi-location stock, automated replenishment, and B2B fulfilment with real-time synchronization across every branch.',
    icon: Warehouse,
  },
  {
    title: 'Retail Point-of-Sale',
    desc: 'A frictionless billing surface built for high-volume jewellery retail — instant tax, digital receipts, and zero queue friction.',
    icon: Zap,
  },
  {
    title: 'HUID Compliance',
    desc: 'Hallmarking woven into the workflow. Automated, auditable logs keep every piece regulator-ready with zero manual entry.',
    icon: ShieldCheck,
  },
  {
    title: 'Executive Analytics',
    desc: 'Living dashboards that surface revenue trends, metal-weight drift, and your highest-margin lines at a single glance.',
    icon: BarChart3,
  },
  {
    title: 'Smart Ledger',
    desc: 'A relationship-first financial engine: customer credit, gold-savings schemes, and loyalty history, all in one secure place.',
    icon: ReceiptText,
  },
  {
    title: 'Staff Management',
    desc: 'Role, performance, and attendance oversight in a single secure hub — clarity for your team, control for you.',
    icon: Users,
  },
];

export default function FeaturesGrid() {
  return (
    <ScrollStage
      id="features-home"
      className="flex items-center px-6 py-24 overflow-hidden"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            One Platform. Every Facet of Your Trade.
          </h2>
          <p className="text-lg text-foreground/70">
            From the vault to the counter, AurumOS orchestrates your entire operation.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title}>
                <TiltCard tilt={7} className="rounded-3xl">
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-border/60 bg-white/70 p-8 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer">
                    {/* Diagonal light sheen that sweeps across on hover */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -inset-x-12 -top-16 h-40 -rotate-12 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:translate-x-40 group-hover:opacity-100"
                    />
                    <div className="relative mb-6 inline-flex rounded-2xl bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="relative mb-3 text-xl font-bold">{feature.title}</h3>
                    <p className="relative leading-relaxed text-foreground/70">{feature.desc}</p>
                  </div>
                </TiltCard>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollStage>
  );
}
