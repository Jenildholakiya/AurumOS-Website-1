import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, forbidden, isSameOrigin, sessionCookieName, sha256Hex } from '@/lib/auth';
import { deleteSession } from '@/lib/store';

export const runtime = 'nodejs';

/** POST /api/auth/logout — revoke current session, clear cookie. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();
  try {
    const token = request.cookies.get(sessionCookieName(request))?.value;
    if (token) await deleteSession(sha256Hex(token));
  } catch (err) {
    console.error('logout failed:', err);
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', clearSessionCookie(request));
  return res;
}
