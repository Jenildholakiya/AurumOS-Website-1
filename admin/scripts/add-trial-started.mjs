/**
 * scripts/add-trial-started.mjs — adds the trial clock column.
 *
 * Trial countdowns need a recorded start moment so the real-time timer is
 * accurate (license creation time alone is wrong for trials assigned later).
 *
 * Idempotent: ADD COLUMN IF NOT EXISTS. Safe to re-run.
 *
 * Run:  node --env-file=.env.local scripts/add-trial-started.mjs
 */

import pg from 'pg'

const { Pool } = pg
const connStr = process.env.POSTGRES_URL

if (!connStr) {
  console.error('❌ POSTGRES_URL is not set. Run with: node --env-file=.env.local scripts/add-trial-started.mjs')
  process.exit(1)
}

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  const client = await pool.connect()
  try {
    // Backfill existing Lite trials with a start moment so their timers are
    // correct from the first load (use license creation as the baseline).
    await client.query(`
      ALTER TABLE licenses
        ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
    `)
    console.log('✅ Ensured column licenses.trial_started_at exists.')

    const backfill = await client.query(`
      UPDATE licenses
         SET trial_started_at = created_at
       WHERE plan_type = 'lite'
         AND duration_days > 0
         AND duration_days < 365
         AND trial_started_at IS NULL;
    `)
    console.log(`🔄 Backfilled ${backfill.rowCount ?? 0} existing trial row(s).`)
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
