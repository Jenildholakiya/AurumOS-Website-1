import DocPage from '@/components/layout/DocPage';
import { FileText } from 'lucide-react';

const meta = {
  title: 'Release Notes',
  description: 'Version history, changelogs, new features, improvements, and upgrade instructions.',
  icon: <FileText className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '8 min',
};

function VersionBlock({ version, date, features, improvements, fixes, security }: {
  version: string; date: string;
  features?: string[]; improvements?: string[]; fixes?: string[]; security?: string[];
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white/60 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">v{version}</span>
        <span className="text-sm text-foreground/50">{date}</span>
        {version === '1.0.2' && <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600">Current</span>}
      </div>
      {features && (<div className="mb-4"><h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground/40">New Features</h4><ul className="space-y-1.5 text-sm">{features.map((f) => <li key={f} className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500/60" />{f}</li>)}</ul></div>)}
      {improvements && (<div className="mb-4"><h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground/40">Improvements</h4><ul className="space-y-1.5 text-sm">{improvements.map((f) => <li key={f} className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500/60" />{f}</li>)}</ul></div>)}
      {fixes && (<div className="mb-4"><h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground/40">Bug Fixes</h4><ul className="space-y-1.5 text-sm">{fixes.map((f) => <li key={f} className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500/60" />{f}</li>)}</ul></div>)}
      {security && (<div><h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground/40">Security</h4><ul className="space-y-1.5 text-sm">{security.map((f) => <li key={f} className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500/60" />{f}</li>)}</ul></div>)}
    </div>
  );
}

export default function ReleaseNotesPage() {
  return (
    <DocPage meta={meta} prev={{ label: 'Configuration Guide', href: '/docs/configuration' }} next={{ label: 'Troubleshooting Guide', href: '/docs/troubleshooting' }}>
      <div className="space-y-6 text-foreground/80 leading-relaxed">
        <VersionBlock version="1.0.2" date="August 2026" features={['BASTION AI Security System: 5-thread background security monitor with auto-suspension', 'Forensic PDF Reports: Automatic report generation on security events', 'One-Time Unlock Keys: Nonce-based unlock system for recovering from auto-suspension', 'Self-Learning Thresholds: BASTION learns normal behavior patterns over 30 days', 'Health Dashboard: Remote monitoring endpoint for fleet management']} improvements={['Improved sync reliability with better conflict detection', 'Scale widget with real-time weight display and auto-baud detection', 'Faster thermal printer output with QR code support', 'AI assistant upgraded to LLaMA 3.3 70B via Groq API']} fixes={['Fixed crash when WebView2 async operations fail', 'Fixed UTF-8 encoding issues on non-English Windows locales', 'Fixed registry session token corruption causing false login prompts', 'Fixed WAL file growth issue during heavy sync operations']} security={['Added hardware fingerprinting (motherboard serial hash)', 'Added progressive threat escalation (WARN, RESTRICT, SUSPEND)', 'Added DB watchdog for detecting external database modifications', 'Added session guard for registry token validation']} />
        <VersionBlock version="1.0.1" date="July 2026" features={['Multi-PC LAN Sync: Real-time data synchronization between multiple computers', 'Network Mode: Host/Client architecture for multi-shop management', 'UDP Discovery: Automatic peer detection on local network', 'Subscription Plans: Lite, Pro, and Enterprise tiers']} improvements={['Faster startup with optimized database initialization', 'Better error handling when server is unreachable', '24-hour subscription cache for offline use']} fixes={['Fixed duplicate bill numbering when multiple PCs sync simultaneously', 'Fixed stock conflict detection for items sold on different PCs', 'Fixed printer selection not persisting across sessions']} />
        <VersionBlock version="1.0.0" date="June 2026" features={['Wholesale Billing: Full-featured bill creation with item selection, discount, tax', 'POS Billing: Quick retail point-of-sale', 'Inventory Management: Stock tracking with tag IDs, weight, touch, HUID', 'Client Ledger: Double-entry credit ledger (metal + cash)', 'Karigar Management: Artisan job tracking', 'Chart of Accounts: Double-entry accounting', 'Staff Management: Multi-user with role-based permissions']} />
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Roadmap</h2>
          <div className="space-y-3">
            {[{ ver: 'v1.1.0', items: 'Cloud backup, PDF export, barcode scanning, multi-currency, tax invoice templates' }, { ver: 'v1.2.0', items: 'Mobile companion app, SMS/WhatsApp delivery, customer portal, advanced analytics' }, { ver: 'v2.0.0', items: 'Full ERP suite, multi-location inventory, supply chain, e-commerce, AI forecasting' }].map((r) => (
              <div key={r.ver} className="flex items-start gap-3 rounded-lg border border-border/40 bg-white/40 px-4 py-3">
                <span className="shrink-0 rounded bg-foreground/5 px-2 py-0.5 text-xs font-bold text-foreground/50">{r.ver}</span>
                <span className="text-sm text-foreground/70">{r.items}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DocPage>
  );
}
