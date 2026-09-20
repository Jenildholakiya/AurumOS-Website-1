/**
 * One-time import: website-local licenses (website data/licenses.json) that
 * were minted BEFORE the website pointed at the admin authority.
 * Matches by payment_id so re-runs are safe (already-imported rows skip).
 * Usage: node scripts/import-local-licenses.mjs [path-to-licenses.json]
 */
import fs from 'node:fs'
import pg from 'pg'

const src = process.argv[2] || 'C:\\Users\\abc\\Desktop\\aurumos\\data\\licenses.json'
const locals = JSON.parse(fs.readFileSync(src, 'utf8'))
console.log(`Found ${locals.length} local license(s) in ${src}`)

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

let imported = 0, skipped = 0
for (const l of locals) {
  if (!l.payment_id) { console.log(`SKIP ${l.key}: no payment_id (manual-style local key)`); skipped++; continue }
  const existing = await pool.query(`SELECT key FROM licenses WHERE payment_id = $1 LIMIT 1`, [l.payment_id])
  if (existing.rows[0]) { console.log(`SKIP ${l.key}: payment ${l.payment_id} already in admin as ${existing.rows[0].key}`); skipped++; continue }
  const keyTaken = await pool.query(`SELECT 1 FROM licenses WHERE key = $1 LIMIT 1`, [l.key])
  if (keyTaken.rows[0]) { console.log(`SKIP ${l.key}: key already exists in admin`); skipped++; continue }
  await pool.query(
    `INSERT INTO licenses
       (key, business_name, owner_name, city, phone, email, notes, amount_paid,
        software_type, status, plan_type, duration_days, is_used,
        payment_id, order_id, idempotency_key,
        subscription_started_at, subscription_expires_at, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false,$13,$14,$15,$16,$17,$18)`,
    [l.key, l.business_name, l.owner_name, l.city || null, l.phone, l.email || null,
     l.notes || null, l.amount_paid, l.software_type, l.status || 'active',
     l.plan_type, l.duration_days || 365, l.payment_id, l.order_id || null,
     l.idempotency_key || null, l.subscription_started_at || null,
     l.subscription_expires_at || null, l.created_at || new Date().toISOString()]
  )
  console.log(`IMPORTED ${l.key} (${l.business_name}, payment ${l.payment_id})`)
  imported++
}
// Cleanup: remove TEST probe rows so dashboard shows real sales only.
const del = await pool.query(`DELETE FROM licenses WHERE business_name = 'TEST Mint Probe'`)
console.log(`Cleanup: removed ${del.rowCount} TEST probe row(s).`)
console.log(`DONE: imported=${imported} skipped=${skipped}`)
await pool.end()
