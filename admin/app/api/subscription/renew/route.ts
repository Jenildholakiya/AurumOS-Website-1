import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { normalizePlan, getPlan } from '@/lib/plans'
import { getSubscriptionInfo } from '@/lib/subscription'
import { broadcast } from '@/lib/sse'

/**
 * POST /api/subscription/renew
 *
 * Renew a license subscription. Works for both admin dashboard and software client.
 *
 * Admin body:  { id: number } or { key: string }
 * Software body: { key: string }
 *
 * Pushes subscription_expires_at forward by 1 year.
 */
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { id, key: rawKey } = body
  const key = rawKey ? String(rawKey).trim().toUpperCase() : null

  if (!id && !key) {
    return NextResponse.json({ ok: false, error: 'Missing id or key' }, { status: 400 })
  }

  try {
    // Find license by id or key
    let result
    if (id) {
      result = await query<{ id: number; key: string; plan_type: string; status: string; subscription_expires_at: string | null }>(
        `SELECT id, key, plan_type, status, subscription_expires_at FROM licenses WHERE id = $1 LIMIT 1`,
        [id]
      )
    } else {
      result = await query<{ id: number; key: string; plan_type: string; status: string; subscription_expires_at: string | null }>(
        `SELECT id, key, plan_type, status, subscription_expires_at FROM licenses WHERE UPPER(TRIM(key)) = $1 LIMIT 1`,
        [key]
      )
    }

    if (!result.rows.length) {
      return NextResponse.json({ ok: false, error: 'License not found' }, { status: 404 })
    }

    const lic = result.rows[0]
    const previousStatus = lic.status

    if (lic.status !== 'active') {
      // Auto-activate if revoked/expired
      await query(`UPDATE licenses SET status = 'active' WHERE id = $1`, [lic.id])
      // Broadcast status_change so connected clients immediately know
      const normalizedKey = lic.key.trim().toUpperCase()
      broadcast(normalizedKey, 'status_change', {
        key: normalizedKey,
        status: 'active',
        previous_status: previousStatus,
        message: `License reactivated from ${previousStatus} via subscription renewal.`,
      })
    }

    // Always renew for exactly 1 year from now — never stack on old expiry
    const newExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    const plan = normalizePlan(lic.plan_type)

    await query(
      `UPDATE licenses
       SET subscription_expires_at = $1,
           status = 'active',
           subscription_started_at = COALESCE(subscription_started_at, NOW())
       WHERE id = $2`,
      [newExpiry.toISOString(), lic.id]
    )

    // Re-fetch to confirm the update actually persisted (guards against silent DB failures)
    const verify = await query<{ subscription_expires_at: string | null; status: string; updated_at: string | null }>(
      `SELECT subscription_expires_at, status, updated_at::text FROM licenses WHERE id = $1 LIMIT 1`,
      [lic.id]
    )
    const verified = verify.rows[0]
    if (!verified || verified.status !== 'active' || !verified.subscription_expires_at) {
      return NextResponse.json({ ok: false, error: 'Renewal failed — DB update did not persist' }, { status: 500, headers: cors() })
    }
    const persistedExpiry = verified.subscription_expires_at
    const persistedUpdatedAt = verified.updated_at

    // Broadcast via SSE
    const normalizedKey = lic.key.trim().toUpperCase()
    broadcast(normalizedKey, 'plan_change', {
      key: normalizedKey,
      plan,
      subscription_expires_at: persistedExpiry,
      message: `Subscription renewed. Expires: ${new Date(persistedExpiry).toLocaleDateString('en-GB')}`,
    })

    return NextResponse.json({
      ok: true,
      plan,
      plan_name: getPlan(plan).name,
      subscription_expires_at: persistedExpiry,
      previous_expiry: lic.subscription_expires_at,
      renewal_amount: getPlan(plan).yearly,
      updated_at: persistedUpdatedAt,
      previous_status: previousStatus,
    }, { headers: cors() })

  } catch (err: any) {
    console.error('[RENEW]', err)
    return NextResponse.json({ ok: false, error: err.message || 'Renewal failed' }, { status: 500 })
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: cors() })
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  }
}
