import DocPage from '@/components/layout/DocPage';
import { AlertTriangle } from 'lucide-react';

const meta = {
  title: 'Troubleshooting Guide',
  description: 'Common issues, error codes, diagnostic steps, and solutions for AurumOS.',
  icon: <AlertTriangle className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '10 min',
};

const issues = [
  { title: 'WebView2 not found', symptoms: 'Application fails to start with "WebView2 Runtime not installed" error.', solution: 'Download and install Microsoft Edge WebView2 Runtime from the official Microsoft website. Restart AurumOS after installation.' },
  { title: 'License key rejected', symptoms: 'The license activation screen shows "Invalid license key" even with a valid key.', solution: 'Check your internet connection. Ensure the key format is correct: AU-XXXX-XXXX-XXXX-XXXX.' },
  { title: 'App won\'t start after update', symptoms: 'AurumOS crashes immediately after updating to a new version.', solution: 'Ensure .NET Framework 4.8+ is installed. Try running as Administrator. Restore from backup if needed.' },
  { title: 'Scale not detecting COM port', symptoms: 'The scale widget shows "No COM ports found" or fails to connect.', solution: 'Check the USB cable. Try different USB ports. Verify the COM port in Device Manager.' },
  { title: 'Thermal printer not printing', symptoms: 'Tags are sent to the printer but nothing prints, or output is garbled.', solution: 'Verify the printer is set as default in Windows. Check paper size in Settings > Printer.' },
  { title: 'LAN sync not working', symptoms: 'Client PC cannot connect to the host PC for data synchronization.', solution: 'Ensure both PCs are on the same network. Check that ports 58901 (TCP) and 58902 (UDP) are open.' },
  { title: 'Database locked error', symptoms: 'Error message "database is locked" appears during heavy operations.', solution: 'This usually resolves automatically. If persistent, close other instances of AurumOS.' },
  { title: 'BASTION auto-suspension', symptoms: 'The application is suspended with a BASTION security alert.', solution: 'Use the one-time unlock code system to restore access. Check the forensic PDF report.' },
];

export default function TroubleshootingPage() {
  return (
    <DocPage meta={meta} prev={{ label: 'Release Notes', href: '/docs/release-notes' }} next={{ label: 'FAQ', href: '/docs/faq' }}>
      <div className="space-y-6 text-foreground/80 leading-relaxed">
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-5 backdrop-blur-sm">
          <p className="text-sm text-amber-800"><strong>Tip:</strong> Always check C:\AurumOS\logs\ for detailed error messages.</p>
        </div>
        {issues.map((issue, i) => (
          <div key={issue.title} className="rounded-xl border border-border/60 bg-white/60 p-6 backdrop-blur-sm">
            <div className="mb-3 flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
              <h3 className="text-lg font-bold text-foreground">{issue.title}</h3>
            </div>
            <div className="ml-10 space-y-3">
              <div><div className="mb-1 text-xs font-bold uppercase tracking-wider text-foreground/40">Symptoms</div><p className="text-sm text-foreground/70">{issue.symptoms}</p></div>
              <div><div className="mb-1 text-xs font-bold uppercase tracking-wider text-foreground/40">Solution</div><p className="text-sm text-foreground/70">{issue.solution}</p></div>
            </div>
          </div>
        ))}
      </div>
    </DocPage>
  );
}
