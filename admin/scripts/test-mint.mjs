/**
 * End-to-end proof for Buy -> Pay -> Auto-key.
 * Usage: node scripts/test-mint.mjs [baseUrl]
 *   default baseUrl: http://admin.localhost:3000
 *
 * Sends a fake website purchase to POST /api/public/mint-license, asserts a
 * key comes back, then re-sends to prove idempotency (duplicate:true, SAME key).
 * Cleans up nothing — delete the TEST row afterwards (see output).
 */
import fs from 'node:fs'

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const env = Object.fromEntries(
  fs.readFileSync('E:\\aurumos-admin\\.env.local', 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]
    })
)
const secret = env.LICENSE_API_SECRET
if (!secret) {
  console.error('FAIL: LICENSE_API_SECRET missing in .env.local')
  process.exit(1)
}

const stamp = Date.now()
const body = {
  business_name: 'TEST Mint Probe',
  owner_name: 'QA Bot',
  city: 'Rajkot',
  phone: '9999999999',
  email: 'qa@example.com',
  software_type: 'wholesale',
  plan_type: 'pro',
  duration_days: 365,
  amount_paid: 35000,
  payment_id: `pay_test_${stamp}`,
  order_id: `order_test_${stamp}`,
  idempotency_key: `idem_test_${stamp}`,
}

async function mint() {
  const res = await fetch(`${base}/api/public/mint-license`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

const first = await mint()
console.log('1st mint:', first.status, JSON.stringify(first.data))
if (first.status !== 200 || !first.data?.ok || !/^A[UR]-/.test(first.data?.key || '')) {
  console.error('FAIL: first mint did not return a key')
  process.exit(1)
}

const second = await mint()
console.log('2nd mint:', second.status, JSON.stringify(second.data))
if (!second.data?.duplicate || second.data?.key !== first.data.key) {
  console.error('FAIL: retry was not idempotent (expected duplicate:true + same key)')
  process.exit(1)
}

console.log(`PASS: key ${first.data.key} minted, retry returned same key.`)
console.log(`Cleanup: DELETE FROM licenses WHERE payment_id = '${body.payment_id}';`);
