/**
 * DB connection for Vercel Postgres
 * Uses POSTGRES_URL (pooled) — required for serverless functions.
 * Env var name matches Vercel Storage export: POSTGRES_URL
 */

import { Pool, QueryResultRow } from 'pg'
import * as dns from 'dns'

// Singleton pool — reused across requests in the same Lambda instance
let _pool: Pool | null = null

function parseDbHost(connStr: string): string | null {
  // postgres://user:pass@host:port/db?sslmode=require
  const m = connStr.match(/^postgres(?:ql)?:\/\/[^@]*@([^/:?]+)(?::\d+)?(?:\/|$)/i)
  return m ? m[1].toLowerCase() : null
}

// Permanent guard: a dead/typo'd DB host used to surface as a bare
// `getaddrinfo ENOTFOUND` buried inside a license-minting request. Any host on
// this set is refused at pool creation with a clear message instead of a
// cryptic connection error downstream. Add a ref here the moment it dies.
const BANNED_HOSTS = new Set([
  'db.hefpualssajxrepapidk.supabase.co',
  'postgres.hefpualssajxrepapidk',
])

function validateConnStr(connStr: string): void {
  const host = parseDbHost(connStr)
  if (!host) {
    throw new Error(
      `POSTGRES_URL is malformed — could not parse a host from: ${connStr.slice(0, 60)}…`
    )
  }
  if (BANNED_HOSTS.has(host)) {
    throw new Error(
      `POSTGRES_URL points at dead Supabase project ref "${host}" ` +
      `(DNS returns ENOTFOUND). Update .env.local with the live project's ` +
      `POSTGRES_URL from the Vercel Dashboard → Storage → your DB.`
    )
  }
}

// One-shot DNS probe. On the very first query of a process we resolve the host
// ourselves so a dead/typo'd host fails with a clear message instead of the
// pool's opaque connection error. Cached after the first call.
let _hostProbeDone = false
async function probeDbHost(): Promise<void> {
  if (_hostProbeDone) return
  _hostProbeDone = true
  const connStr = process.env.POSTGRES_URL
  if (!connStr) return
  const host = parseDbHost(connStr)
  if (!host) return
  await new Promise<void>((resolve) => {
    dns.lookup(host, (err) => {
      if (err) {
        console.error(
          `[DB] ⚠️  Host "${host}" does not resolve (${err.code}). ` +
          `Check POSTGRES_URL in .env.local — the live project ref is ` +
          `currently "db.fffmlehsgzatzgqgvmpc.supabase.co".`
        )
      }
      resolve()
    })
  })
}

export function getPool(): Pool {
  if (!_pool) {
    const connStr = process.env.POSTGRES_URL

    if (!connStr) {
      throw new Error(
        'POSTGRES_URL environment variable is not set. ' +
        'Add it from: Vercel Dashboard → Storage → your DB → .env.local'
      )
    }

    validateConnStr(connStr)

    // Strip sslmode from connection string — we handle SSL via the pool config
    // to avoid "self-signed certificate" errors on Vercel connecting to Supabase.
    let cleanConnStr = connStr
      .replace(/([?&])sslmode=[^&]*/g, '$1')
      .replace(/\?&/, '?')
      .replace(/&&/g, '&')
      .replace(/[?&]$/, '')

    _pool = new Pool({
      connectionString: cleanConnStr,
      ssl: { rejectUnauthorized: false },
      max: 5,
      // Keep one warm connection + TCP keepalive: the admin dashboard is
      // low-traffic, and re-establishing TLS to remote Postgres on every
      // tab switch was adding hundreds of ms of cold-connect penalty.
      min: 1,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })

    _pool.on('error', (err) => {
      console.error('[DB] Pool error:', err)
      _pool = null  // reset so next request gets a fresh pool
    })
  }

  return _pool
}

/**
 * Run a parameterised query.
 * Usage:
 * const { rows } = await query('SELECT * FROM licenses WHERE id = $1', [id])
 */
export async function query<T extends QueryResultRow>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool()
  await probeDbHost()   // fail fast with a clear message on the very first query
  const start = Date.now()
  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DB] query (${duration}ms):`, text.substring(0, 80))
    }
    return { rows: result.rows, rowCount: result.rowCount ?? 0 }
  } catch (err) {
    console.error('[DB] Query error:', err, '\nSQL:', text)
    throw err
  }
}