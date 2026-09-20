import { authenticator } from 'otplib'
import { SignJWT, jwtVerify } from 'jose'

authenticator.options = { window: 1 }

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production-32chars'
)

export function getTotpSecret(): string {
  return (process.env.ADMIN_TOTP_SECRET || '').replace(/\s+/g, '').toUpperCase()
}

export function isTwoFactorConfigured(): boolean {
  return getTotpSecret().length >= 16
}

export function verifyTotpCode(code: string): boolean {
  const secret = getTotpSecret()
  if (!secret) return false
  const clean = (code || '').replace(/\D/g, '').slice(0, 6)
  if (clean.length !== 6) return false
  try {
    return authenticator.verify({ token: clean, secret })
  } catch {
    return false
  }
}

export function buildTotpUri(account = 'admin@aurumos.in', issuer = 'AurumOS-Admin'): string {
  const secret = getTotpSecret()
  return authenticator.keyuri(account, issuer, secret)
}

/** QR data-URL for the in-login first-time setup screen. Server-side only. */
export async function getSetupQrDataUrl(): Promise<string> {
  const QRCode = (await import('qrcode')).default
  return QRCode.toDataURL(buildTotpUri(), { width: 220, margin: 1 })
}

// ── First-time-setup flag (DB-backed so it shows only once) ──

export async function isTotpVerified(): Promise<boolean> {
  // No DDL on the login hot path — admin_settings is ensured by setup-db.
  try {
    const { query } = await import('@/lib/db')
    const { rows } = await query<{ value: string }>(
      `SELECT value FROM admin_settings WHERE key = 'totp_verified' LIMIT 1`
    )
    return rows[0]?.value === '1'
  } catch {
    return false
  }
}

export async function markTotpVerified(): Promise<void> {
  const { query } = await import('@/lib/db')
  await query(
    `INSERT INTO admin_settings (key, value, updated_at)
     VALUES ('totp_verified', '1', NOW())
     ON CONFLICT (key) DO UPDATE SET value = '1', updated_at = NOW()`
  )
}

/** Short-lived pre-2FA token issued after password passes. 5 min expiry. */
export async function createPreAuthToken(): Promise<string> {
  return new SignJWT({ role: 'pre-2fa' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(SECRET)
}

export async function verifyPreAuthToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload.role === 'pre-2fa'
  } catch {
    return false
  }
}
