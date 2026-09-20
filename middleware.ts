import { NextRequest, NextResponse } from 'next/server';

/**
 * Front door for local dev (single repo, two apps):
 *   localhost:3000       -> this website app (served directly)
 *   admin.localhost:3000 -> admin app in ./admin (proxied to :3002)
 *
 * Run both with `npm run dev` (site :3000 + admin :3002).
 * Presence-guard for account pages (cookie exists?). Real session validation
 * happens server-side in the page/API — middleware can't read the store.
 */
const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN ?? 'http://127.0.0.1:3002';

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').split(':')[0].toLowerCase();
  if (host === 'admin.localhost' || host.endsWith('.admin.localhost')) {
    // Preserve the RAW path+query byte-for-byte: nextUrl.pathname decodes
    // %XX escapes and re-encoding breaks the upstream fetch.
    const rawPath = req.url.slice(new URL(req.url).origin.length);
    return NextResponse.rewrite(new URL(ADMIN_ORIGIN + rawPath));
  }

  const { pathname } = req.nextUrl;
  const hasSession =
    req.cookies.has('aurumos_session') || req.cookies.has('__Host-aurumos_session');

  if ((pathname === '/account' || pathname.startsWith('/account/')) && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', '/account');
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Must run on every path so admin.localhost requests (incl. /_next assets)
  // can be proxied to the admin app. Non-admin, non-account paths fall through.
  matcher: ['/:path*'],
};
