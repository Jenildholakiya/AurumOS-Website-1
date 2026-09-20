/**
 * scripts/migrate-plans.mjs — one-time, idempotent plan_type normalization.
 *
 * Maps the old plan values to the new LITE / PRO / ENTERPRISE tiers and sets a
 * sane default so newly-inserted rows without a plan land on 'lite'.
 *
 *   legacy 'premium'                 -> 'pro'
 *   'free_trial' / null / '' / other -> 'lite'
 *   already 'lite'/'pro'/'enterprise'-> unchanged
 *
 * Run:  node --env-file=.env.local scripts/migrate-plans.mjs
 */

import pg from 'pg'

const { Pool } = pg
const connStr = process.env.POSTGRES_URL

if (!connStr) {
  console.error('❌ POSTGRES_URL is not set. Run with: node --env-file=.env.local scripts/migrate-plans.mjs')
  process.exit(1)
}

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
})

async function counts(client) {
  const { rows } = await client.query(
    `SELECT COALESCE(plan_type, '(null)') AS plan, COUNT(*)::int AS n
       FROM licenses GROUP BY plan_type ORDER BY plan_type`
  )
  return rows
}

async function main() {
  const client = await pool.connect()
  try {
    console.log('── Plan migration ──────────────────────────────')
    console.log('Before:')
    console.table(await counts(client))

    const upd = await client.query(`
      UPDATE licenses
         SET plan_type = CASE
              WHEN LOWER(TRIM(plan_type)) = 'premium'                       THEN 'pro'
              WHEN LOWER(TRIM(plan_type)) IN ('lite','pro','enterprise')    THEN LOWER(TRIM(plan_type))
              ELSE 'lite'   -- free_trial / null / '' / unknown
             END
       WHERE plan_type IS NULL
          OR LOWER(TRIM(plan_type)) NOT IN ('lite','pro','enterprise')
    `)
    console.log(`\nNormalized ${upd.rowCount} row(s).`)

    // Make 'lite' the column default for future inserts (idempotent).
    await client.query(`ALTER TABLE licenses ALTER COLUMN plan_type SET DEFAULT 'lite'`)
    console.log("Set DEFAULT 'lite' on licenses.plan_type.")

    console.log('\nAfter:')
    console.table(await counts(client))
    console.log('✅ Migration complete.')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
