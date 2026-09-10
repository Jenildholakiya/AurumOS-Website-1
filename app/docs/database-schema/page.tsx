import DocPage from '@/components/layout/DocPage';
import { Database } from 'lucide-react';

const meta = {
  title: 'Database Schema',
  description: 'SQLite schema design, tables, relationships, indexes, and sync versioning.',
  icon: <Database className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '14 min',
};

function TableBlock({ name, desc, columns }: { name: string; desc: string; columns: { name: string; type: string; note?: string }[] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
      <div className="mb-1 font-bold text-foreground">{name}</div>
      <p className="mb-3 text-xs text-foreground/50">{desc}</p>
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border/40 bg-foreground/5"><th className="px-3 py-2 text-left font-bold">Column</th><th className="px-3 py-2 text-left font-bold">Type</th><th className="px-3 py-2 text-left font-bold">Note</th></tr></thead>
          <tbody className="divide-y divide-border/30">
            {columns.map((col) => (<tr key={col.name}><td className="px-3 py-1.5 font-mono text-primary">{col.name}</td><td className="px-3 py-1.5 text-foreground/60">{col.type}</td><td className="px-3 py-1.5 text-foreground/40">{col.note || '—'}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DatabaseSchemaPage() {
  return (
    <DocPage meta={meta} prev={{ label: 'Architecture Overview', href: '/docs/architecture' }} next={{ label: 'Configuration Guide', href: '/docs/configuration' }}>
      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Database Overview</h2>
          <p>AurumOS uses SQLite3 in WAL (Write-Ahead Logging) mode for concurrent read access and crash safety.</p>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Core Tables</h2>
          <div className="space-y-4">
            <TableBlock name="stock_inventory" desc="Master inventory table for all jewelry items" columns={[
              { name: 'local_id', type: 'INTEGER', note: 'Primary key' },
              { name: 'tag_id', type: 'TEXT', note: 'Unique tag identifier' },
              { name: 'product_code', type: 'TEXT', note: 'Links to product master' },
              { name: 'weight', type: 'REAL', note: 'Weight in grams' },
              { name: 'touch', type: 'INTEGER', note: 'Purity (e.g., 916, 750)' },
              { name: 'huid', type: 'TEXT', note: 'Hallmark Unique ID' },
              { name: 'design_code', type: 'TEXT', note: 'Design reference' },
              { name: 'sync_version', type: 'INTEGER', note: 'LAN sync version counter' },
            ]} />
            <TableBlock name="sales_history" desc="All billing and sales transactions" columns={[
              { name: 'vch_id', type: 'INTEGER', note: 'Primary key (bill ID)' },
              { name: 'client_id', type: 'INTEGER', note: 'FK to clients_master' },
              { name: 'total_weight', type: 'REAL', note: 'Total weight sold' },
              { name: 'total_amount', type: 'REAL', note: 'Total amount in INR' },
              { name: 'payment_method', type: 'TEXT', note: 'Cash / UPI / Card' },
              { name: 'sync_version', type: 'INTEGER', note: 'Sync version' },
            ]} />
            <TableBlock name="clients_master" desc="Client/customer master data" columns={[
              { name: 'client_id', type: 'INTEGER', note: 'Primary key' },
              { name: 'name', type: 'TEXT', note: 'Client name' },
              { name: 'phone', type: 'TEXT', note: 'Contact number' },
              { name: 'metal_limit', type: 'REAL', note: 'Metal credit limit' },
              { name: 'cash_limit', type: 'REAL', note: 'Cash credit limit' },
            ]} />
            <TableBlock name="credit_ledger" desc="Double-entry ledger for metal and cash" columns={[
              { name: 'entry_id', type: 'INTEGER', note: 'Primary key' },
              { name: 'client_id', type: 'INTEGER', note: 'FK to clients_master' },
              { name: 'type', type: 'TEXT', note: 'metal_debit, cash_credit, etc.' },
              { name: 'metal_weight', type: 'REAL', note: 'Weight in grams' },
              { name: 'cash_amount', type: 'REAL', note: 'Cash amount in INR' },
            ]} />
            <TableBlock name="admin_creds" desc="User authentication credentials" columns={[
              { name: 'user_id', type: 'INTEGER', note: 'Primary key' },
              { name: 'username', type: 'TEXT', note: 'Login username' },
              { name: 'password_hash', type: 'TEXT', note: 'SHA-256 hash' },
              { name: 'role', type: 'TEXT', note: 'owner / staff' },
            ]} />
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Sync Versioning</h2>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <p className="text-sm">Every sync-capable table includes a sync_version INTEGER column that auto-increments on each write. During LAN sync, peers exchange version numbers and only transmit rows with higher versions.</p>
          </div>
        </section>
      </div>
    </DocPage>
  );
}
