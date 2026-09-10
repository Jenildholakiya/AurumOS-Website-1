import DocPage from '@/components/layout/DocPage';
import { Shield } from 'lucide-react';

const meta = {
  title: 'Security Policy',
  description: 'Data protection, encryption, authentication, and security practices.',
  icon: <Shield className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '10 min',
};

export default function SecurityPage() {
  return (
    <DocPage meta={meta} prev={{ label: 'Support Procedures', href: '/docs/support' }} next={{ label: 'Compliance Docs', href: '/docs/compliance' }}>
      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Security Overview</h2>
          <p>AurumOS uses a <strong>zero-knowledge, local-first</strong> architecture. Your data never leaves your machine unless you enable cloud features.</p>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Data Encryption</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">License Key Encryption</h4>
              <p className="text-sm">License keys are encrypted using XOR cipher with the machine ID as the key.</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">Password Hashing</h4>
              <p className="text-sm">Passwords are hashed using SHA-256. Plain-text passwords are never stored.</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">Hardware Fingerprinting</h4>
              <p className="text-sm">Machine identity derived from motherboard serial, hashed with SHA-256.</p>
            </div>
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">BASTION AI Security</h2>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <div className="space-y-2">
              {[
                { thread: 'DB Watchdog', interval: '30s', desc: 'Detects external database modifications' },
                { thread: 'Session Guard', interval: '60s', desc: 'Validates registry session tokens' },
                { thread: 'Auto Healer', interval: '5min', desc: 'Fixes stale backups and logs' },
                { thread: 'Pattern Learner', interval: '24h', desc: 'Analyzes 30-day event history' },
                { thread: 'Alert Sender', interval: '5min', desc: 'Sends alerts via Gmail or Dashboard' },
              ].map((t) => (
                <div key={t.thread} className="flex items-start gap-3 rounded-lg border border-border/40 bg-white/40 px-4 py-3">
                  <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{t.interval}</span>
                  <div><div className="text-sm font-bold text-foreground">{t.thread}</div><div className="text-xs text-foreground/60">{t.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Threat Escalation</h2>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {['DETECT', 'WARN', 'RESTRICT', 'SUSPEND'].map((stage, i) => (
                <span key={stage} className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{stage}</span>
                  {i < 3 && <span className="text-foreground/30">/</span>}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm text-foreground/60">After SUSPEND, a forensic PDF is generated and the system awaits a one-time unlock code.</p>
          </div>
        </section>
      </div>
    </DocPage>
  );
}
