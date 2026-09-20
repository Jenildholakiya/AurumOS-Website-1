// Diagnostic: shows the exact rejection cause for every license, as the exe sees it.
// Run:  node --env-file=.env.local scripts/diagnose-license-rejects.cjs
const { Pool } = require('pg')
const connStr = process.env.POSTGRES_URL

if (!connStr) {
  console.error('POSTGRES_URL is not set. Add it from Vercel → Storage → .env.local')
  process.exit(1)
}

const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } })

;(async () => {
  const { rows } = await pool.query(
    `SELECT id, key, status, plan_type, machine_id, activated_machine, activated_at,
            trial_started_at, duration_days, is_used
       FROM licenses
      ORDER BY id`
  )

  const now = Date.now()
  let trialEnd = (l) => null
  // duration_days + trial_started_at gives the trial horizon
  try {
    for (const l of rows) {
      if (l.trial_started_at && l.duration_days) {
        trialEnd = (l) =>
          l.trial_started_at ? new Date(l.trial_started_at).getTime() + (l.duration_days || 0) * 86400000 : null
      }
    }
  } catch {}

  console.log(`Found ${rows.length} license(s):\n`)
  for (const l of rows) {
    const end = l.trial_started_at && l.duration_days
      ? new Date(l.trial_started_at).getTime() + (l.duration_days || 0) * 86400000
      : null
    const expired = end && now > end

    let cause = 'OK (valid)'
    if (l.status !== 'active') cause = `REJECT → status:'${l.status}'`
    else if (expired) cause = `REJECT → trial_expired (ended ${end ? new Date(end).toISOString() : '?'})`

    console.log(
      `#${l.id}  ${l.key}` +
      `\n   status=${l.status}  machine_id=${(l.machine_id || '').slice(0, 24) || '—'}` +
      `\n   ${cause}\n`
    )
  }
  await pool.end()
})().catch((e) => { console.error(e); process.exit(1) })
