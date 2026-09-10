import DocPage from '@/components/layout/DocPage';
import { Settings } from 'lucide-react';

const meta = {
  title: 'Configuration Guide',
  description: 'Config files, environment variables, network settings, and printer/scale configuration.',
  icon: <Settings className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '8 min',
};

export default function ConfigurationPage() {
  return (
    <DocPage meta={meta} prev={{ label: 'Database Schema', href: '/docs/database-schema' }} next={{ label: 'Release Notes', href: '/docs/release-notes' }}>
      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Configuration Files</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">config.json</h4>
              <p className="mb-3 text-sm text-foreground/60">Main configuration file at C:\AurumOS\config.json</p>
              <pre className="overflow-x-auto rounded-lg bg-foreground/5 p-4 text-xs font-mono text-foreground/80"><code>{'{\n  "mode": "local",\n  "server_ip": "",\n  "server_port": 58901,\n  "api_base_url": "https://aurum-os-admin.vercel.app"\n}'}</code></pre>
            </div>
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">version.json</h4>
              <pre className="overflow-x-auto rounded-lg bg-foreground/5 p-4 text-xs font-mono text-foreground/80"><code>{'{\n  "version": "1.0.2",\n  "download_url": "https://github.com/...",\n  "sha256": "..."\n}'}</code></pre>
            </div>
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Network Mode Setup</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-3 font-bold text-foreground">Host PC</h4>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                <li>Open config.json</li>
                <li>Set "mode": "server"</li>
                <li>Save and restart AurumOS</li>
                <li>LAN sync server starts on port 58901</li>
              </ol>
            </div>
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-3 font-bold text-foreground">Client PC</h4>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                <li>Open config.json</li>
                <li>Set mode to "client"</li>
                <li>Enter the host PC IP address</li>
                <li>Save and restart AurumOS</li>
              </ol>
            </div>
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Weighing Scale Setup</h2>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm">
              <li>Connect the scale via USB-to-Serial adapter.</li>
              <li>Open Device Manager to identify the COM port.</li>
              <li>Navigate to Settings {'>'} Scale.</li>
              <li>Click Detect Port or manually select the COM port.</li>
              <li>Set the baud rate (typically 9600 or 4800).</li>
              <li>Click Connect.</li>
            </ol>
          </div>
        </section>
      </div>
    </DocPage>
  );
}
