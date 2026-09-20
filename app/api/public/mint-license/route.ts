import { NextRequest, NextResponse } from 'next/server';
import { normalizePlan, normalizeSoftwareType } from '@/lib/plans';
import { mintLicense } from '@/lib/license';

export const runtime = 'nodejs';

/**
 * POST /api/public/mint-license — server-to-server license authority.
 *
 * This is the `aurumos-admin` endpoint from the M12 plan, implemented here
 * until the standalone admin repo exists. When admin is live, point
 * LICENSE_SERVER_URL at it and delete this route (keep `mintLicense` in
 * `lib/license.ts` in sync with admin's copy).
 *
 * Auth: `Authorization: Bearer <LICENSE_API_SECRET>`. Never call from the
 * browser — the secret must stay server-side.
 */
function allowedOrigin(request: NextRequest): boolean {
  const configured = process.env.LICENSE_WEBSITE_URL;
  if (!configured) return true; // same-app calls have no Origin expectations
  const origin = request.headers.get('origin');
  if (!origin) return true; // server-to-server (no browser Origin)
  try {
    return new URL(origin).origin === new URL(configured).origin;
  } catch {
    return false;
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  const configured = process.env.LICENSE_WEBSITE_URL;
  if (configured) headers['Access-Control-Allow-Origin'] = configured;
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: NextRequest) {
  const secret = process.env.LICENSE_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'License server is not configured (LICENSE_API_SECRET).' },
      { status: 503 }
    );
  }
  const auth = request.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!allowedOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Origin not allowed.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const softwareType = normalizeSoftwareType(body?.software_type);
    const plan = normalizePlan(body?.plan_type ?? body?.plan);

    const businessName = String(body?.business_name ?? '').trim();
    const ownerName = String(body?.owner_name ?? '').trim();
    const city = String(body?.city ?? '').trim();
    const phone = String(body?.phone ?? '').trim();
    const email = body?.email ? String(body.email).trim() : undefined;
    const notes = body?.notes ? String(body.notes) : undefined;
    const amountPaid = Number(body?.amount_paid ?? 0);
    const durationDays = Number(body?.duration_days ?? 365);
    const paymentId = body?.payment_id ? String(body.payment_id) : undefined;
    const orderId = body?.order_id ? String(body.order_id) : undefined;
    const idempotencyKey = body?.idempotency_key ? String(body.idempotency_key) : undefined;

    if (!businessName || !ownerName || !phone) {
      return NextResponse.json(
        { ok: false, error: 'business_name, owner_name and phone are required.' },
        { status: 400 }
      );
    }
    if (!softwareType) {
      return NextResponse.json(
        { ok: false, error: "software_type must be 'wholesale' or 'retail'." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
      return NextResponse.json({ ok: false, error: 'amount_paid must be a number.' }, { status: 400 });
    }

    const { license, duplicate } = await mintLicense({
      business_name: businessName,
      owner_name: ownerName,
      city,
      phone,
      email,
      notes,
      amount_paid: amountPaid,
      software_type: softwareType,
      plan_type: plan,
      duration_days: Number.isFinite(durationDays) && durationDays > 0 ? Math.floor(durationDays) : 365,
      payment_id: paymentId,
      order_id: orderId,
      idempotency_key: idempotencyKey,
    });

    console.log('mint-license:', {
      ip: request.headers.get('x-forwarded-for'),
      payment_id: paymentId,
      order_id: orderId,
      duplicate,
      key: `${license.key.slice(0, 6)}****`,
    });

    const headers: Record<string, string> = {};
    const configured = process.env.LICENSE_WEBSITE_URL;
    if (configured) headers['Access-Control-Allow-Origin'] = configured;

    return NextResponse.json(
      {
        ok: true,
        duplicate,
        key: license.key,
        plan_type: license.plan_type,
        software_type: license.software_type,
        duration_days: license.duration_days,
        subscription_expires_at: license.subscription_expires_at,
      },
      { headers }
    );
  } catch (err) {
    console.error('mint-license failed:', err);
    return NextResponse.json({ ok: false, error: 'Could not mint license.' }, { status: 500 });
  }
}
