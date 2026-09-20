import { query, getPool } from '@/lib/db'
import { normalizePlan, featuresWithSeats, basePcsFor } from '@/lib/plans'
import { isTrial, trialEndTime, isTrialExpired } from '@/lib/trial'
import { getSubscriptionInfo, type SubscriptionStatus, type SubscriptionInfo } from '@/lib/subscription'
export { isTrial, trialEndTime, isTrialExpired }
export { getSubscriptionInfo, type SubscriptionStatus, type SubscriptionInfo }

export type SoftwareType = 'wholesale' | 'retail'

export interface CreateLicenseInput {
  business_name: string
  owner_name:    string
  city?:         string
  phone?:        string | null
  notes?:        string | null
  amount_paid?:  number
  software_type: SoftwareType
  key:           string
  plan_type:     string
  duration_days: number
  is_used:       boolean
  identity_proof_url?:  string | null
  address_proof_url?:   string | null
  identity_proof_type?: string | null
  address_proof_type?:  string | null
}

export interface License {
  id:                number
  key:               string  // Matched to 'key'
  business_name:     string
  owner_name:        string
  city:              string | null
  phone:             string | null
  notes:             string | null
  amount_paid:       number | null
  software_type:     SoftwareType
  status:            string
  created_at:        string
  plan_type:         string  // stored tier: 'lite' | 'pro' | 'enterprise' (legacy values normalized via normalizePlan)
  duration_days:     number
  is_used:           boolean
  machine_id:        string | null
  activated_machine: string | null
  activated_at:      string | null
  trial_started_at:  string | null
  max_allowed_connections?: number;
  allow_rebind?: boolean;
  subscription_expires_at: string | null  // ISO timestamp of yearly renewal deadline
  subscription_started_at: string | null  // ISO timestamp when subscription began
  updated_at:           string | null  // ISO timestamp — auto-updated by DB trigger on every write
  identity_proof_url:  string | null
  address_proof_url:   string | null
  identity_proof_type: string | null
  address_proof_type:  string | null
  // Online-sale columns (auto-minted website purchases via /api/public/mint-license)
  payment_id?:      string | null
  order_id?:        string | null
  email?:           string | null
  idempotency_key?: string | null
}

