import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { findLicensesByEmail } from '@/lib/store';

export const runtime = 'nodejs';

/** GET /api/auth/licenses — license keys owned by the signed-in user's email. */
export async function GET(request: NextRequest) {
  const sess = await getSessionUser(request);
  if (!sess) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  const licenses = await findLicensesByEmail(sess.user.email);
  return NextResponse.json({
    ok: true,
    licenses: licenses.map((l) => ({
      key: l.key,
      plan_type: l.plan_type,
      software_type: l.software_type,
      status: l.status,
      duration_days: l.duration_days,
      subscription_started_at: l.subscription_started_at,
      subscription_expires_at: l.subscription_expires_at,
    })),
  });
}
