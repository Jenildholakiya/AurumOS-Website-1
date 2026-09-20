import { NextRequest, NextResponse } from 'next/server';
import { authIp, forbidden, hashPassword, isSameOrigin, rateLimit, sha256Hex } from '@/lib/auth';
import { deleteUserSessions, findToken, findUserById, markTokenUsed, saveUser } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * POST /api/auth/reset-password — consume a reset token, set new password.
 * Revokes ALL sessions so stolen-token use is cut off immediately.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();
  const wait = rateLimit(`reset:${authIp(request)}`, 10, 10 * 60 * 1000, 10 * 60 * 1000);
  if (wait > 0) {
    return NextResponse.json({ ok: false, error: `Too many attempts. Retry in ${wait}s.` }, { status: 429 });
  }

  try {
    const body = await request.json();
    const raw = String(body?.token ?? '').trim();
    const password = String(body?.password ?? '');

    if (!raw || password.length < 8 || password.length > 128) {
      return NextResponse.json({ ok: false, error: 'Invalid token or password (8–128 characters).' }, { status: 400 });
    }

    const tok = await findToken(sha256Hex(raw), 'reset_password');
    if (!tok || tok.used || Date.parse(tok.expires_at) < Date.now()) {
      return NextResponse.json({ ok: false, error: 'This reset link is invalid or expired.' }, { status: 400 });
    }

    const user = await findUserById(tok.user_id);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'This reset link is invalid or expired.' }, { status: 400 });
    }

    const { hash, salt } = await hashPassword(password);
    user.password_hash = hash;
    user.password_salt = salt;
    user.failed_logins = 0;
    user.locked_until = undefined;
    await saveUser(user);
    await markTokenUsed(tok.token_hash);
    await deleteUserSessions(user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('reset-password failed:', err);
    return NextResponse.json({ ok: false, error: 'Could not reset the password.' }, { status: 500 });
  }
}
