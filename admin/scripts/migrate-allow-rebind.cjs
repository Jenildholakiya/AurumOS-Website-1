// Adds the allow_rebind column to licenses (idempotent).
// Run:  node --env-file=.env.local scripts/migrate-allow-rebind.cjs
const { Pool } = require('pg')
const connStr = process.env.POSTGRES_URL

if (!connStr) {
  console.error('POSTGRES_URL is not set. Add it from Vercel → Storage → .env.local')
  process.exit(1)
}

const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } })

;(async () => {
  await pool.query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS allow_rebind boolean NOT NULL DEFAULT false`)
  const { rows } = await pool.query(`SELECT column_name, column_default FROM information_schema.columns WHERE table_name='licenses' AND column_name='allow_rebind'`)
  console.log('Column ready:', rows[0])
  await pool.end()
})().catch((e) => { console.error(e); process.exit(1) })
