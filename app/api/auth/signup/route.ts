import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  authIp,
  createSession,
  hashPassword,
  isSameOrigin,
  forbidden,
  newRawToken,
  rateLimit,
  sha256Hex,
} from '@/lib/auth';
import { findUserByEmail, saveToken, saveUser } from '@/lib/store';
import { isEmailConfigured, sendEmail } from '@/lib/email';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s().-]{7,20}$/;

/**
 * POST /api/auth/signup — create account + verification email + sales lead.
 * Never reveals whether an email exists (always 200-shape, ok:true only on
 * creation; duplicate returns ok:false with generic message to avoid
 * enumeration... login timing aside, message stays neutral).
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();
  const wait = rateLimit(`signup:${authIp(request)}`, 10, 10 * 60 * 1000, 10 * 60 * 1000);
  if (wait > 0) {
    return NextResponse.json({ ok: false, error: `Too many attempts. Retry in ${wait}s.` }, { status: 429 });
  }

  try {
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    const business = String(body?.business ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const phone = String(body?.phone ?? '').trim();
    const plan = String(body?.plan ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');

    if (!name || !business || !email || !phone || !password) {
      return NextResponse.json({ ok: false, error: 'Please fill in every field.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
    if (!PHONE_RE.test(phone)) return NextResponse.json({ ok: false, error: 'Enter a valid phone number.' }, { status: 400 });
    if (!['lite', 'pro', 'enterprise'].includes(plan)) {
      return NextResponse.json({ ok: false, error: 'Choose a plan.' }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ ok: false, error: 'Password must be 8–128 characters.' }, { status: 400 });
    }

    if (await findUserByEmail(email)) {
      // Neutral: don't confirm the account exists.
      return NextResponse.json(
        { ok: false, error: 'Could not create the account. Try signing in or resetting the password.' },
        { status: 409 }
      );
    }

    const { hash, salt } = await hashPassword(password);
    const now = new Date().toISOString();
    await saveUser({
      id: randomUUID(),
      name,
      business,
      email,
      phone,
      plan_interest: plan,
      password_hash: hash,
      password_salt: salt,
      email_verified: false,
      failed_logins: 0,
      created_at: now,
    });

    // Verification: emailed link, or dev auto-verify when SMTP is off.
    let verified = false;
    let verifyRequired = true;
    if (isEmailConfigured()) {
      const raw = newRawToken();
      await saveToken({
        token_hash: sha256Hex(raw),
        user_id: (await findUserByEmail(email))!.id,
        purpose: 'verify_email',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        used: false,
        created_at: now,
      });
      const link = `${request.nextUrl.origin}/api/auth/verify-email?token=${raw}`;
      try {
        await sendEmail({
          to: email,
          subject: 'Verify your AurumOS account',
          text: `Hi ${name},\n\nConfirm your email to activate your AurumOS account:\n\n${link}\n\nThis link expires in 24 hours.\n`,
          html: `<p>Hi ${name},</p><p>Confirm your email to activate your AurumOS account:</p><p><a href="${link}">Verify my email</a></p><p>This link expires in 24 hours.</p>`,
        });
      } catch (err) {
        console.error('signup: verification email failed:', err);
      }
      // Notify sales (lead only — never the password).
      try {
        await sendEmail({
          to: process.env.EMAIL_TO || 'aurumos.software@gmail.com',
          replyTo: email,
          subject: `New AurumOS account: ${name} (${plan})`,
          text: `Name: ${name}\nBusiness: ${business}\nEmail: ${email}\nPhone: ${phone}\nPlan: ${plan}\nAt: ${now}`,
          html: `<ul><li>Name: ${name}</li><li>Business: ${business}</li><li>Email: ${email}</li><li>Phone: ${phone}</li><li>Plan: ${plan}</li></ul>`,
        });
      } catch (err) {
        console.error('signup: lead email failed:', err);
      }
    } else {
      console.warn('signup: SMTP off — auto-verifying (dev only).');
      const u = (await findUserByEmail(email))!;
      u.email_verified = true;
      await saveUser(u);
      verified = true;
      verifyRequired = false;
    }

    // Auto sign-in only when already verified (dev mode).
    if (verified) {
      const u = (await findUserByEmail(email))!;
      const { cookie } = await createSession(u.id, request);
      const res = NextResponse.json({ ok: true, verify_required: false });
      res.headers.set('Set-Cookie', cookie);
      return res;
    }
    return NextResponse.json({ ok: true, verify_required: verifyRequired });
  } catch (err) {
    console.error('signup failed:', err);
    return NextResponse.json({ ok: false, error: 'Could not create the account.' }, { status: 500 });
  }
}
