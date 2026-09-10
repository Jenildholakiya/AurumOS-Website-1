import DocPage from '@/components/layout/DocPage';
import { Code } from 'lucide-react';

const meta = {
  title: 'API Documentation',
  description: 'REST API endpoints, LAN sync protocol, SSE streams, and pywebview bridge API reference.',
  icon: <Code className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '20 min',
};

function EndpointBlock({ method, path, desc, request, response }: { method: string; path: string; desc: string; request?: string; response: string }) {
  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500/10 text-emerald-600',
    POST: 'bg-amber-500/10 text-amber-600',
    PUT: 'bg-blue-500/10 text-blue-600',
    DELETE: 'bg-red-500/10 text-red-600',
  };
  return (
    <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${methodColors[method] || ''}`}>{method}</span>
        <code className="text-sm font-mono text-foreground/80">{path}</code>
      </div>
      <p className="mb-3 text-sm text-foreground/70">{desc}</p>
      {request && (
        <div className="mb-3">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-foreground/40">Request</div>
          <pre className="overflow-x-auto rounded-lg bg-foreground/5 p-3 text-xs font-mono text-foreground/80"><code>{request}</code></pre>
        </div>
      )}
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-foreground/40">Response</div>
        <pre className="overflow-x-auto rounded-lg bg-foreground/5 p-3 text-xs font-mono text-foreground/80"><code>{response}</code></pre>
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <DocPage
      meta={meta}
      prev={{ label: 'Installation Guide', href: '/docs/installation' }}
      next={{ label: 'Architecture Overview', href: '/docs/architecture' }}
    >
      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Remote Server API</h2>
          <p className="mb-4 text-sm">Base URL: <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-primary">https://aurum-os-admin.vercel.app</code></p>
          <div className="space-y-4">
            <EndpointBlock
              method="POST"
              path="/api/check"
              desc="Validates a license key against a machine ID."
              request={`{\n  "key": "AU-XXXX-XXXX-XXXX-XXXX",\n  "machine_id": "uuid"\n}`}
              response={`{\n  "valid": true,\n  "status": "active",\n  "plan": "enterprise",\n  "expires": "2026-12-31T23:59:59Z"\n}`}
            />
            <EndpointBlock
              method="POST"
              path="/api/subscription/status"
              desc="Returns the current subscription state for a machine."
              request={`{\n  "machine_id": "uuid"\n}`}
              response={`{\n  "plan": "pro",\n  "features": ["billing", "stock", "reports"],\n  "status": "active",\n  "expires": "2026-12-31T23:59:59Z"\n}`}
            />
            <EndpointBlock
              method="POST"
              path="/api/subscription/renew"
              desc="Renews a subscription."
              request={`{\n  "key": "AU-XXXX-XXXX-XXXX-XXXX",\n  "machine_id": "uuid",\n  "plan": "enterprise"\n}`}
              response={`{\n  "success": true,\n  "new_expires": "2027-08-30T23:59:59Z",\n  "plan": "enterprise"\n}`}
            />
            <EndpointBlock
              method="GET"
              path="/api/subscription/plans"
              desc="Returns available subscription plans (Lite, Pro, Enterprise)."
              response={`{\n  "plans": [\n    { "id": "lite", "name": "Lite", "price": 3000, "currency": "INR" },\n    { "id": "pro", "name": "Pro", "price": 7000, "currency": "INR" },\n    { "id": "enterprise", "name": "Enterprise", "price": 15000, "currency": "INR" }\n  ]\n}`}
            />
            <EndpointBlock
              method="GET"
              path="/api/nexus/stream"
              desc="Server-Sent Events (SSE) stream for real-time license events."
              response={`event: license_update\ndata: {"status":"active","plan":"enterprise"}\n\nevent: feature_toggle\ndata: {"feature":"ai_assistant","enabled":true}`}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">LAN Sync API</h2>
          <p className="mb-4 text-sm">Base URL: <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-primary">http://{'{host_ip}'}:58901</code></p>
          <div className="space-y-4">
            <EndpointBlock
              method="GET"
              path="/aurum-sync/ping"
              desc="Peer identity check. Returns host device and shop information."
              response={`{\n  "device_id": "uuid",\n  "shop_id": "SHOP-XXXXXXXX",\n  "version": "1.0.2",\n  "tables": ["stock_inventory", "sales_history"]\n}`}
            />
            <EndpointBlock
              method="POST"
              path="/aurum-sync/exchange"
              desc="Bidirectional data exchange between peers."
              request={`{\n  "sender_device_id": "uuid",\n  "sender_shop_id": "SHOP-XXXXXXXX",\n  "versions": { "stock_inventory": 150 },\n  "data": { "stock_inventory": [...] }\n}`}
              response={`{\n  "status": "ok",\n  "received": { "stock_inventory": 3 },\n  "data": { "stock_inventory": [...] }\n}`}
            />
            <EndpointBlock
              method="POST"
              path="/brain/register"
              desc="Register a client node in network mode."
              request={`{\n  "machine_id": "uuid",\n  "hostname": "WORKSTATION-02",\n  "ip_address": "192.168.1.101"\n}`}
              response={`{\n  "registered": true,\n  "node_id": "NODE-002",\n  "access_level": "standard"\n}`}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">pywebview Bridge API</h2>
          <p className="mb-4 text-sm">The <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-primary">AurumAPI</code> class exposes ~80+ methods via <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-primary">window.pywebview.api.*</code></p>
          <div className="space-y-3">
            {[
              { method: 'verify_key(key)', desc: 'Validates a license key locally', returns: 'bool' },
              { method: 'check_license()', desc: 'Checks current license status against server', returns: 'object' },
              { method: 'navigate(page)', desc: 'Navigates to a specific page', returns: 'void' },
              { method: 'create_bill(bill_data)', desc: 'Creates a new sales bill', returns: 'int (bill ID)' },
              { method: 'add_stock_item(item)', desc: 'Adds a new stock item', returns: 'int (item ID)' },
              { method: 'get_stock_items(filters)', desc: 'Returns stock items with optional filters', returns: 'array' },
              { method: 'ai_ask(question)', desc: 'Sends a question to the AI assistant', returns: 'string' },
              { method: 'scale_start(port, baud)', desc: 'Starts reading from the weighing scale', returns: 'bool' },
              { method: 'print_tag(tag_data)', desc: 'Prints a single tag', returns: 'bool' },
              { method: 'bastion_get_status()', desc: 'Returns Bastion AI security status', returns: 'object' },
            ].map((item) => (
              <div key={item.method} className="flex items-start gap-3 rounded-lg border border-border/40 bg-white/40 px-4 py-3">
                <code className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">{item.method}</code>
                <div className="flex-1 text-sm text-foreground/70">{item.desc}</div>
                <code className="shrink-0 text-xs font-mono text-foreground/40">{item.returns}</code>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Error Handling</h2>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <div className="overflow-hidden rounded-lg border border-border/40">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/40 bg-foreground/5"><th className="px-4 py-2 text-left font-bold">Code</th><th className="px-4 py-2 text-left font-bold">Description</th></tr></thead>
                <tbody className="divide-y divide-border/30">
                  <tr><td className="px-4 py-2 font-mono text-xs text-emerald-600">200</td><td className="px-4 py-2">Success</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs text-amber-600">400</td><td className="px-4 py-2">Bad Request</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs text-red-600">401</td><td className="px-4 py-2">Unauthorized</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs text-red-600">500</td><td className="px-4 py-2">Internal Server Error</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </DocPage>
  );
}
