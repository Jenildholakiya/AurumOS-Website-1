import { NextRequest, NextResponse } from 'next/server';
import { sha256Hex } from '@/lib/auth';
import { findToken, findUserById, markTokenUsed, saveUser } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * GET /api/auth/verify-email?token=… — email-link verification.
 * Redirects to /login with a status flag (link opens in a browser).
 */
export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get('token') ?? '').trim();
  const login = (code: string) => NextResponse.redirect(new URL(`/login?verified=${code}`, request.url));

  if (!raw || raw.length < 32) return login('invalid');

  const tok = await findToken(sha256Hex(raw), 'verify_email');
  if (!tok || tok.used || Date.parse(tok.expires_at) < Date.now()) return login('invalid');

  const user = await findUserById(tok.user_id);
  if (!user) return login('invalid');

  user.email_verified = true;
  await saveUser(user);
  await markTokenUsed(tok.token_hash);
  return login('1');
}
