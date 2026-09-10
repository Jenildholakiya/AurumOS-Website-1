import DocPage from '@/components/layout/DocPage';
import { HelpCircle } from 'lucide-react';

const meta = {
  title: 'FAQ',
  description: 'Frequently asked questions about AurumOS features, pricing, setup, and operations.',
  icon: <HelpCircle className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '5 min',
};

const faqs = [
  { q: 'What is AurumOS?', a: 'AurumOS is a jewelry shop management desktop application designed for POS, inventory tracking, billing, accounting, and artisan management.' },
  { q: 'What are the system requirements?', a: 'Windows 10 (64-bit) or later, Intel Core i3+, 4 GB RAM, and 500 MB free disk space.' },
  { q: 'How do I activate my license?', a: 'On first launch, enter your license key (AU-XXXX-XXXX-XXXX-XXXX) in the activation screen.' },
  { q: 'Can I use AurumOS on multiple PCs?', a: 'Yes! AurumOS supports multi-PC LAN synchronization with Host/Client architecture.' },
  { q: 'What subscription plans are available?', a: 'Lite (Rs. 3,000/year), Pro (Rs. 7,000/year), and Enterprise (Rs. 15,000/year).' },
  { q: 'Is my data safe?', a: 'Yes. AurumOS uses a local-first architecture with encrypted SQLite database and BASTION AI security.' },
  { q: 'Does AurumOS support HUID compliance?', a: 'Yes. Built-in HUID tracking with complete hallmarking audit trails.' },
  { q: 'Can I integrate a weighing scale?', a: 'Yes. Any digital weighing scale with COM/Serial port output is supported.' },
];

export default function FaqPage() {
  return (
    <DocPage meta={meta} prev={{ label: 'Troubleshooting Guide', href: '/docs/troubleshooting' }} next={{ label: 'Training Materials', href: '/docs/training' }}>
      <div className="space-y-4 text-foreground/80 leading-relaxed">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-white/60 p-6 backdrop-blur-sm">
            <div className="mb-2 flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">Q</span>
              <h3 className="font-bold text-foreground">{faq.q}</h3>
            </div>
            <div className="ml-9 flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-xs font-bold text-foreground/40">A</span>
              <p className="text-sm text-foreground/70">{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
    </DocPage>
  );
}
