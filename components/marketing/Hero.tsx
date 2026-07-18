'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import ScrollStage from '@/components/anim/ScrollStage';

export default function Hero() {
  return (
    <ScrollStage
      id="hero"
      className="flex flex-col items-center justify-center px-6 pb-32 pt-24 overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute -z-10 top-0 h-full w-full bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-rose-100/30 via-background to-background" />

      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        {/* Text Content */}
        <div className="space-y-8">
          <span className="inline-block cursor-default rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-primary">
            Jewellery ERP for Wholesalers &amp; Retailers
          </span>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-7xl">
            Precision. Luxury. <br />
            <span className="italic text-primary">Synchronized.</span>
          </h1>

          <p className="max-w-lg text-xl leading-relaxed text-foreground/90">
            AurumOS unifies wholesale inventory, retail point-of-sale, and hallmarking
            compliance into one beautifully engineered command core — so your craft
            stays the focus, not the paperwork.
          </p>

          <div className="flex gap-4 pt-4">
            <Button
              size="lg"
              className="h-12 rounded-full bg-primary px-8 text-lg shadow-xl shadow-primary/20 transition-shadow hover:bg-primary/90 hover:shadow-primary/30 cursor-pointer"
            >
              Request Demo
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-border px-8 text-lg transition-colors cursor-pointer"
            >
              View Features
            </Button>
          </div>
        </div>

        {/* Floating Dashboard Preview */}
        <div
          className="group relative cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="Open the AurumOS executive dashboard preview in a new tab"
          onClick={() => window.open('/dashboard.png', '_blank')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.open('/dashboard.png', '_blank');
            }
          }}
        >
          <div className="rounded-3xl border border-border/50 bg-white/50 p-2 shadow-2xl backdrop-blur-sm transition-transform duration-500 group-hover:scale-[1.02]">
            <Image
              src="/dashboard.png"
              alt="AurumOS Executive Dashboard"
              width={1200}
              height={675}
              className="w-full h-auto rounded-2xl object-cover shadow-inner"
              priority
            />
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/10 to-transparent" />
          </div>
          <div className="absolute -bottom-10 -right-10 -z-10 size-40 rounded-full bg-primary/20 blur-3xl" />
        </div>
      </div>
    </ScrollStage>
  );
}
