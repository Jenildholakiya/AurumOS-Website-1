import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { setSession, clearSession } from '@/lib/auth'
import {
  isTwoFactorConfigured,
  verifyTotpCode,
  createPreAuthToken,
  verifyPreAuthToken,
  isTotpVerified,
  markTotpVerified,
  getSetupQrDataUrl,
  getTotpSecret,
} from '@/lib/twoFactor'
import {
  clientIp,
  isLocked,
  lockRemainingSec,
  recordFail,
  recordSuccess,
  attemptsLeft,
} from '@/lib/rateLimit'
import { query } from '@/lib/db'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) {
    // Compare same-length dummies so length doesn't leak via timing, then fail.
    const dummy = Buffer.alloc(Math.max(ab.length, bb.length))
    try {
      crypto.timingSafeEqual(dummy, dummy)
    } catch { /* noop */ }
    return false
  }
  try {
    return crypto.timingSafeEqual(ab, bb)
  } catch {
    return false
  }
}

async function audit(ip: string, ok: boolean, stage: string) {
  // Best-effort AND non-blocking: the login response must never wait on
  // audit I/O. All callers use `void audit(...)`. Tables live in setup-db.
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS login_attempts (
         id BIGSERIAL PRIMARY KEY,
         ip TEXT NOT NULL,
         ok BOOLEAN NOT NULL,
         stage TEXT NOT NULL DEFAULT '',
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    )
    await query(`INSERT INTO login_attempts (ip, ok, stage) VALUES ($1, $2, $3)`, [
      ip.slice(0, 64),
      ok,
      stage.slice(0, 32),
    ])
  } catch {
    // audit is best-effort — never block login on it
  }
}

function locked(ip: string) {
  return NextResponse.json(
    { error: `Too many attempts. Try again in ${lockRemainingSec(ip)}s.`, retryAfter: lockRemainingSec(ip) },
    { status: 429, headers: { 'Retry-After': String(lockRemainingSec(ip)) } }
  )
}

// GET /api/auth — public: tells the login UI whether step-2 is required.
// No secrets leaked.
export async function GET() {
  return NextResponse.json({ twoFactorEnabled: isTwoFactorConfigured() })
}

// POST /api/auth — steps:
//  1. { password } -> { requiresSetup:true, preToken, qrDataUrl, manualKey } (first time only)
//                  -> { requires2fa:true, preToken }  (every login after)
//                  -> { ok:true } (if 2FA not configured yet)
//  2. { preToken, code } -> { ok:true } + session cookie
//  3. { preToken, code, setup:true } -> verifies, marks setup done, { ok:true } + session
export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  if (isLocked(ip)) {
    void audit(ip, false, 'locked')
    return locked(ip)
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // ── STEP 2/3: verify TOTP (or first-time setup verify) ──
  if (body.preToken && body.code !== undefined) {
    const preOk = await verifyPreAuthToken(String(body.preToken))
    if (!preOk) {
      const f = recordFail(ip)
      void audit(ip, false, '2fa-bad-token')
      if (f.locked) return locked(ip)
      return NextResponse.json({ error: 'Session expired. Enter password again.' }, { status: 401 })
    }
    if (!isTwoFactorConfigured()) {
      recordSuccess(ip)
      const res = NextResponse.json({ ok: true })
      void audit(ip, true, '2fa-skipped')
      return setSession(res)
    }
    if (!verifyTotpCode(String(body.code))) {
      const f = recordFail(ip)
      void audit(ip, false, body.setup ? 'setup-bad-code' : '2fa-bad-code')
      if (f.locked) return locked(ip)
      return NextResponse.json(
        { error: 'Invalid authenticator code.', attemptsLeft: attemptsLeft(ip) },
        { status: 401 }
      )
    }
    // First-time setup verify — code correct, so never show the QR again.
    if (body.setup) {
      try {
        await markTotpVerified()
      } catch (e) {
        console.error('[AUTH] markTotpVerified failed:', e)
      }
      recordSuccess(ip)
      void audit(ip, true, 'setup-ok')
      const res = NextResponse.json({ ok: true })
      return setSession(res)
    }
    recordSuccess(ip)
    void audit(ip, true, '2fa-ok')
    const res = NextResponse.json({ ok: true })
    return setSession(res)
  }

  // ── STEP 1: verify password ──
  const { password } = body
  if (typeof password !== 'string' || !password) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
  }
  if (!timingSafeEqual(password, ADMIN_PASSWORD)) {
    const f = recordFail(ip)
    void audit(ip, false, 'password')
    if (f.locked) return locked(ip)
    // Generic message — don't reveal whether 2FA exists.
    return NextResponse.json(
      { error: 'Incorrect password. Try again.', attemptsLeft: attemptsLeft(ip) },
      { status: 401 }
    )
  }

  // Password correct — don't create the session yet if 2FA is on.
  if (isTwoFactorConfigured()) {
    const preToken = await createPreAuthToken()
    // First login ever: send QR + manual key so the admin can enroll,
    // then the setup-verify call marks it done and it never shows again.
    const verified = await isTotpVerified().catch(() => false)
    if (!verified) {
      void audit(ip, true, 'password-ok-setup')
      let qrDataUrl = ''
      try {
        qrDataUrl = await getSetupQrDataUrl()
      } catch (e) {
        console.error('[AUTH] QR generation failed:', e)
      }
      return NextResponse.json({
        requiresSetup: true,
        preToken,
        qrDataUrl,
        manualKey: getTotpSecret(),
      })
    }
    void audit(ip, true, 'password-ok')
    return NextResponse.json({ requires2fa: true, preToken })
  }

  // 2FA not set up yet (first run) — allow direct login so you can't lock yourself out.
  recordSuccess(ip)
  void audit(ip, true, 'password-ok-nofa')
  const res = NextResponse.json({ ok: true })
  return setSession(res)
}

// DELETE /api/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  return clearSession(res)
}