function randomSegment(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

function generateKey(type: SoftwareType): string {
  const prefix = type === 'retail' ? 'AR' : 'AU'
  return `${prefix}-${randomSegment()}-${randomSegment()}-${randomSegment()}-${randomSegment()}`
}

export async function getAllLicenses(): Promise<License[]> {
  await ensureTables()
  const { rows } = await query<License>(
    `SELECT * FROM licenses ORDER BY created_at DESC`
  )
  return rows
}

export async function getLicenseByKey(key: string): Promise<License | null> {
  await ensureTables()
  const { rows } = await query<License>(
    `SELECT * FROM licenses WHERE key = $1 LIMIT 1`,
    [key]
  )
  return rows[0] ?? null
}

export async function createLicense(input: CreateLicenseInput): Promise<License> {
  const {
    business_name,
    owner_name,
    city          = '',
    phone         = null,
    notes         = null,
    amount_paid,
    software_type,
    key,
    plan_type,
    duration_days,
    is_used,
    identity_proof_url  = null,
    address_proof_url   = null,
    identity_proof_type = null,
    address_proof_type  = null,
  } = input

  await ensureTables()
  const { rows } = await query<License>(
    `INSERT INTO licenses
       (key, business_name, owner_name, city, phone, notes,
        amount_paid, software_type, status, plan_type, duration_days, is_used,
        identity_proof_url, address_proof_url, identity_proof_type, address_proof_type,
        subscription_expires_at, subscription_started_at, created_at)
     VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11,
        $12, $13, $14, $15,
        NOW() + ($16 || ' days')::interval, NOW(), NOW())
     RETURNING *`,
    [
      key,
      business_name,
      owner_name,
      city || null,
      phone,
      notes,
      amount_paid ?? null,
      software_type,
      plan_type,
      duration_days,
      is_used,
      identity_proof_url,
      address_proof_url,
      identity_proof_type,
      address_proof_type,
      String(duration_days)
    ]
  )

  return rows[0]
}

// Safely populates both fallback identifier columns in your database using native Postgres timestamps.
// If the license is a trial, the trial countdown clock (trial_started_at) is stamped on FIRST
// activation only (COALESCE keeps any existing start), so the customer gets the full trial window
// starting from when they actually turn the software on — not from when the key was minted.
export async function updateLicenseActivation(
  id: number,
  data: { is_used: boolean; activated_machine: string }
): Promise<License | null> {
  await ensureTables()
  const current = await query<License>(`SELECT * FROM licenses WHERE id = $1 LIMIT 1`, [id])
  const lic = current.rows[0]
  const startTrialClock = lic ? isTrial(lic) : false

  const { rows } = await query<License>(
    `UPDATE licenses
     SET is_used = $1,
         activated_machine = $2,
         machine_id = $2,
         activated_at = NOW(),
         trial_started_at = CASE
           WHEN $4 = true THEN COALESCE(trial_started_at, NOW())
           ELSE trial_started_at
         END
     WHERE id = $3
     RETURNING *`,
    [data.is_used, data.activated_machine, id, startTrialClock]
  )
  return rows[0] ?? null
}

export function validateKeyPrefix(key: string, expected: SoftwareType): boolean {
  const prefix = expected === 'retail' ? 'AR-' : 'AU-'
  return key.startsWith(prefix)
}

export interface DashboardStats {
  total_licenses: number
  active:         number
  revoked:        number
  pending:        number
  total_revenue:  number
  this_month:     number
  // Website (Razorpay) sales — licenses with payment_id set.
  online_orders:  number
  online_revenue: number
  plan_mix:       { lite: number; pro: number; enterprise: number }
  recent:         License[]
  // Active (un-elapsed) Lite trials — drives the dashboard's live countdown UI.
  trials:         License[]
  active_trials:  number
}

let _tablesEnsured = false

async function ensureTables(): Promise<void> {
  if (_tablesEnsured) return
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query(`
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
    `)
    await client.query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`)
    await client.query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS identity_proof_url  TEXT`)
    await client.query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS address_proof_url   TEXT`)
    await client.query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS identity_proof_type TEXT`)
    await client.query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS address_proof_type  TEXT`)
    // Online-sale columns for website auto-mint (idempotent).
    await client.query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS payment_id TEXT`)
    await client.query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS order_id TEXT`)
    await client.query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS email TEXT`)
    await client.query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS idempotency_key TEXT`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_licenses_payment_id ON licenses(payment_id)`)
    // PC-connection (multi-PC seat) support: the TOTAL lives on
    // licenses.max_allowed_connections; pc_addons keeps purchase history.
    await client.query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS max_allowed_connections INT DEFAULT 1`)
    await client.query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS allow_rebind BOOLEAN DEFAULT false`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS pc_addons (
        id BIGSERIAL PRIMARY KEY,
        license_id BIGINT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
        license_key TEXT,
        added_pcs INT NOT NULL DEFAULT 0,
        total_after INT NOT NULL DEFAULT 1,
        amount_paid NUMERIC,
        notes TEXT,
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pc_addons_license ON pc_addons(license_id)`)
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
      DROP TRIGGER IF EXISTS trg_licenses_updated_at ON licenses;
      CREATE TRIGGER trg_licenses_updated_at BEFORE UPDATE ON licenses
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `)
    _tablesEnsured = true
  } catch (err) {
    console.error('[DB] ensureTables failed:', err)
  } finally {
    client.release()
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    await ensureTables()
    // 1. Fetch counts and revenue sums from the database
    const metricsQuery = await query<{
      total_licenses: string
      active:         string
      revoked:        string
      pending:        string
      total_revenue:  string
      this_month:     string
      online_orders:  string
      online_revenue: string
    }>(
      `SELECT 
         COUNT(*)::int as total_licenses,
         COUNT(CASE WHEN status = 'active' THEN 1 END)::int as active,
         COUNT(CASE WHEN status = 'revoked' THEN 1 END)::int as revoked,
         COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending,
         COALESCE(SUM(amount_paid), 0)::float as total_revenue,
         COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN amount_paid END), 0)::float as this_month,
         COUNT(CASE WHEN payment_id IS NOT NULL THEN 1 END)::int as online_orders,
         COALESCE(SUM(CASE WHEN payment_id IS NOT NULL THEN amount_paid END), 0)::float as online_revenue
       FROM licenses`
    )

    // 2. Fetch the 5 most recent licenses for the dashboard table view
    const recentQuery = await query<License>(
      `SELECT * FROM licenses ORDER BY created_at DESC LIMIT 5`
    )

    // 3. Plan distribution — normalize legacy values (premium/free_trial/null) in JS
    const planRows = await query<{ plan_type: string | null; n: string }>(
      `SELECT plan_type, COUNT(*)::int AS n FROM licenses GROUP BY plan_type`
    )
    const plan_mix = { lite: 0, pro: 0, enterprise: 0 }
    for (const row of planRows.rows) {
      plan_mix[normalizePlan(row.plan_type)] += Number(row.n ?? 0)
    }

    // 4. Active trials (Lite tier, finite + un-elapsed horizon) for the live
    //    countdown UI on the dashboard. Reuses the exact same isTrial /
    //    trialEndTime helpers as the Licenses table so the two never diverge.
    const activeRows = await query<License>(
      `SELECT id, key, business_name, owner_name, city, plan_type, duration_days,
              status, trial_started_at, created_at
         FROM licenses WHERE status = 'active'`
    )
    const nowMs = Date.now()
    const trialsAll = activeRows.rows
      .filter(l => isTrial(l) && !isTrialExpired(l, nowMs))
      .sort((a, b) => (trialEndTime(a) ?? Infinity) - (trialEndTime(b) ?? Infinity))
    const trials = trialsAll.slice(0, 12)

    const metrics = metricsQuery.rows[0]

    return {
      total_licenses: Number(metrics?.total_licenses ?? 0),
      active:         Number(metrics?.active ?? 0),
      revoked:        Number(metrics?.revoked ?? 0),
      pending:        Number(metrics?.pending ?? 0),
      total_revenue:  Number(metrics?.total_revenue ?? 0),
      this_month:     Number(metrics?.this_month ?? 0),
      online_orders:  Number(metrics?.online_orders ?? 0),
      online_revenue: Number(metrics?.online_revenue ?? 0),
      plan_mix,
      recent:         recentQuery.rows ?? [],
      trials,
      active_trials:  trialsAll.length
    }
  } catch (err: any) {
    console.error('[DB] getDashboardStats failed:', err?.message || err)
    const dbHost = (process.env.POSTGRES_URL || '').match(/@([^/:?]+)/)?.[1] || 'unknown'
    console.error(`[DB] Connected to host: ${dbHost}`)
    throw err
  }
}

