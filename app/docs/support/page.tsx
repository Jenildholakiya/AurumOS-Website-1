import DocPage from '@/components/layout/DocPage';
import { HeadphonesIcon } from 'lucide-react';

const meta = {
  title: 'Support Procedures',
  description: 'How to get help, contact support, and report issues.',
  icon: <HeadphonesIcon className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '5 min',
};

export default function SupportPage() {
  return (
    <DocPage meta={meta} prev={{ label: 'Training Materials', href: '/docs/training' }} next={{ label: 'Security Policy', href: '/docs/security' }}>
      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Support Channels</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { title: 'In-App AI Assistant', desc: 'Click the AI Support icon for instant help.', badge: 'Instant' },
              { title: 'Email Support', desc: 'Contact through Settings > Support. 24h response.', badge: '24h' },
              { title: 'Documentation', desc: 'Browse these docs for detailed guides.', badge: 'Self-Service' },
              { title: 'Priority Support', desc: 'Enterprise subscribers get faster response times.', badge: 'Enterprise' },
            ].map((ch) => (
              <div key={ch.title} className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-bold text-foreground">{ch.title}</h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{ch.badge}</span>
                </div>
                <p className="text-sm text-foreground/70">{ch.desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Reporting an Issue</h2>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <ol className="list-decimal space-y-3 pl-5 text-sm">
              <li><strong>Gather information:</strong> Note the error message and AurumOS version.</li>
              <li><strong>Check the logs:</strong> Visit C:\AurumOS\logs\ for error logs.</li>
              <li><strong>Try Troubleshooting:</strong> Check the Troubleshooting Guide.</li>
              <li><strong>Contact support:</strong> Use AI assistant or email support.</li>
            </ol>
          </div>
        </section>
      </div>
    </DocPage>
  );
}
