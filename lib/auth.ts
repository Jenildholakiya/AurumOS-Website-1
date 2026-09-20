import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  deleteSession,
  findSession,
  findUserById,
  saveSession,
  type UserRecord,
} from './store';

function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derived) => {
      if (err) reject(err);
      else resolve(derived as Buffer);
    });
  });
}

/**
 * Authentication core: scrypt passwords, opaque revocable sessions,
 * single-use tokens, rate limiting + lockout, hardened cookies, CSRF check.
 * Dependency-free (node:crypto only).
 */

// --- Passwords (scrypt, per-user salt) -------------------------------------

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(32).toString('hex');
  const dk = await scryptAsync(password, salt);
  return { hash: dk.toString('hex'), salt };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  try {
    const dk = await scryptAsync(password, salt);
    const expected = Buffer.from(hash, 'hex');
    if (expected.length !== dk.length) return false;
    return timingSafeEqual(expected, dk);
  } catch {
    return false;
  }
}

// --- Tokens -----------------------------------------------------------------

export function newRawToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

// --- Sessions ---------------------------------------------------------------

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // extend when < 7d left

export function sessionCookieName(req?: NextRequest): string {
  const proto = req?.headers.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  // __Host- prefix in production: locked to host, Path=/, Secure.
  return proto === 'https' || process.env.NODE_ENV === 'production' ? '__Host-aurumos_session' : 'aurumos_session';
}

export function isSecureRequest(req: NextRequest): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  return req.headers.get('x-forwarded-proto') === 'https';
}

function clientMeta(req: NextRequest): { ip: string; ua: string } {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip')?.trim() || 'unknown',
    ua: (req.headers.get('user-agent') ?? '').slice(0, 200),
  };
}

export async function createSession(userId: string, req: NextRequest): Promise<{ token: string; cookie: string }> {
  const token = newRawToken();
  const now = Date.now();
  const { ip, ua } = clientMeta(req);
  await saveSession({
    token_hash: sha256Hex(token),
    user_id: userId,
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + SESSION_TTL_MS).toISOString(),
    ip,
    ua,
  });
  const name = sessionCookieName(req);
  const secure = isSecureRequest(req);
  const cookie = `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}${secure ? '; Secure' : ''}`;
  return { token, cookie };
}

export function clearSessionCookie(req: NextRequest): string {
  const name = sessionCookieName(req);
  const secure = isSecureRequest(req);
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

export interface AuthedUser {
  user: UserRecord;
  sessionExtended: boolean;
}

export async function getSessionUser(req: NextRequest): Promise<AuthedUser | null> {
  const token = req.cookies.get(sessionCookieName(req))?.value;
  if (!token || token.length < 32) return null;
  const sess = await findSession(sha256Hex(token));
  if (!sess) return null;
  if (Date.parse(sess.expires_at) < Date.now()) {
    await deleteSession(sess.token_hash);
    return null;
  }
  const user = await findUserById(sess.user_id);
  if (!user) {
    await deleteSession(sess.token_hash);
    return null;
  }
  // Sliding expiry: extend when under a week remains.
  let extended = false;
  if (Date.parse(sess.expires_at) - Date.now() < SESSION_REFRESH_MS) {
    sess.expires_at = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await saveSession(sess);
    extended = true;
  }
  return { user, sessionExtended: extended };
}

export function publicUser(user: UserRecord): {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string;
  plan_interest: string;
  email_verified: boolean;
  created_at: string;
} {
  return {
    id: user.id,
    name: user.name,
    business: user.business,
    email: user.email,
    phone: user.phone,
    plan_interest: user.plan_interest,
    email_verified: user.email_verified,
    created_at: user.created_at,
  };
}

// --- Rate limiting (in-memory, per instance) ---------------------------------
// Production multi-instance: move to Redis/Upstash. Documented, not wired.

interface Bucket {
  hits: number[];
  blockedUntil: number;
}

const buckets = new Map<string, Bucket>();

function bucketFor(key: string): Bucket {
  let b = buckets.get(key);
  if (!b) {
    b = { hits: [], blockedUntil: 0 };
    buckets.set(key, b);
  }
  return b;
}

/** Sliding-window check. Returns seconds to wait when blocked, else 0. */
export function rateLimit(key: string, max: number, windowMs: number, blockMs: number): number {
  const now = Date.now();
  const b = bucketFor(key);
  if (b.blockedUntil > now) return Math.ceil((b.blockedUntil - now) / 1000);
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= max) {
    b.blockedUntil = now + blockMs;
    return Math.ceil(blockMs / 1000);
  }
  b.hits.push(now);
  return 0;
}

export function authIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}

// --- CSRF (same-origin for cookie-authed mutations) --------------------------

export function isSameOrigin(req: NextRequest): boolean {
  const host = req.headers.get('host') ?? '';
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  if (origin) {
    try {
      if (new URL(origin).host !== host) return false;
    } catch {
      return false;
    }
  } else if (referer) {
    try {
      if (new URL(referer).host !== host) return false;
    } catch {
      return false;
    }
  }
  return true;
}

export function forbidden(message = 'Forbidden.'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 403 });
}
