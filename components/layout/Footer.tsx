'use client';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Import your specific icons
import { faLinkedin, faTwitter, faGithub, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faArrowUp } from '@fortawesome/free-solid-svg-icons';

const footerLinks = [
  { title: "Product", links: ["Wholesale", "Retail POS", "HUID Compliance", "Analytics"] },
  { title: "Company", links: ["Founder Vision", "Data Sovereignty", "Our Ecosystem", "VertexWeb"] },
  { title: "Support", links: ["24/7 Help", "System Status", "Documentation", "Contact"] }
];

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative pt-24 pb-12 px-6 border-t border-border bg-background">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          <motion.div className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl font-bold tracking-tighter">Aurum<span className="text-primary">OS</span></h2>
            <p className="text-foreground/80 leading-relaxed">
              The intelligence core for the modern jewellery trade. Engineered for integrity, scaled for enterprise.
            </p>

            <div className="flex gap-4">
              <SocialIcon icon={faLinkedin} label="AurumOS on LinkedIn" href="https://www.linkedin.com" />
              <SocialIcon icon={faTwitter} label="AurumOS on X" href="https://twitter.com" />
              <SocialIcon icon={faGithub} label="AurumOS on GitHub" href="https://github.com" />
              <SocialIcon icon={faInstagram} label="AurumOS on Instagram" href="https://instagram.com" />
              <SocialIcon icon={faEnvelope} label="Email AurumOS" href="mailto:hello@aurumos.app" />
            </div>
          </motion.div>

          {footerLinks.map((group, idx) => (
            <motion.div key={group.title} className="space-y-6">
              <h3 className="font-bold uppercase tracking-widest text-xs text-foreground/70">{group.title}</h3>
              <ul className="space-y-4">
                {group.links.map((link) => (
                  <motion.li key={link} whileHover={{ x: 5, color: "var(--primary)" }} className="text-foreground/80 cursor-pointer">
                    {link}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex justify-between items-center">
          <p className="text-sm text-foreground/70">© {new Date().getFullYear()} AurumOS by VertexWeb.</p>
          <motion.button onClick={scrollToTop} aria-label="Back to top" className="bg-primary/10 p-3 rounded-full text-primary">
            <FontAwesomeIcon icon={faArrowUp} />
          </motion.button>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ icon, label, href }: { icon: any; label: string; href: string }) {
  const external = href.startsWith("http");
  return (
    <motion.a
      href={href}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      whileHover={{ scale: 1.2, color: "var(--primary)" }}
      className="size-11 rounded-full border border-border flex items-center justify-center text-foreground/70"
    >
      <FontAwesomeIcon icon={icon} size="lg" />
    </motion.a>
  );
}