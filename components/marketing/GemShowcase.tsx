'use client';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GemCanvas from '@/components/three/GemCanvas';
import ScrollStage from '@/components/anim/ScrollStage';

/** Home-page centerpiece that pairs copy with the interactive 3D gem. */
export default function GemShowcase() {
  return (
    <ScrollStage
      id="gem"
      className="flex items-center px-6 py-24 overflow-hidden"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div className="space-y-8">
          <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-primary">
            Live Product Core
          </span>

          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Engineered with <span className="italic text-primary">Absolute Precision.</span>
          </h2>

          <p className="max-w-lg text-lg leading-relaxed text-foreground/70">
            Every surface of AurumOS is cut like a brilliant stone — balanced, reflective,
            and built to last. The core turns on its own; grab it and spin to inspect every
            facet from any angle.
          </p>

          <div>
            <Button
              size="lg"
              className="h-12 rounded-full bg-primary px-8 text-lg shadow-xl shadow-primary/20 transition-shadow hover:bg-primary/90 cursor-pointer"
            >
              Explore the Platform <ArrowRight className="ml-2 size-5" />
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <GemCanvas className="mx-auto w-full max-w-md" height={420} />
        </div>
      </div>
    </ScrollStage>
  );
}
