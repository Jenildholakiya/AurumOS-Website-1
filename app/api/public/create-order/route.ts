import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  PLANS,
  normalizePlan,
  normalizeSoftwareType,
  planAmountPaise,
} from '@/lib/plans';
import { createRazorpayOrder, isRazorpayConfigured, razorpayKeyId } from '@/lib/razorpay';
import { saveOrder } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * POST /api/public/create-order
 * Validate checkout form -> create Razorpay order (or mock order in dev) ->
 * save pending website order. Returns what Checkout.js needs.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const plan = normalizePlan(body?.plan);
    const softwareType = normalizeSoftwareType(body?.software_type);

    const businessName = String(body?.business_name ?? '').trim();
    const ownerName = String(body?.owner_name ?? '').trim();
    const city = String(body?.city ?? '').trim();
    const phone = String(body?.phone ?? '').trim();
    const email = String(body?.email ?? '').trim();
    const notes = String(body?.notes ?? '').trim();

    if (!softwareType) {
      return NextResponse.json(
        { ok: false, error: 'Select wholesale or retail software type.' },
        { status: 400 }
      );
    }
    if (!businessName || !ownerName || !phone || !email) {
      return NextResponse.json(
        { ok: false, error: 'Business name, owner name, phone and email are required.' },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!/^[+]?[\d\s().-]{7,20}$/.test(phone)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid phone number.' }, { status: 400 });
    }

    const amountPaise = planAmountPaise(plan);
    const idempotencyKey = randomUUID();
    const form = { business_name: businessName, owner_name: ownerName, city, phone, email, notes };

    let razorpayOrderId: string;
    let mock = false;

    if (isRazorpayConfigured()) {
      try {
        const order = await createRazorpayOrder({
          amountPaise,
          receipt: idempotencyKey,
          notes: {
            idempotency_key: idempotencyKey,
            plan,
            software_type: softwareType,
            email,
          },
        });
        razorpayOrderId = order.id;
      } catch (err) {
        console.error('Razorpay order creation failed:', err);
        return NextResponse.json(
          { ok: false, error: 'Could not start the payment. Please try again.' },
          { status: 502 }
        );
      }
    } else {
      // Dev/test mode: no Razorpay keys configured.
      mock = true;
      razorpayOrderId = `order_mock_${idempotencyKey.replace(/-/g, '').slice(0, 14)}`;
    }

    await saveOrder({
      idempotency_key: idempotencyKey,
      email,
      plan,
      software_type: softwareType,
      form,
      status: 'pending',
      razorpay_order_id: razorpayOrderId,
      amount: amountPaise,
      currency: 'INR',
      mock,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      order_id: razorpayOrderId,
      amount: amountPaise,
      currency: 'INR',
      key_id: razorpayKeyId(),
      idempotency_key: idempotencyKey,
      plan,
      plan_name: PLANS[plan].name,
      mock,
    });
  } catch (err) {
    console.error('create-order failed:', err);
    return NextResponse.json({ ok: false, error: 'Could not start the payment.' }, { status: 500 });
  }
}
