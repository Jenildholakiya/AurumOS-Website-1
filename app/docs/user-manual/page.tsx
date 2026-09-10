import DocPage from '@/components/layout/DocPage';
import { BookOpen } from 'lucide-react';

const meta = {
  title: 'User Manual',
  description: 'Complete guide to using AurumOS for billing, inventory, POS, karigar management, and more.',
  icon: <BookOpen className="size-5" />,
  lastUpdated: 'Aug 2026',
  readTime: '15 min',
};

export default function UserManualPage() {
  return (
    <DocPage
      meta={meta}
      next={{ label: 'Installation Guide', href: '/docs/installation' }}
    >
      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Introduction</h2>
          <p>
            AurumOS is a jewelry shop management desktop application designed for point-of-sale (POS),
            inventory tracking, billing, accounting, and artisan (karigar) management. It runs as a
            native Windows desktop application using a web-based interface rendered via Microsoft Edge/WebView2.
          </p>
        </section>

        <section>
          <h3 className="mb-4 text-xl font-bold text-foreground">Key Features</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { module: 'Billing (Wholesale)', desc: 'Create wholesale bills with item selection, discount/tax, and print' },
              { module: 'POS Billing', desc: 'Quick retail point-of-sale with scale integration' },
              { module: 'Inventory Management', desc: 'Track stock items with tag IDs, weight, touch, HUID, design codes' },
              { module: 'Client Ledger', desc: 'Double-entry credit ledger for metal and cash transactions' },
              { module: 'Karigar Management', desc: 'Track artisan jobs, inward/outward items' },
              { module: 'Katti Vouchers', desc: 'Manufacturing job vouchers with item tracking' },
              { module: 'Cash & Bank', desc: 'Cash flow tracking, bank account management' },
              { module: 'Chart of Accounts', desc: 'Full double-entry accounting' },
              { module: 'Staff Management', desc: 'Multi-user access with role-based permissions' },
              { module: 'Network Mode', desc: 'Multi-PC LAN sync for multi-shop setups' },
              { module: 'AI Support', desc: 'Built-in AI assistant powered by Groq (LLaMA 3.3)' },
              { module: 'Auto Updates', desc: 'Automatic version updates from GitHub releases' },
            ].map((item) => (
              <div key={item.module} className="rounded-xl border border-border/60 bg-white/60 p-4 backdrop-blur-sm">
                <div className="mb-1 text-sm font-bold text-foreground">{item.module}</div>
                <div className="text-sm text-foreground/60">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xl font-bold text-foreground">Getting Started</h3>
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">First Launch</h4>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                <li>Double-click <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">AurumOS.exe</code> to launch the application.</li>
                <li>The setup wizard will guide you through entering your <strong>License Key</strong> (format: <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">AU-XXXX-XXXX-XXXX-XXXX</code>).</li>
                <li>Set up your <strong>Business Profile</strong> (shop name, address, phone, GSTIN).</li>
                <li>Create your <strong>Admin/Owner account</strong> (username + password).</li>
                <li>Once setup is complete, the dashboard loads automatically.</li>
              </ol>
            </div>
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">Login</h4>
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Enter your username and password on the login screen.</li>
                <li>After 3 failed login attempts, a <strong>5-minute lockout</strong> is enforced.</li>
                <li>Owner accounts have full access; Staff accounts have permissions set by the owner.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xl font-bold text-foreground">Billing</h3>
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">Wholesale Billing</h4>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                <li>Navigate to <strong>Billing</strong> from the sidebar.</li>
                <li>Select a Client from the dropdown (or add a new one).</li>
                <li>Add items: search by product code, name, or category.</li>
                <li>Enter <strong>weight</strong>, <strong>touch</strong> (purity), and <strong>quantity</strong>.</li>
                <li>The system auto-calculates fine weight and amount.</li>
                <li>Apply discount or tax if needed, then click <strong>Save Bill</strong>.</li>
              </ol>
            </div>
            <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
              <h4 className="mb-2 font-bold text-foreground">POS (Retail) Billing</h4>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                <li>Navigate to <strong>POS Billing</strong> from the sidebar.</li>
                <li>Scan or search for products.</li>
                <li>Enter quantities and weights.</li>
                <li>Select payment method (Cash / UPI / Card).</li>
                <li>Click <strong>Save &amp; Print</strong> to complete the transaction.</li>
              </ol>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xl font-bold text-foreground">Inventory Management</h3>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm">
              <li>Navigate to <strong>Inventory</strong> from the sidebar.</li>
              <li>Click <strong>Add Item</strong> and fill in Tag ID, Product Code, Weight, Touch/Purity, HUID, Design Code, and Pieces.</li>
              <li>Click <strong>Save</strong> to add the item.</li>
              <li>Use <strong>filters</strong> to narrow by category, touch, or design.</li>
              <li>Access <strong>Stock Reports</strong> for summaries, low stock alerts, and tag-wise reports.</li>
            </ol>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xl font-bold text-foreground">Client Ledger</h3>
          <div className="rounded-xl border border-border/60 bg-white/60 p-5 backdrop-blur-sm">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm">
              <li>Navigate to <strong>Client Ledger</strong> and click <strong>Add Client</strong>.</li>
              <li>Enter client details: name, phone number, metal balance limits, cash balance limits.</li>
              <li>Select the client and click <strong>New Entry</strong>.</li>
              <li>Choose transaction type: Metal Debit/Credit or Cash Debit/Credit.</li>
              <li>The ledger shows all transactions chronologically with running balances.</li>
            </ol>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xl font-bold text-foreground">Keyboard Shortcuts</h3>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-white/60 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-foreground/5">
                  <th className="px-5 py-3 text-left font-bold">Shortcut</th>
                  <th className="px-5 py-3 text-left font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {[
                  ['Enter', 'Submit form / Confirm action'],
                  ['Esc', 'Close modal / Cancel'],
                  ['Ctrl + P', 'Print current page'],
                  ['Ctrl + S', 'Save current form'],
                  ['Ctrl + N', 'New entry'],
                ].map(([shortcut, action]) => (
                  <tr key={shortcut}>
                    <td className="px-5 py-2.5"><code className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">{shortcut}</code></td>
                    <td className="px-5 py-2.5 text-foreground/70">{action}</td>
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
