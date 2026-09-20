// One-off guard test for lib/db.ts — verifies a dead Supabase ref is refused.
// Run:  npx tsx scripts/__test_db_guard.ts <host-or-url>
//       npx tsx scripts/__test_db_guard.ts --live
import { getPool } from '../lib/db'

const arg = process.argv[2]
let target: string
if (!arg || arg === '--live') {
  target = process.env.POSTGRES_URL || ''
} else if (arg.startsWith('postgres')) {
  target = arg
} else {
  // bare host → wrap in a plausible conn string
  target = `postgresql://postgres:fake@${arg}:5432/postgres`
}
if (!target) {
  console.error('No target. Pass a host/url or set POSTGRES_URL.')
  process.exit(2)
}

process.env.POSTGRES_URL = target.replace(/^["']|["']$/g, '')
console.log('Testing host:', process.env.POSTGRES_URL.replace(/:[^:@]*@/, ':***@'))

try {
  getPool()
  console.log('RESULT: pool created (host accepted)')
} catch (e: any) {
  console.log('RESULT: refused ->', e.message)
}