import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '@/lib/plans';
import { mintViaAuthority } from '@/lib/license-authority';
import {
  fetchRazorpayPayment,
  isMockOrder,
  isRazorpayConfigured,
  verifyPaymentSignature,
} from '@/lib/razorpay';
import { getOrderByKey, saveOrder } from '@/lib/store';
import { isEmailConfigured, sendLicenseKeyEmail } from '@/lib/email';

export const runtime = 'nodejs';

function licenseResponse(license: {
  key: string;
  plan_type: string;
  software_type: string;
  duration_days: number;
  subscription_expires_at: string;
}) {
  return {
    key: license.key,
    plan_type: license.plan_type,
    software_type: license.software_type,
    duration_days: license.duration_days,
    subscription_expires_at: license.subscription_expires_at,
  };
}

/**
 * POST /api/public/verify-payment (client fallback after Checkout.js success)
 * Verifies the Razorpay signature, then mints the license (idempotent).
 * The webhook below is the source of truth; this exists so the buyer sees
 * their key immediately even if the webhook is delayed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const razorpayOrderId = String(body?.razorpay_order_id ?? '');
    const paymentId = String(body?.razorpay_payment_id ?? '');
    const signature = String(body?.razorpay_signature ?? '');
    const idempotencyKey = String(body?.idempotency_key ?? '');
    const mockConfirm = body?.mock === true;

    if (!razorpayOrderId || !paymentId || !idempotencyKey) {
      return NextResponse.json({ ok: false, error: 'Missing payment details.' }, { status: 400 });
    }

    const order = await getOrderByKey(idempotencyKey);
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Order not found. Start checkout again.' }, { status: 404 });
    }
    if (order.razorpay_order_id !== razorpayOrderId) {
      return NextResponse.json({ ok: false, error: 'Order mismatch.' }, { status: 400 });
    }

    // Already paid (webhook won the race, or double submit) -> return same key.
    if (order.status === 'paid' && order.license_key) {
      const { findLicenseByKey } = await import('@/lib/store');
      const existing = await findLicenseByKey(order.license_key);
      if (existing) return NextResponse.json({ ok: true, duplicate: true, license: licenseResponse(existing) });
    }

    if (isMockOrder(razorpayOrderId)) {
      // Test mode: only our own checkout page can confirm a mock payment.
      if (!mockConfirm || !paymentId.startsWith('pay_mock_')) {
        return NextResponse.json({ ok: false, error: 'Invalid test payment.' }, { status: 400 });
      }
    } else {
      if (!isRazorpayConfigured()) {
        return NextResponse.json({ ok: false, error: 'Payments are not configured.' }, { status: 500 });
      }
      if (!verifyPaymentSignature({ orderId: razorpayOrderId, paymentId, signature })) {
        console.warn('verify-payment: bad signature', { razorpayOrderId, paymentId });
        return NextResponse.json({ ok: false, error: 'Payment verification failed.' }, { status: 400 });
      }
      // Confirm with Razorpay directly: captured + full amount.
      const payment = await fetchRazorpayPayment(paymentId);
      if (!payment || payment.status !== 'captured' || payment.order_id !== razorpayOrderId) {
        return NextResponse.json(
          { ok: false, error: 'Payment not captured yet. If money was debited, your key will arrive by email shortly.' },
          { status: 402 }
        );
      }
      if (payment.amount < order.amount) {
        console.warn('verify-payment: amount mismatch', { expected: order.amount, got: payment.amount });
        return NextResponse.json({ ok: false, error: 'Paid amount does not match the plan price.' }, { status: 402 });
      }
    }

    const { license, duplicate } = await mintViaAuthority({
      business_name: order.form.business_name,
      owner_name: order.form.owner_name,
      city: order.form.city,
      phone: order.form.phone,
      email: order.form.email,
      notes: [
        order.form.notes,
        `plan=${order.plan}`,
        `payment_id=${paymentId}`,
        `order_id=${razorpayOrderId}`,
      ]
        .filter(Boolean)
        .join(' | '),
      amount_paid: Math.round(order.amount / 100),
      software_type: order.software_type,
      plan_type: order.plan,
      duration_days: 365,
      payment_id: paymentId,
      order_id: razorpayOrderId,
      idempotency_key: idempotencyKey,
    });

    order.status = 'paid';
    order.razorpay_payment_id = paymentId;
    order.license_key = license.key;
    order.paid_at = new Date().toISOString();
    await saveOrder(order);

    let emailSent = false;
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
          paymentId,
        });
        emailSent = true;
      } catch (err) {
        console.error('verify-payment: key email failed:', err);
      }
    }

    return NextResponse.json({ ok: true, duplicate, license: licenseResponse(license), email_sent: emailSent });
  } catch (err) {
    console.error('verify-payment failed:', err);
    // Paid but mint failed -> tell the buyer explicitly (support path).
    return NextResponse.json(
      {
        ok: false,
        error: 'Payment received but key generation failed. Check your email or contact support with your payment ID.',
      },
      { status: 500 }
    );
  }
}
