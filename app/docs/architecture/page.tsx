import DocPage from '@/components/layout/DocPage';
import { Layers } from 'lucide-react';

const meta = {
  title: 'Architecture Overview',
  description: 'System architecture, layered design, component breakdown, and data flow diagrams.',
  icon: <Layers className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '12 min',
};

export default function ArchitecturePage() {
  return (
    <DocPage
      meta={meta}
      prev={{ label: 'API Documentation', href: '/docs/api' }}
      next={{ label: 'Database Schema', href: '/docs/database-schema' }}
    >
      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">System Architecture</h2>
          <p className="mb-4">AurumOS follows a layered desktop application architecture with a Python backend, a web-based frontend rendered via native WebView, and a local SQLite database.</p>
          <div className="rounded-xl border border-border/60 bg-white/60 p-6 backdrop-blur-sm">
            <pre className="overflow-x-auto text-xs font-mono leading-relaxed text-foreground/70"><code>{`┌─────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                  │
│  pywebview (EdgeChromium / WebView2)                 │
│  HTML/CSS/JS Frontend (58 pages)                     │
├─────────────────────────────────────────────────────┤
│                    BRIDGE LAYER                       │
│  window.pywebview.api.* (JS → Python)               │
│  ~80+ methods: auth, CRUD, printing, scale, AI      │
├─────────────────────────────────────────────────────┤
│                   APPLICATION LAYER                   │
│  AurumAPI │ SyncEng │ SubMgr │ Updater │ BastionAI  │
├─────────────────────────────────────────────────────┤
│                      DATA LAYER                       │
│  SQLite (WAL mode) - aurum_local.db                  │
├─────────────────────────────────────────────────────┤
│                  EXTERNAL SERVICES                    │
│  Vercel (License) │ GitHub (Updates) │ Groq (AI)    │
└─────────────────────────────────────────────────────┘`}</code></pre>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Core Modules</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { dir: 'core/', modules: ['tag_engine.py — Tag generation with QR codes', 'ai_support.py — Groq API integration', 'bastion_sync.py — Security sync logic', 'io_safety.py — Atomic file I/O', 'security_lock.py — Hardware ID generation'] },
              { dir: 'database/', modules: ['db_manager.py — SQLite CRUD and sync', 'bastion_ai.py — 5-thread security monitor', 'bastion_report.py — Forensic PDF generator', 'aurum_health.py — Health dashboard'] },
              { dir: 'network/', modules: ['discovery.py — UDP broadcast beacon', 'brain_server.py — HTTP host server', 'brain_client.py — Client node logic', 'brain_guard.py — Access control', 'handshake.py — Connection protocol'] },
              { dir: 'ui/', modules: ['58 HTML/CSS/JS pages', 'boot.js — API bridge shim', 'sidebar.js/css — Navigation', 'scale_widget.js — Scale UI', 'sse_stream.js — SSE handler'] },
            ].map((group) => (
              <div key={group.dir} className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
                <h4 className="mb-3 font-bold text-primary">{group.dir}</h4>
                <ul className="space-y-1.5 text-sm">
                  {group.modules.map((m) => (
                    <li key={m} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/40" />
                      <span className="text-foreground/70">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Security Architecture</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">License System</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li><strong>Key Format:</strong> <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">AU-XXXX-XXXX-XXXX-XXXX</code> (22 characters)</li>
                <li><strong>Encryption:</strong> XOR cipher with machine ID as key</li>
                <li><strong>Storage:</strong> Encrypted in <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">database/.license_key</code></li>
                <li><strong>Offline Grace:</strong> 24-hour cached validation</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">Bastion Security Flow</h4>
              <p className="mb-3 text-sm">5 daemon threads continuously monitor:</p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li><strong>DB Watchdog</strong> (30s) — Detects external database modifications</li>
                <li><strong>Session Guard</strong> (60s) — Validates registry session tokens</li>
                <li><strong>Auto Healer</strong> (5min) — Fixes stale backups, WAL, logs</li>
                <li><strong>Pattern Learner</strong> (24h) — Analyzes 30-day event history</li>
                <li><strong>Alert Sender</strong> (5min) — Sends alerts via Gmail / Health Dashboard</li>
              </ul>
              <div className="mt-4 rounded-lg bg-foreground/5 p-3 text-sm font-mono text-foreground/70">
                DETECT → WARN → RESTRICT → SUSPEND → Generate forensic PDF → Await unlock
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Technology Stack</h2>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-white/60 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/60 bg-foreground/5"><th className="px-5 py-3 text-left font-bold">Layer</th><th className="px-5 py-3 text-left font-bold">Technology</th></tr></thead>
              <tbody className="divide-y divide-border/40">
                {[
                  ['Language', 'Python 3.12'],
                  ['UI Framework', 'pywebview + EdgeChromium'],
                  ['Frontend', 'Vanilla HTML/CSS/JS (ES6+)'],
                  ['Database', 'SQLite3 (WAL mode)'],
                  ['Build', 'PyInstaller (ONEDIR)'],
                  ['AI', 'Groq API (LLaMA 3.3 70B)'],
                  ['License Server', 'Next.js on Vercel'],
                  ['Auto-Update', 'GitHub Releases API'],
                  ['LAN Sync', 'UDP + HTTP (custom)'],
                ].map(([layer, tech]) => (
                  <tr key={layer}>
                    <td className="px-5 py-2.5 font-medium">{layer}</td>
                    <td className="px-5 py-2.5 text-foreground/70">{tech}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DocPage>
  );
}
