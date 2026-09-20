/**
 * Website Postgres connection (shared DB with the admin app).
 * Reads POSTGRES_URL from the root .env.local (copied from admin/.env.local).
 * Website tables are `site_*` prefixed — never collide with admin tables.
 */

import { Pool, type QueryResultRow } from 'pg';

let _pool: Pool | null = null;
let _ensured = false;

const SITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS site_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  business TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  plan_interest TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_users_email_unique ON site_users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_site_users_email ON site_users (LOWER(email));

CREATE TABLE IF NOT EXISTS site_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES site_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ip TEXT,
  ua TEXT
);
CREATE INDEX IF NOT EXISTS idx_site_sessions_user ON site_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_site_sessions_expires ON site_sessions (expires_at);

CREATE TABLE IF NOT EXISTS site_orders (
  idempotency_key TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL,
  software_type TEXT NOT NULL,
  form JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  license_key TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  mock BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_site_orders_razorpay ON site_orders (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_site_orders_email ON site_orders (LOWER(email));

CREATE TABLE IF NOT EXISTS site_licenses (
  key TEXT PRIMARY KEY,
  business_name TEXT NOT NULL DEFAULT '',
  owner_name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  notes TEXT,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  software_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  plan_type TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 15,
  is_used BOOLEAN NOT NULL DEFAULT false,
  machine_id TEXT,
  subscription_started_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_id TEXT,
  order_id TEXT,
  idempotency_key TEXT
);
CREATE INDEX IF NOT EXISTS idx_site_licenses_email ON site_licenses (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_site_licenses_payment ON site_licenses (payment_id);
CREATE INDEX IF NOT EXISTS idx_site_licenses_created ON site_licenses (created_at DESC);

CREATE TABLE IF NOT EXISTS site_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES site_users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_site_tokens_user ON site_tokens (user_id);
`;

export function getPool(): Pool {
  if (!_pool) {
    const connStr = process.env.POSTGRES_URL;
    if (!connStr) {
      throw new Error(
        'POSTGRES_URL is not set. Copy it from admin/.env.local into .env.local (root).'
      );
    }
    const cleanConnStr = connStr
      .replace(/([?&])sslmode=[^&]*/g, '$1')
      .replace(/\?&/, '?')
      .replace(/&&/g, '&')
      .replace(/[?&]$/, '');
    _pool = new Pool({
      connectionString: cleanConnStr,
      ssl: { rejectUnauthorized: false },
      max: 5,
      min: 1,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });
    _pool.on('error', (err) => {
      console.error('[site DB] Pool error:', err);
      _pool = null;
    });
  }
  return _pool;
}

/** Idempotent one-time schema ensure per process. */
export async function ensureSchema(): Promise<void> {
  if (_ensured) return;
  _ensured = true;
  await getPool().query(SITE_SCHEMA);
}

export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool();
  const result = await pool.query<T>(text, params as unknown[]);
  return { rows: result.rows, rowCount: result.rowCount ?? 0 };
}
