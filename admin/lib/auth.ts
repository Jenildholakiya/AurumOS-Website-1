import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production-32chars'
)
export const SESSION_COOKIE = 'aurum_admin_session'
const COOKIE = SESSION_COOKIE
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

// ── SESSION EPOCH (kill-switch) ──────────────────────────────────
// Bump SESSION_VERSION (admin/.env.local) + restart to instantly
// invalidate EVERY issued session cookie — all browsers land on /login.
// Default '2' already rejects all pre-hardening tokens (they carry no `v`).
const SESSION_VERSION = process.env.SESSION_VERSION || '2'

// ── CREATE TOKEN ───────────────────────────────────────────────
export async function createToken(): Promise<string> {
  return new SignJWT({ role: 'admin', v: SESSION_VERSION })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

// ── VERIFY TOKEN (strict) ──────────────────────────────────────
// Rejects: bad signature, expired, wrong role, or stale epoch (no `v`
// match). Legacy pre-hardening tokens have no `v` claim → rejected.
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (payload.role !== 'admin') return false
    if (payload.v !== SESSION_VERSION) return false
    return true
  } catch {
    return false
  }
}

// ── CHECK PASSWORD ─────────────────────────────────────────────
export function checkPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

// ── GET SESSION ────────────────────────────────────────────────
export async function getSession(): Promise<boolean> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(COOKIE)?.value
    if (!token) return false
    return verifyToken(token)
  } catch {
    return false
  }
}

// ── SET SESSION COOKIE ─────────────────────────────────────────
export async function setSession(res: NextResponse): Promise<NextResponse> {
  const token = await createToken()
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7, // 7 days
    path:     '/',
  })
  return res
}

// ── CLEAR SESSION ──────────────────────────────────────────────
export async function clearSession(res: NextResponse): Promise<NextResponse> {
  res.cookies.delete(COOKIE)
  return res
}

// ── MIDDLEWARE HELPER ──────────────────────────────────────────
export async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return false
  return verifyToken(token)
}
