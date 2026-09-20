import { NextRequest, NextResponse } from 'next/server';
import { findLicenseByKey, getOrderByKey } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * GET /api/public/order-status?idempotency_key=...
 * Lets the success page (and refreshes) show the minted key for a paid order.
 * The idempotency key is an unguessable UUID known only to the buyer.
 */
export async function GET(request: NextRequest) {
  const idempotencyKey = request.nextUrl.searchParams.get('idempotency_key') ?? '';
  if (!idempotencyKey) {
    return NextResponse.json({ ok: false, error: 'Missing idempotency_key.' }, { status: 400 });
  }

  const order = await getOrderByKey(idempotencyKey);
  if (!order) {
    return NextResponse.json({ ok: false, error: 'Order not found.' }, { status: 404 });
  }

  if (order.status !== 'paid' || !order.license_key) {
    return NextResponse.json({ ok: true, status: order.status, mock: order.mock });
  }

  const license = await findLicenseByKey(order.license_key);
  if (!license) {
    return NextResponse.json({ ok: true, status: order.status });
  }

  return NextResponse.json({
    ok: true,
    status: 'paid',
    mock: order.mock,
    license: {
      key: license.key,
      plan_type: license.plan_type,
      software_type: license.software_type,
      duration_days: license.duration_days,
      subscription_expires_at: license.subscription_expires_at,
    },
    email: order.form.email,
    payment_id: order.razorpay_payment_id,
  });
}