// ── NEW INTEGRATED FUNCTION: Validates Key & Returns Timer Data ──
export async function checkLicense(key: string, machineId: string, ip: string) {
  await ensureTables()
  const { rows } = await query<License>(
    `SELECT * FROM licenses WHERE key = $1 LIMIT 1`,
    [key]
  );

  if (!rows || rows.length === 0) {
    return { valid: false, status: 'not_found', message: 'License key not found on server.', updated_at: null };
  }

  const license = rows[0];

  if (license.status !== 'active') {
    return {
      valid: false,
      status: license.status || 'revoked',
      message: `License is ${license.status || 'revoked'}. Contact AurumOS support.`,
      updated_at: license.updated_at ?? null,
    };
  }

  const currentMachineId = license.machine_id || license.activated_machine;
  const trial = isTrial(license);

  if (!currentMachineId) {
    // First-time activation: bind this machine ID and, for trials, start the
    // countdown clock. Binding is BEST-EFFORT — a write failure must NEVER
    // reject an otherwise-valid license (that was the old "license rejected" bug).
    try {
      await query(
        `UPDATE licenses
           SET machine_id = $1,
               activated_machine = $1,
               activated_at = COALESCE(activated_at, NOW()),
               trial_started_at = COALESCE(trial_started_at, ${trial ? 'NOW()' : 'NULL'})
         WHERE id = $2`,
        [machineId, license.id]
      );
      // Reflect the freshly-stamped start locally so expiry/response use it.
      if (trial && !license.trial_started_at) {
        license.trial_started_at = new Date().toISOString();
      }
    } catch (e) {
      console.error('[DB] first-activation bind failed (non-fatal):', e);
    }
  } else if (currentMachineId !== machineId) {
    // Key was previously bound to another machine (reinstall, hardware change,
    // or the user moving the key to a new PC). Re-bind to the requesting
    // machine so the license keeps working instead of showing "rejected".
    try {
      await query(
        `UPDATE licenses
           SET machine_id = $1,
               activated_machine = $1,
               activated_at = COALESCE(activated_at, NOW())
         WHERE id = $2`,
        [machineId, license.id]
      );
      console.log(`[LICENSE] re-bound key ${key} from ${currentMachineId} -> ${machineId}`);
    } catch (e) {
      console.error('[DB] re-bind failed (non-fatal):', e);
    }
  }

  // Subscription enforcement — checked BEFORE trial so a renewed subscription
  // overrides an expired trial window.
  const sub = getSubscriptionInfo(license)
  if (sub.status === 'expired') {
    return {
      valid: false,
      status: 'subscription_expired',
      message: 'Subscription has expired. Please renew to continue using the software.',
      subscription: sub,
      updated_at: license.updated_at ?? null,
    };
  }

  // Real-time trial enforcement: the moment the horizon elapses the terminal
  // is locked, even if the admin hasn't clicked "Terminate" yet.
  if (isTrialExpired(license, Date.now())) {
    return { valid: false, status: 'trial_expired', message: 'Trial period has expired.', updated_at: license.updated_at ?? null };
  }

  const plan = normalizePlan(license.plan_type);
  const effectivePlan = sub.status === 'grace' ? 'lite' : plan
  const end = trialEndTime(license);
  // PC connections for the jeweller (brain server): total = base + purchased extra.
  const pcBase = basePcsFor(plan);
  const pcTotal = Number(license.max_allowed_connections ?? pcBase) > 0
    ? Math.floor(Number(license.max_allowed_connections ?? pcBase))
    : pcBase;
  const pcExtra = Math.max(0, pcTotal - pcBase);
  return {
    valid: true,
    status: sub.status === 'grace' ? 'grace' : 'active',
    message: sub.status === 'grace'
      ? 'Subscription in grace period — features limited to Lite tier.'
      : 'License activated successfully.',
    business: license.business_name,
    owner: license.owner_name,
    plan_type: license.plan_type,
    plan,                              // normalized tier: lite | pro | enterprise
    effective_plan: effectivePlan,     // 'lite' during grace period
    features: featuresWithSeats(effectivePlan, pcTotal), // resolved ids + terminals=N seat token (degraded during grace)
    duration_days: license.duration_days,
    created_at: license.created_at,
    is_trial: trial,
    trial_started_at: license.trial_started_at ?? null,
    trial_end_ms: end,
    subscription: sub,
    updated_at: license.updated_at ?? null,
    // ── PC connections (consumed by the jeweller's brain server) ──
    max_allowed_connections: pcTotal,
    pc_total: pcTotal,
    pc_base: pcBase,
    pc_extra: pcExtra,
  };
}