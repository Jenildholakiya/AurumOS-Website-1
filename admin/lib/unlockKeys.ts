/**
 * One-Time Unlock Key registry
 * ------------------------------------------------------------------
 * Replaces the old date-based generator (SHA256(lock + salt + date))
 * which rotated every 24h. Keys are now generated ONCE, registered in
 * Postgres, and permanently spent after their first successful verify.
 *
 * The client (AurumOS) validates a key by calling POST /api/unlock/verify
 * with { lock_code, key }. The endpoint looks the key up and, if it is still
 * 'issued', atomically marks it 'used' and returns success. A second call
 * with the same key is rejected (status 410) — true one-time use.
 */

import crypto from 'crypto'
import { query } from '@/lib/db'

// Keep the original salts so generated keys stay recognisable to the client.
const REGULAR_SALT = 'AurumOS@Jewel#2024$Prof'
const BASTION_SALT = 'BASTION@AurumOS#Jenil$2024!Admin'

export type UnlockKeyType = 'regular' | 'bastion'
export type UnlockKeyStatus = 'issued' | 'used'

export interface UnlockKeyRecord {
  id:          string
  lock_code:   string
  key_type:    UnlockKeyType
  unlock_key:  string
  status:      UnlockKeyStatus
  created_at:  string
  used_at:     string | null
}

// Module-level flag — CREATE TABLE IF NOT EXISTS is idempotent anyway.
let tableReady = false

async function ensureTable(): Promise<void> {
  if (tableReady) return
  await query(`
    CREATE TABLE IF NOT EXISTS unlock_keys (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      lock_code   text NOT NULL,
      key_type    text NOT NULL,
      unlock_key  text NOT NULL UNIQUE,
      status      text NOT NULL DEFAULT 'issued',
      created_at  timestamptz NOT NULL DEFAULT now(),
      used_at     timestamptz
    );
  `)
  await query(`CREATE INDEX IF NOT EXISTS idx_unlock_keys_key ON unlock_keys(unlock_key);`)
  await query(`CREATE INDEX IF NOT EXISTS idx_unlock_keys_lock ON unlock_keys(lock_code);`)
  tableReady = true
}

/** Normalise a lock code the same way the client does: upper, alnum only, max 8. */
export function normalizeLockCode(lc: string): string {
  return (lc || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)
}

function sha256hex(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex')
}

/** Generate a fresh, unique key (no date component → it never rotates). */
export async function generateUnlockKey(
  lockCode: string,
  type: UnlockKeyType
): Promise<UnlockKeyRecord> {
  await ensureTable()
  const lc = normalizeLockCode(lockCode)
  // Random per-generation nonce → every key is unique and not time-derived.
  const nonce = crypto.randomBytes(8).toString('hex')
  const salt = type === 'bastion' ? BASTION_SALT : REGULAR_SALT
  const full = sha256hex(lc + salt + nonce)
  const key = (type === 'bastion' ? full.slice(0, 16) : full.slice(0, 12)).toUpperCase()

  const { rows } = await query<UnlockKeyRecord>(
    `INSERT INTO unlock_keys (lock_code, key_type, unlock_key, status)
     VALUES ($1, $2, $3, 'issued')
     RETURNING *`,
    [lc, type, key]
  )
  return rows[0]
}

/** Look up a key by its value (uppercased, alphanumeric only). */
export async function getUnlockKeyByKey(rawKey: string): Promise<UnlockKeyRecord | null> {
  await ensureTable()
  const key = (rawKey || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  const { rows } = await query<UnlockKeyRecord>(
    `SELECT * FROM unlock_keys WHERE unlock_key = $1 LIMIT 1`,
    [key]
  )
  return rows[0] ?? null
}

/**
 * Atomically spend the key. The WHERE status='issued' guard means a second
 * caller (race or replay) gets NULL back and is rejected.
 */
export async function consumeUnlockKey(record: UnlockKeyRecord): Promise<UnlockKeyRecord | null> {
  const { rows } = await query<UnlockKeyRecord>(
    `UPDATE unlock_keys
     SET status = 'used', used_at = now()
     WHERE id = $1 AND status = 'issued'
     RETURNING *`,
    [record.id]
  )
  return rows[0] ?? null
}

/** Admin manual mark-as-used (when the client reports usage out-of-band). */
export async function markUsedById(id: string): Promise<boolean> {
  await ensureTable()
  const { rowCount } = await query(
    `UPDATE unlock_keys SET status = 'used', used_at = now()
     WHERE id = $1 AND status = 'issued'`,
    [id]
  )
  return (rowCount ?? 0) > 0
}

export async function listUnlockKeys(lockCode?: string): Promise<UnlockKeyRecord[]> {
  await ensureTable()
  if (lockCode) {
    const { rows } = await query<UnlockKeyRecord>(
      `SELECT * FROM unlock_keys WHERE lock_code = $1 ORDER BY created_at DESC`,
      [normalizeLockCode(lockCode)]
    )
    return rows
  }
  const { rows } = await query<UnlockKeyRecord>(
    `SELECT * FROM unlock_keys ORDER BY created_at DESC LIMIT 200`
  )
  return rows
}
