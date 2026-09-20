import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, publicUser } from '@/lib/auth';

export const runtime = 'nodejs';

/** GET /api/auth/me — current session user (401 when signed out). */
export async function GET(request: NextRequest) {
  const sess = await getSessionUser(request);
  if (!sess) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user: publicUser(sess.user) });
}
