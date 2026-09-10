import DocPage from '@/components/layout/DocPage';
import { Scale } from 'lucide-react';

const meta = {
  title: 'Compliance Docs',
  description: 'Regulatory compliance, HUID standards, audit trails, and GST reporting.',
  icon: <Scale className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '8 min',
};

export default function CompliancePage() {
  return (
    <DocPage meta={meta} prev={{ label: 'Security Policy', href: '/docs/security' }}>
      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Regulatory Compliance</h2>
          <p>AurumOS helps jewelry businesses comply with Indian regulatory requirements including hallmarking norms, GST regulations, and audit trail mandates.</p>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">HUID Compliance</h2>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" /><strong>HUID Tagging:</strong> Tag every item with its unique HUID number.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" /><strong>HUID Verification:</strong> Quick search and verification across inventory.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" /><strong>Audit Trail:</strong> Complete history of HUID assignments and changes.</li>
            </ul>
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">GST Reporting</h2>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" /><strong>GSTIN Storage:</strong> GST Identification Number in Business Profile.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" /><strong>Tax Calculations:</strong> Automatic GST on bills (CGST + SGST or IGST).</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" /><strong>GST Reports:</strong> Generate GST-compliant reports for filing returns.</li>
            </ul>
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Data Sovereignty</h2>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />All data stored locally in encrypted SQLite database.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />No data transmitted without explicit configuration.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />Cloud backup is opt-in, Enterprise only.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />LAN sync stays within your local network.</li>
            </ul>
          </div>
        </section>
      </div>
    </DocPage>
  );
}
