import { NextRequest, NextResponse } from 'next/server';
import {
  authIp,
  createSession,
  forbidden,
  getSessionUser,
  isSameOrigin,
  publicUser,
  rateLimit,
  verifyPassword,
} from '@/lib/auth';
import { findUserByEmail, saveUser } from '@/lib/store';

export const runtime = 'nodejs';

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

/**
 * POST /api/auth/login — credential check + session cookie.
 * Per-IP rate limit plus per-account lockout (5 fails → 15 min).
 * Unverified emails are rejected with a resend hint (no enumeration of
 * which accounts exist beyond what signup already implies).
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();
  const wait = rateLimit(`login:${authIp(request)}`, 20, 10 * 60 * 1000, 10 * 60 * 1000);
  if (wait > 0) {
    return NextResponse.json({ ok: false, error: `Too many attempts. Retry in ${wait}s.` }, { status: 429 });
  }

  // Already signed in → return the session (idempotent).
  const existing = await getSessionUser(request);
  if (existing) {
    return NextResponse.json({ ok: true, user: publicUser(existing.user) });
  }

  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    // Dummy verify to keep timing uniform whether or not the account exists.
    if (!user) {
      await verifyPassword(password, '0'.repeat(128), '0'.repeat(64));
      return NextResponse.json({ ok: false, error: 'Incorrect email or password.' }, { status: 401 });
    }

    if (user.locked_until && Date.parse(user.locked_until) > Date.now()) {
      const secs = Math.ceil((Date.parse(user.locked_until) - Date.now()) / 1000);
      return NextResponse.json(
        { ok: false, error: `Account locked after too many attempts. Retry in ${Math.ceil(secs / 60)} min.` },
        { status: 423 }
      );
    }

    const good = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!good) {
      user.failed_logins += 1;
      if (user.failed_logins >= MAX_FAILS) {
        user.locked_until = new Date(Date.now() + LOCK_MS).toISOString();
        user.failed_logins = 0;
      }
      await saveUser(user);
      return NextResponse.json({ ok: false, error: 'Incorrect email or password.' }, { status: 401 });
    }

    user.failed_logins = 0;
    user.locked_until = undefined;
    await saveUser(user);

    if (!user.email_verified) {
      return NextResponse.json(
        { ok: false, error: 'Verify your email first — check your inbox for the link.', code: 'unverified' },
        { status: 403 }
      );
    }

    const { cookie } = await createSession(user.id, request);
    const res = NextResponse.json({ ok: true, user: publicUser(user) });
    res.headers.set('Set-Cookie', cookie);
    return res;
  } catch (err) {
    console.error('login failed:', err);
    return NextResponse.json({ ok: false, error: 'Could not sign you in.' }, { status: 500 });
  }
}
