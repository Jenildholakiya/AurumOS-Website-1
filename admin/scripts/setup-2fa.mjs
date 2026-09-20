/**
 * Setup 2FA: generates ADMIN_TOTP_SECRET + QR code.
 * Usage: node scripts/setup-2fa.mjs
 * Then: scan QR in Google/Microsoft Authenticator, set ADMIN_TOTP_SECRET in .env.local + Vercel.
 */
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { authenticator } = require('otplib')
const QRCode = require('qrcode')

const secret = authenticator.generateSecret()
const uri = authenticator.keyuri('admin@aurumos.in', 'AurumOS-Admin', secret)

console.log('\n=== AurumOS Admin 2FA Setup ===\n')
console.log('1. Add this to .env.local + Vercel env:\n')
console.log(`   ADMIN_TOTP_SECRET="${secret}"\n`)
console.log('2. Scan this QR in Google / Microsoft Authenticator:\n')
try {
  const ascii = await QRCode.toString(uri, { type: 'terminal', small: true })
  console.log(ascii)
} catch {
  console.log(uri)
}
console.log('\n3. Or enter manually — Account: admin@aurumos.in  Key:', secret)
console.log('\n4. Redeploy, login with password, then enter 6-digit code.\n')
