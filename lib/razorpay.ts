import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Razorpay helpers (dependency-free, uses REST + node:crypto).
 *
 * Two modes:
 *  - LIVE: RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are set. Orders are created
 *    via the Razorpay Orders API and signatures are verified with HMAC-SHA256.
 *  - MOCK (dev/test): keys are absent. Orders get an `order_mock_*` id and
 *    verification is skipped server-side. Lets you test the full
 *    Buy -> Pay -> Auto-key flow for ₹1 without a Razorpay account.
 */

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'mock';
}

export function isMockOrder(orderId: string): boolean {
  return orderId.startsWith('order_mock_');
}

export interface CreatedOrder {
  id: string;
  amount: number;
  currency: string;
}

export async function createRazorpayOrder(opts: {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<CreatedOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay is not configured.');

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: opts.currency ?? 'INR',
      receipt: opts.receipt.slice(0, 40),
      notes: opts.notes ?? {},
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Razorpay order creation failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id: string; amount: number; currency: string };
  return { id: data.id, amount: data.amount, currency: data.currency };
}

/** Fetch a payment from Razorpay to confirm amount + captured status. */
export async function fetchRazorpayPayment(paymentId: string): Promise<{ amount: number; currency: string; status: string; order_id: string } | null> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { amount: number; currency: string; status: string; order_id: string };
  return { amount: data.amount, currency: data.currency, status: data.status, order_id: data.order_id };
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Verify Checkout.js payment signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(opts: { orderId: string; paymentId: string; signature: string }): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = createHmac('sha256', secret).update(`${opts.orderId}|${opts.paymentId}`).digest('hex');
  return safeEqualHex(expected, opts.signature);
}

/** Verify webhook signature header over the RAW request body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}
