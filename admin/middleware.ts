import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, SESSION_COOKIE } from '@/lib/auth'

// Runs on :3002 behind the website's :3000 front door.
// Subdomain routing (admin.localhost -> this app) is handled by the
// website's middleware proxy, so this middleware only does admin auth.
// (The old single-port apex-proxy branch was removed in the monorepo move.)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static assets on admin hosts — always allow (no auth).
  if (pathname.startsWith('/_next/') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // Public routes — always allow.
  // Policy: EVERY browser page except /login requires a session and bounces
  // to /login at the edge (no page renders first). Only machine APIs that
  // enforce their own auth stay exempt (website server-to-server calls,
  // device polling, bastion secrets) — redirecting those to HTML login
  // would break integrations with 307 -> 405 crashes.
  if (
    pathname === '/login' ||
    pathname === '/api/auth' ||
    pathname === '/api/check' ||
    pathname === '/api/feature-check' ||

    // ── EXEMPT NEXUS HANDSHAKE API ROUTES (FIXES THE 307 -> 405 ENGINE CRASH) ──
    pathname.startsWith('/api/nexus/') ||
    
    // EXEMPT UNLOCK VERIFY (called by client to validate + consume a key)
    pathname === '/api/unlock/verify' ||

    // EXEMPT BASTION API ROUTES:
    // These routes handle their own security via x-admin-secret
    pathname.startsWith('/api/bastion/') ||
    pathname.startsWith('/api/subscription/') ||
    pathname.startsWith('/api/health') ||
    pathname === '/api/poll' ||
    // EXEMPT PUBLIC MINT (website server-to-server auto-license after payment;
    // route enforces its own Bearer LICENSE_API_SECRET + rate limit)
    pathname.startsWith('/api/public/') ||
    // EXEMPT URGENT MESSAGES (desktop terminals fetch catch-up via
    // GET /api/messages?key=... with no admin session; POST stays
    // admin-only via route-level requireAuth returning 401 JSON)
    // EXEMPT PAYMENTS (dashboard Online Sales fetch; route enforces its own
    // admin session via requireAuth returning 401 JSON instead of a 307)
    pathname === '/api/payments' ||
    pathname === '/api/payments/attempts' ||
    pathname === '/api/messages' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Protected routes — require a current-epoch admin session.
  // Anything else (missing, forged, expired, or pre-hardening cookie)
  // bounces to /login, and a dead cookie is deleted so the browser
  // stops replaying it on every request.
  const ok = await requireAuth(req)
  if (!ok) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    const res = NextResponse.redirect(url)
    if (req.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE)
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*'],
}