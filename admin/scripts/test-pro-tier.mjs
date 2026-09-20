// Isolated, self-cleaning runtime test of PRO-tier gating.
// Inserts a TEST license (plan=pro), exercises /api/feature-check + /api/check, then deletes it.
import { Pool } from 'pg'
const BASE = 'http://localhost:3003'
const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } })

async function main() {
  const key = 'TEST-PRO-' + Date.now().toString(36).toUpperCase()
  const ins = await pool.query(
    `INSERT INTO licenses (key, business_name, owner_name, status, plan_type, duration_days, is_used, created_at)
     VALUES ($1,'__TEST__','__TEST__','active','pro',365,false,NOW()) RETURNING id, key`,
    [key]
  )
  const id = ins.rows[0].id
  const machine = 'TEST-MACHINE-PRO'
  console.log('inserted TEST license id=', id, 'key=', key)

  let res = await fetch(`${BASE}/api/feature-check`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, machine_id: machine, feature: 'lan_multi_pc' }),
  })
  let fc = await res.json()
  console.log(`  feature-check lan_multi_pc (Pro): allowed=${fc.allowed} plan=${fc.plan} reason=${fc.reason}`)

  res = await fetch(`${BASE}/api/feature-check`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, machine_id: machine, feature: 'cloud_sync' }),
  })
  fc = await res.json()
  console.log(`  feature-check cloud_sync (Pro): allowed=${fc.allowed} plan=${fc.plan} reason=${fc.reason}`)

  res = await fetch(`${BASE}/api/check`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, machine_id: machine }),
  })
  const check = await res.json()
  const feats = check.features || []
  console.log(`  /api/check status=${res.status} raw=`, JSON.stringify(check).slice(0, 300))
  console.log(`  /api/check: plan=${check.plan} features=${feats.length} has lan_multi_pc=${feats.includes('lan_multi_pc')} has cloud_sync=${feats.includes('cloud_sync')}`)

  await pool.query('DELETE FROM licenses WHERE id = $1', [id])
  console.log('deleted TEST license id=', id, '— DB left unchanged.')
}

main().catch(e => { console.error('ERR', e && e.message); process.exit(1) }).finally(() => pool.end())
