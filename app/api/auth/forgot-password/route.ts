import { NextRequest, NextResponse } from 'next/server';
import { authIp, forbidden, isSameOrigin, newRawToken, rateLimit, sha256Hex } from '@/lib/auth';
import { findUserByEmail, saveToken } from '@/lib/store';
import { isEmailConfigured, sendEmail } from '@/lib/email';

export const runtime = 'nodejs';

/**
 * POST /api/auth/forgot-password — request a reset link.
 * Always returns ok (no account enumeration). Strict rate limit.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();
  const wait = rateLimit(`forgot:${authIp(request)}`, 5, 60 * 60 * 1000, 60 * 60 * 1000);
  if (wait > 0) {
    // Still return ok to avoid leaking rate state; client shows generic text.
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim().toLowerCase();
    if (!email) return NextResponse.json({ ok: true });

    const user = await findUserByEmail(email);
    if (user && isEmailConfigured()) {
      const raw = newRawToken();
      await saveToken({
        token_hash: sha256Hex(raw),
        user_id: user.id,
        purpose: 'reset_password',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        used: false,
        created_at: new Date().toISOString(),
      });
      const link = `${request.nextUrl.origin}/reset-password?token=${raw}`;
      try {
        await sendEmail({
          to: email,
          subject: 'Reset your AurumOS password',
          text: `Hi ${user.name},\n\nReset your password here (expires in 1 hour):\n\n${link}\n\nDidn't ask for this? Ignore the email — your password stays as is.\n`,
          html: `<p>Hi ${user.name},</p><p><a href="${link}">Reset your password</a> (expires in 1 hour).</p><p>Didn't ask for this? Ignore this email.</p>`,
        });
      } catch (err) {
        console.error('forgot-password: email failed:', err);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('forgot-password failed:', err);
    return NextResponse.json({ ok: true });
  }
}
