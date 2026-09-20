import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getPool } from '@/lib/db'

const CREATE_LICENSES_TABLE = `
CREATE TABLE IF NOT EXISTS licenses (
  id                BIGSERIAL PRIMARY KEY,
  key               TEXT NOT NULL UNIQUE,
  business_name     TEXT NOT NULL DEFAULT '',
  owner_name        TEXT NOT NULL DEFAULT '',
  city              TEXT DEFAULT '',
  phone             TEXT,
  notes             TEXT,
  amount_paid       NUMERIC,
  software_type     TEXT DEFAULT 'wholesale',
  status            TEXT DEFAULT 'active',
  plan_type         TEXT DEFAULT 'lite',
  duration_days     INT DEFAULT 15,
  is_used           BOOLEAN DEFAULT false,
  machine_id        TEXT,
  activated_machine TEXT,
  activated_at      TIMESTAMPTZ,
  trial_started_at  TIMESTAMPTZ,
  max_allowed_connections INT DEFAULT 1,
  allow_rebind      BOOLEAN DEFAULT false,
  subscription_expires_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_created ON licenses(created_at DESC);
`

const ADD_UPDATED_AT_COLUMN = `
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
`

// Columns/indexes the dashboard hot path needs. Kept here (one-time,
// admin-triggered) so the per-request GET routes stay DDL-free.
const ADD_SALES_COLUMNS = `
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE INDEX IF NOT EXISTS idx_licenses_payment_id ON licenses(payment_id);
CREATE INDEX IF NOT EXISTS idx_licenses_order_id ON licenses(order_id);
CREATE INDEX IF NOT EXISTS idx_licenses_payment_created ON licenses(payment_id, created_at DESC);
`

const UPDATED_AT_TRIGGER = `
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_licenses_updated_at ON licenses;
CREATE TRIGGER trg_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
`

const CREATE_SSE_TABLE = `
CREATE TABLE IF NOT EXISTS sse_events (
  id         BIGSERIAL PRIMARY KEY,
  channel    TEXT NOT NULL,
  event      TEXT NOT NULL,
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sse_events_channel ON sse_events(channel, id);
`

const CREATE_FUNCTION = `
CREATE OR REPLACE FUNCTION cleanup_sse_events() RETURNS void AS $$
BEGIN
  DELETE FROM sse_events WHERE created_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;
`

// Auth + diagnostics tables. Owned here (one-time) so the login and
// dashboard hot paths never run DDL per request.
const CREATE_AUTH_TABLES = `
CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  ok BOOLEAN NOT NULL,
  stage TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mint_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  ok BOOLEAN NOT NULL,
  stage TEXT NOT NULL DEFAULT '',
  payment_id TEXT,
  order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mint_attempts_created ON mint_attempts(created_at DESC);
`

export async function POST(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.POSTGRES_URL || ''
  const host = url.match(/@([^/:?]+)/)?.[1] || 'unknown'
  const isVercelManaged = url.includes('vercel-storage.com') || url.includes('internal postgres')

  const pool = getPool()
  const client = await pool.connect()
  const results: string[] = []
  const errors: string[] = []

  try {
    await client.query('BEGIN')

    await client.query(CREATE_LICENSES_TABLE)
    results.push('licenses table — OK (created or already exists)')

    await client.query(ADD_UPDATED_AT_COLUMN)
    results.push('updated_at column — OK')

    await client.query(ADD_SALES_COLUMNS)
    results.push('sales columns + payment indexes — OK')

    await client.query(UPDATED_AT_TRIGGER)
    results.push('updated_at auto-trigger — OK')

    await client.query(CREATE_SSE_TABLE)
    results.push('sse_events table — OK (created or already exists)')

    await client.query(CREATE_FUNCTION)
    results.push('cleanup_sse_events function — OK')

    await client.query(CREATE_AUTH_TABLES)
    results.push('auth tables (login_attempts, admin_settings, mint_attempts) — OK')

    const countRes = await client.query('SELECT COUNT(*)::int AS n FROM licenses')
    results.push(`license count: ${countRes.rows[0].n}`)

    await client.query('COMMIT')
  } catch (err: any) {
    await client.query('ROLLBACK')
    errors.push(err.message)
  } finally {
    client.release()
  }

  return NextResponse.json({
    db_host: host,
    is_vercel_managed_storage: isVercelManaged,
    results,
    errors,
  })
}
