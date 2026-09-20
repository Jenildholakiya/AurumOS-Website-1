/**
 * End-to-end localhost proof for the dashboard path:
 * login (password + TOTP) -> GET /api/payments?source=online -> assert rows.
 * Usage: node scripts/verify-dashboard-localhost.mjs [baseUrl]
 */
import fs from 'node:fs'
import { authenticator } from 'otplib'

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(
  envText.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=')
    return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]
  })
)

let cookie = ''
async function call(path, opts = {}) {
  const res = await fetch(`${base}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(opts.headers || {}) },
  })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) cookie = setCookie.split(';')[0]
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

const step1 = await call('/api/auth', { method: 'POST', body: JSON.stringify({ password: env.ADMIN_PASSWORD }) })
if (step1.data?.ok) {
  console.log('Login: password-only (2FA not enforced)')
} else if (step1.data?.preToken) {
  const code = authenticator.generate(env.ADMIN_TOTP_SECRET)
  const step2 = await call('/api/auth', {
    method: 'POST',
    body: JSON.stringify(step1.data.requiresSetup
      ? { preToken: step1.data.preToken, code, setup: true }
      : { preToken: step1.data.preToken, code }),
  })
  if (!step2.data?.ok) { console.error('FAIL: 2FA verify', step2.status, step2.data); process.exit(1) }
  console.log('Login: password + TOTP ok')
} else {
  console.error('FAIL: password rejected', step1.status, step1.data); process.exit(1)
}

const online = await call('/api/payments?source=online&limit=25&offset=0')
if (online.status !== 200 || !online.data?.ok) { console.error('FAIL: /api/payments', online.status, online.data); process.exit(1) }
console.log(`PASS: dashboard API online orders=${online.data.summary.orders} revenue=${online.data.summary.revenue}`)
for (const r of online.data.rows.slice(0, 5)) {
  console.log(` - ${r.business_name} | ${r.plan_type} | Rs.${r.amount_paid} | pay=${r.payment_id} | key=${r.key}`)
}
const attempts = await call('/api/payments/attempts')
if (attempts.data?.ok) console.log(`Mint diagnostics: total=${attempts.data.summary.total} failed=${attempts.data.summary.failed}`)
