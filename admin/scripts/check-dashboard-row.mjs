/**
 * Localhost proof: shows the exact rows the dashboard Online tab reads.
 * Usage: node scripts/check-dashboard-row.mjs
 * (Same predicate as GET /api/payments?source=online: payment_id IS NOT NULL)
 */
import fs from 'node:fs'
import pg from 'pg'

const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(
  envText.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=')
    return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]
  })
)
const clean = env.POSTGRES_URL
  .replace(/([?&])sslmode=[^&]*/g, '$1')
  .replace(/\?&/, '?')
  .replace(/&&/g, '&')
  .replace(/[?&]$/, '')

const pool = new pg.Pool({ connectionString: clean, ssl: { rejectUnauthorized: false } })
const { rows } = await pool.query(
  `SELECT key, business_name, plan_type, amount_paid, payment_id, order_id, created_at
     FROM licenses WHERE payment_id IS NOT NULL
     ORDER BY created_at DESC LIMIT 5`
)
console.log('ONLINE ROWS (dashboard source=online):', JSON.stringify(rows, null, 1))
const agg = await pool.query(
  `SELECT COUNT(*) AS orders, COALESCE(SUM(amount_paid),0) AS revenue FROM licenses WHERE payment_id IS NOT NULL`
)
console.log('SUMMARY:', JSON.stringify(agg.rows[0]))
await pool.end()
