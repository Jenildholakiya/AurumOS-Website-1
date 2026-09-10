'use client';
import { useRef } from 'react';
import Image from 'next/image';
import ScrollStage from '@/components/anim/ScrollStage';
import { gsap, useGSAP } from '@/components/anim/gsap/register';
import ScrollRevealText from '@/components/anim/ScrollRevealText';
import Parallax from '@/components/anim/Parallax';
import MagneticText from '@/components/ui/MagneticText';

export default function FounderSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const items = sectionRef.current.querySelectorAll('[data-founder-item]');
      gsap.from(items, {
        y: 40,
        autoAlpha: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          once: true,
        },
      });
    },
    { scope: sectionRef },
  );

  return (
    <ScrollStage
      id="founder"
      className="flex items-center bg-primary/5 px-6 py-24 overflow-hidden"
    >
      <div ref={sectionRef} className="mx-auto grid w-full max-w-6xl items-start gap-12 lg:grid-cols-12">
        {/* Left Column: Image & Signature */}
        <div data-founder-item className="space-y-8 lg:col-span-4">
          <Parallax y={-30} speed={0.2}>
            <div className="group relative aspect-[9/16] overflow-hidden rounded-3xl shadow-2xl">
              <div className="absolute inset-0">
                <Image
                  src="/founder.jpeg"
                  alt="Jenil Dholakiya"
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover object-top scale-100 transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-primary/40 to-transparent" />
            </div>
          </Parallax>

          <div className="pl-2">
            <MagneticText
              as="div"
              hoverColor="oklch(0.45 0.14 25)"
              strength={10}
              className="font-clash text-4xl font-bold text-primary cursor-default"
            >
              Jenil Dholakiya
            </MagneticText>
            <div className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-foreground/70">
              Strategic Founder &amp; CTO
            </div>
          </div>
        </div>

        {/* Right Column: Narrative */}
        <div className="lg:col-span-8 space-y-12">
          <div data-founder-item>
            <ScrollRevealText
              as="h2"
              text="Engineering the Future of the Jewellery Trade"
              variant="clipUp"
              className="font-clash text-4xl font-bold tracking-tight md:text-5xl"
            />
          </div>

          <div className="space-y-8 text-lg leading-relaxed text-foreground/80">
            <div data-founder-item>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">The Catalyst</h3>
              <p>
                I am <strong>Jenil Dholakiya</strong>, Strategic Founder and CTO of <strong>AurumOS</strong>. My
                journey lives at the intersection of high-performance engineering and the timeless precision of the
                jewellery industry. I don&apos;t just build software — I build the infrastructure that lets the artistry
                of jewellery flourish without the burden of administrative friction.
              </p>
            </div>

            <div data-founder-item>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">My Philosophy</h3>
              <p>
                In an era where technology prizes speed over substance, I champion a different path. I believe
                relationships are the true currency of business. AurumOS is a meticulously architected ecosystem
                designed to uphold the sanctity of your trade — where every gram, every hallmark, and every transaction
                is accounted for with absolute integrity.
              </p>
            </div>

            <div data-founder-item>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">The Technical Edge</h3>
              <p>
                Whether architecting scalable infrastructure at <strong>VertexWeb</strong> or calibrating hardware for
                real-time inventory, my work is driven by one purpose: to empower you. By pairing modern web frameworks
                with data science and machine learning, I turn enterprise complexity into intuitive, seamless
                experiences — until technology becomes an invisible thread strengthening your craft.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollStage>
  );
}
