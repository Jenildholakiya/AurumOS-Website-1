import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '@/lib/plans';
import { mintViaAuthority } from '@/lib/license-authority';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { getOrderByKey, getOrderByRazorpayOrderId, saveOrder } from '@/lib/store';
import { isEmailConfigured, sendLicenseKeyEmail } from '@/lib/email';

export const runtime = 'nodejs';

interface CapturedPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  notes?: Record<string, string>;
}

/**
 * POST /api/public/payment-webhook (source of truth for paid orders)
 * Verifies `x-razorpay-signature` over the RAW body, then mints the license
 * with the same idempotency key as verify-payment — a retried webhook can
 * never create a second key. Always responds 200 fast after processing so
 * Razorpay stops retrying.
 */
export async function POST(request: NextRequest) {
  let raw = '';
  try {
    raw = await request.text();
    const signature = request.headers.get('x-razorpay-signature') ?? '';

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      // Webhooks only matter in live mode; ignore otherwise.
      return NextResponse.json({ ok: true, ignored: true });
    }
    if (!verifyWebhookSignature(raw, signature)) {
      console.warn('payment-webhook: bad signature');
      return NextResponse.json({ ok: false, error: 'Bad signature' }, { status: 400 });
    }

    const event = JSON.parse(raw) as { event: string; payload?: { payment?: { entity?: CapturedPayment } } };
    if (event.event !== 'payment.captured') {
      return NextResponse.json({ ok: true, ignored: true, event: event.event });
    }

    const entity = event.payload?.payment?.entity;
    if (!entity?.id || !entity?.order_id) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const idempotencyKey = entity.notes?.idempotency_key ?? '';
    const order =
      (idempotencyKey ? await getOrderByKey(idempotencyKey) : null) ??
      (await getOrderByRazorpayOrderId(entity.order_id));

    if (!order) {
      console.warn('payment-webhook: order not found', { razorpay_order_id: entity.order_id });
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (order.status === 'paid') {
      // Webhook retry after verify-payment already minted -> idempotent no-op.
      return NextResponse.json({ ok: true, duplicate: true });
    }

    if (entity.amount < order.amount) {
      console.warn('payment-webhook: amount mismatch', {
        expected: order.amount,
        got: entity.amount,
        order: order.idempotency_key,
      });
      return NextResponse.json({ ok: true, ignored: true, reason: 'amount_mismatch' });
    }

    const { license } = await mintViaAuthority({
      business_name: order.form.business_name,
      owner_name: order.form.owner_name,
      city: order.form.city,
      phone: order.form.phone,
      email: order.form.email,
      notes: [
        order.form.notes,
        `plan=${order.plan}`,
        `payment_id=${entity.id}`,
        `order_id=${entity.order_id}`,
      ]
        .filter(Boolean)
        .join(' | '),
      amount_paid: Math.round(order.amount / 100),
      software_type: order.software_type,
      plan_type: order.plan,
      duration_days: 365,
      payment_id: entity.id,
      order_id: entity.order_id,
      idempotency_key: order.idempotency_key,
    });

    order.status = 'paid';
    order.razorpay_payment_id = entity.id;
    order.license_key = license.key;
    order.paid_at = new Date().toISOString();
    await saveOrder(order);

    if (isEmailConfigured()) {
      try {
        await sendLicenseKeyEmail({
          to: order.form.email,
          ownerName: order.form.owner_name,
          businessName: order.form.business_name,
          key: license.key,
          planName: PLANS[order.plan].name,
          softwareType: order.software_type,
          expiresAt: license.subscription_expires_at.slice(0, 10),
          paymentId: entity.id,
        });
      } catch (err) {
        console.error('payment-webhook: key email failed:', err);
      }
    }

    console.log('payment-webhook: minted', {
      ip: request.headers.get('x-forwarded-for'),
      payment_id: entity.id,
      key: `${license.key.slice(0, 6)}****`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('payment-webhook failed:', err);
    // Return 200 anyway for parse/log failures after signature check so
    // Razorpay does not retry a poison event; signature failures use 400 above.
    if (!raw) return NextResponse.json({ ok: false }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
}
