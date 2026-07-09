'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function FounderSection() {
  return (
    <section className="py-24 px-6 bg-primary/5">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Image & Signature */}
        <div className="lg:col-span-4 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            /* Changed from aspect-[3/4] to aspect-[9/16] */
            className="relative aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent z-10" />
            <Image 
              src="/founder.jpeg" 
              alt="Jenil Dholakiya"
              fill
              className="object-cover"
            />
          </motion.div>
          
          <div className="pl-2">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="font-['Dancing_Script',_cursive] text-4xl text-primary"
            >
              Jenil Dholakiya
            </motion.div>
            <div className="text-sm uppercase tracking-[0.2em] text-foreground/50 font-medium mt-2">
              Strategic Founder & CTO
            </div>
          </div>
        </div>

        {/* Right Column: Narrative */}
        <div className="lg:col-span-8 space-y-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Engineering the Future of the Jewellery Trade
          </h2>

          <div className="space-y-8 text-foreground/80 leading-relaxed text-lg">
            <div>
              <h3 className="text-primary font-semibold mb-2 text-sm uppercase tracking-widest">The Catalyst</h3>
              <p>
                I am <strong>Jenil Dholakiya</strong>, Strategic Founder and CTO of <strong>AurumOS</strong>. My journey is defined by the intersection of high-performance engineering and the timeless precision of the jewellery industry. I don't just build software; I build the infrastructure that allows the artistry of jewellery to flourish without the burden of administrative friction.
              </p>
            </div>

            <div>
              <h3 className="text-primary font-semibold mb-2 text-sm uppercase tracking-widest">My Philosophy</h3>
              <p>
                In an era where technology often prioritizes speed over substance, I champion a different path. I believe that <strong>relationships are the true currency of business.</strong> AurumOS is more than just code; it is a meticulously architected ecosystem designed to uphold the sanctity of your trade—where every gram, every hallmark, and every transaction is accounted for with absolute integrity. I believe that in this industry, business runs on one’s word, and my goal is to provide the digital foundation to protect that promise.
              </p>
            </div>

            <div>
              <h3 className="text-primary font-semibold mb-2 text-sm uppercase tracking-widest">The Technical Edge</h3>
              <p>
                Whether I am architecting scalable infrastructure at <strong>VertexWeb</strong> or calibrating hardware interfaces for real-time inventory tracking, my work is driven by a singular purpose: to empower you. By combining the latest in web frameworks with the rigors of data science and machine learning, I turn complex enterprise challenges into intuitive, seamless experiences. My work is not done until technology becomes an invisible thread—strengthening your operations so you can focus on the artistry of your craft.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}