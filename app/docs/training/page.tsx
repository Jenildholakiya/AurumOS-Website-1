import DocPage from '@/components/layout/DocPage';
import { GraduationCap } from 'lucide-react';

const meta = {
  title: 'Training Materials',
  description: 'Step-by-step guides and onboarding resources for AurumOS.',
  icon: <GraduationCap className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '6 min',
};

const modules = [
  { name: 'Getting Started', duration: '15 min', topics: ['First launch and setup wizard', 'Business profile configuration', 'Creating admin and staff accounts', 'Navigating the dashboard'] },
  { name: 'Wholesale Billing', duration: '20 min', topics: ['Creating wholesale bills', 'Adding items and applying discounts', 'Printing bills', 'Managing client accounts'] },
  { name: 'POS Billing', duration: '15 min', topics: ['Quick retail point-of-sale', 'Scale integration', 'Payment methods', 'Receipt printing'] },
  { name: 'Inventory Management', duration: '20 min', topics: ['Adding and editing stock items', 'Tag ID and HUID tracking', 'Stock reports', 'Batch operations'] },
  { name: 'Client Ledger', duration: '15 min', topics: ['Adding clients', 'Recording transactions', 'Viewing ledger history', 'Managing credit limits'] },
  { name: 'Accounting', duration: '25 min', topics: ['Chart of accounts setup', 'Cash and bank management', 'Profit and loss reports', 'Year-end closing'] },
];

export default function TrainingPage() {
  return (
    <DocPage meta={meta} prev={{ label: 'FAQ', href: '/docs/faq' }} next={{ label: 'Support Procedures', href: '/docs/support' }}>
      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Training Modules</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {modules.map((mod) => (
              <div key={mod.name} className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold text-foreground">{mod.name}</h3>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{mod.duration}</span>
                </div>
                <ul className="space-y-1.5 text-sm">
                  {mod.topics.map((t) => (<li key={t} className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/40" /><span className="text-foreground/70">{t}</span></li>))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DocPage>
  );
}
