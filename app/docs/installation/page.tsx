import DocPage from '@/components/layout/DocPage';
import { Download } from 'lucide-react';

const meta = {
  title: 'Installation Guide',
  description: 'System requirements, installation steps, configuration, and setup instructions for AurumOS.',
  icon: <Download className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '10 min',
};

export default function InstallationPage() {
  return (
    <DocPage
      meta={meta}
      prev={{ label: 'User Manual', href: '/docs/user-manual' }}
      next={{ label: 'API Documentation', href: '/docs/api' }}
    >
      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">System Requirements</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground/50">Minimum</h4>
              <ul className="space-y-2 text-sm">
                <li><strong>OS:</strong> Windows 10 (64-bit) or later</li>
                <li><strong>CPU:</strong> Intel Core i3 or equivalent</li>
                <li><strong>RAM:</strong> 4 GB minimum</li>
                <li><strong>Storage:</strong> 500 MB free disk space</li>
                <li><strong>Display:</strong> 1280 x 720</li>
                <li><strong>Internet:</strong> Required for activation</li>
              </ul>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 backdrop-blur-sm">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Recommended</h4>
              <ul className="space-y-2 text-sm">
                <li><strong>OS:</strong> Windows 11 (64-bit)</li>
                <li><strong>CPU:</strong> Intel Core i5 or equivalent</li>
                <li><strong>RAM:</strong> 8 GB</li>
                <li><strong>Storage:</strong> 1 GB free disk space</li>
                <li><strong>Display:</strong> 1920 x 1080</li>
                <li><strong>Printer:</strong> Thermal receipt printer</li>
                <li><strong>Scale:</strong> Digital weighing scale (COM port)</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Installation Steps</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">1. Download</h4>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                <li>Download <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">AurumOS.exe</code> from the official release source.</li>
                <li>Ensure the download completes without interruption.</li>
                <li>Verify the file size (approximately 200-400 MB).</li>
              </ol>
            </div>
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">2. First-Time Setup</h4>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                <li>Create an installation folder: <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">C:\AurumOS\</code></li>
                <li>Copy <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">AurumOS.exe</code> and the <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">_internal/</code> folder.</li>
                <li>Double-click to launch.</li>
              </ol>
            </div>
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">3. License Activation</h4>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                <li>Enter your License Key: <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">AU-XXXX-XXXX-XXXX-XXXX</code></li>
                <li>Click <strong>Activate</strong> — the app validates with the license server.</li>
                <li>Upon success, the Setup Wizard begins.</li>
              </ol>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Configuration Files</h2>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <h4 className="mb-3 font-bold text-foreground">config.json</h4>
            <pre className="overflow-x-auto rounded-lg bg-foreground/5 p-4 text-xs font-mono text-foreground/80"><code>{`{
  "mode": "local",
  "server_ip": "",
  "server_port": 58901,
  "api_base_url": "https://aurum-os-admin.vercel.app"
}`}</code></pre>
            <div className="mt-4 overflow-hidden rounded-lg border border-border/40">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/40 bg-foreground/5"><th className="px-4 py-2 text-left font-bold">Key</th><th className="px-4 py-2 text-left font-bold">Description</th><th className="px-4 py-2 text-left font-bold">Default</th></tr></thead>
                <tbody className="divide-y divide-border/30">
                  <tr><td className="px-4 py-2 font-mono text-xs text-primary">mode</td><td className="px-4 py-2">"local" or "server"</td><td className="px-4 py-2">"local"</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs text-primary">server_ip</td><td className="px-4 py-2">IP of network host (client mode)</td><td className="px-4 py-2">""</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs text-primary">server_port</td><td className="px-4 py-2">Port for LAN sync server</td><td className="px-4 py-2">58901</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs text-primary">api_base_url</td><td className="px-4 py-2">Remote API server URL</td><td className="px-4 py-2">Vercel URL</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Network Configuration</h2>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <h4 className="mb-2 font-bold text-foreground">Firewall Ports</h4>
            <div className="overflow-hidden rounded-lg border border-border/40">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/40 bg-foreground/5"><th className="px-4 py-2 text-left font-bold">Port</th><th className="px-4 py-2 text-left font-bold">Protocol</th><th className="px-4 py-2 text-left font-bold">Purpose</th></tr></thead>
                <tbody className="divide-y divide-border/30">
                  <tr><td className="px-4 py-2 font-mono text-xs text-primary">58901</td><td className="px-4 py-2">TCP</td><td className="px-4 py-2">HTTP sync server</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs text-primary">58902</td><td className="px-4 py-2">UDP</td><td className="px-4 py-2">LAN discovery beacon</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs text-primary">7272</td><td className="px-4 py-2">TCP</td><td className="px-4 py-2">Network mode (Brain/Client)</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Updating AurumOS</h2>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <p className="mb-3 text-sm">When an update is available, a notification appears. Click <strong>Update Now</strong> to download and install. Your database and settings are preserved.</p>
            <h4 className="mb-2 font-bold text-foreground">Excluded from updates:</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li><code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">database/</code> (all data files)</li>
              <li><code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">config.json</code></li>
              <li><code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">logs/</code></li>
            </ul>
          </div>
        </section>
      </div>
    </DocPage>
  );
}
