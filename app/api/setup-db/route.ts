import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * POST /api/setup-db — website Postgres bootstrap + JSON import.
 *   POST /api/setup-db             → ensure `site_*` schema, report backend + counts
 *   POST /api/setup-db?import=1    → also import ./data/*.json (upsert, skips dups)
 *
 * Guard: open in development; in production requires ?key=<SETUP_SECRET>.
 * Idempotent — safe to call repeatedly.
 */
export async function POST(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (process.env.NODE_ENV === 'production' && sp.get('key') !== process.env.SETUP_SECRET) {
    return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 });
  }

  const usePg = !!process.env.POSTGRES_URL;
  const report: Record<string, unknown> = { backend: usePg ? 'postgres' : 'files' };

  if (usePg) {
    const { ensureSchema, getPool } = await import('@/lib/db');
    await ensureSchema();
    const { rows } = await getPool().query(
      `SELECT (SELECT COUNT(*)::int FROM site_users) AS users,
              (SELECT COUNT(*)::int FROM site_sessions) AS sessions,
              (SELECT COUNT(*)::int FROM site_orders) AS orders,
              (SELECT COUNT(*)::int FROM site_licenses) AS licenses,
              (SELECT COUNT(*)::int FROM site_tokens) AS tokens`
    );
    report.counts = rows[0];
  }

  if (sp.get('import') === '1') {
    if (!usePg) {
      return NextResponse.json({ ok: false, error: 'POSTGRES_URL not set — nothing to import into.' }, { status: 400 });
    }
    const store = await import('@/lib/store');
    const dir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    const imported: Record<string, number> = { users: 0, sessions: 0, orders: 0, licenses: 0, tokens: 0 };
    async function read<T>(file: string): Promise<T[]> {
      try {
        const raw = await fs.readFile(path.join(dir, file), 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        return [];
      }
    }
    // Upserts — re-running never duplicates.
    const [users, sessions, orders, licenses, tokens] = await Promise.all([
      read<Parameters<typeof store.saveUser>[0]>('users.json'),
      read<Parameters<typeof store.saveSession>[0]>('sessions.json'),
      read<Parameters<typeof store.saveOrder>[0]>('website_orders.json'),
      read<Parameters<typeof store.saveLicense>[0]>('licenses.json'),
      read<Parameters<typeof store.saveToken>[0]>('tokens.json'),
    ]);
    for (const u of users) { await store.saveUser(u); imported.users++; }
    for (const s of sessions) { await store.saveSession(s); imported.sessions++; }
    for (const o of orders) { await store.saveOrder(o); imported.orders++; }
    for (const l of licenses) { await store.saveLicense(l); imported.licenses++; }
    for (const t of tokens) { await store.saveToken(t); imported.tokens++; }
    report.imported = imported;
  }

  return NextResponse.json({ ok: true, ...report });
}
