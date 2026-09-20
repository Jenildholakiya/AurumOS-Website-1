// Read-only verification of the entitlement + enforcement endpoints.
// Fetches a sample (already-activated) license key via a SELECT only — no mutation.
// .env.local is loaded via --env-file into process.env.
import pg from 'pg'

const env = process.env
const BASE = 'http://localhost:3003'
const rawUrl = env.POSTGRES_URL || ''
const masked = rawUrl.replace(/:\/\/[^@]+@/, '://***@')
console.log('DB url (masked):', masked || '(empty!)')
const { Pool } = pg
const pool = new Pool({ connectionString: env.POSTGRES_URL, ssl: { rejectUnauthorized: false } })

async function main() {
  const { rows } = await pool.query(
    `SELECT key, plan_type, machine_id, is_used, status
       FROM licenses ORDER BY created_at DESC LIMIT 3`
  )
  if (!rows.length) { console.log('No licenses found to test against.'); return }
  const lic = rows[0]
  console.log('sample key:', lic.key, '| raw plan_type:', JSON.stringify(lic.plan_type), '| status:', lic.status, '| is_used:', lic.is_used)

  // /api/feature-check — gating logic (never binds, pure read)
  // billing_retail = Lite+ (always true); lan_multi_pc = Pro+; cloud_sync = Enterprise-only
  for (const feature of ['billing_retail', 'lan_multi_pc', 'cloud_sync']) {
    const res = await fetch(`${BASE}/api/feature-check`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: lic.key, machine_id: lic.machine_id || 'TEST-MACHINE', feature }),
    })
    const fc = await res.json()
    console.log(`  feature-check ${feature}: allowed=${fc.allowed} plan=${fc.plan} reason=${fc.reason}`)
  }

  // /api/check — returns plan + features[] (only call if already activated to avoid binding a real key)
  if (lic.is_used && lic.machine_id) {
    const res = await fetch(`${BASE}/api/check`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: lic.key, machine_id: lic.machine_id }),
    })
    const check = await res.json()
    console.log('\n/api/check:', res.status, '| plan:', check.plan, '| features:', (check.features || []).length)
    console.log('  features[0..6]:', (check.features || []).slice(0, 6))
  } else {
    console.log('\n/api/check: skipped (no activated license — would bind a real key). Verified via /api/feature-check above.')
  }
}

main().catch(e => { console.error('ERR', e && e.stack ? e.stack : e); process.exit(1) }).finally(() => pool.end())
