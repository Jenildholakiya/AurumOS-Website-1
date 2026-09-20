import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { normalizePlan, getPlanFeatures } from '@/lib/plans'
import { broadcast } from '@/lib/sse'

/**
 * POST /api/subscription/change-plan
 *
 * Admin changes a license's plan. Updates plan_type, resets subscription
 * expiry to 1 year from now, and broadcasts the change via SSE so
 * connected clients sync instantly.
 *
 * Body: { id: number, plan: string }
 */
export async function POST(req: NextRequest) {
  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { id, plan: rawPlan } = body

    if (!id || !rawPlan) {
      return NextResponse.json({ error: 'Missing id or plan' }, { status: 400 })
    }

    const plan = normalizePlan(rawPlan)

    // Fetch current license
    const current = await query<{ id: number; key: string; plan_type: string; status: string; subscription_expires_at: string | null }>(
      `SELECT id, key, plan_type, status, subscription_expires_at FROM licenses WHERE id = $1 LIMIT 1`,
      [id]
    )

    if (!current.rows.length) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }

    const lic = current.rows[0]

    if (lic.status !== 'active') {
      return NextResponse.json({ error: 'Cannot change plan on non-active license' }, { status: 400 })
    }

    // Reset subscription to 1 year from now on plan change
    const newExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    const result = await query(
      `UPDATE licenses
       SET plan_type = $1,
           subscription_expires_at = $2,
           subscription_started_at = COALESCE(subscription_started_at, NOW())
       WHERE id = $3
       RETURNING *`,
      [plan, newExpiry.toISOString(), id]
    )

    if (!result.rows.length) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    const features = getPlanFeatures(plan)
    const normalizedKey = (lic.key || '').trim().toUpperCase()

    // Broadcast plan change via SSE — connected clients sync instantly
    broadcast(normalizedKey, 'plan_change', {
      key: normalizedKey,
      plan,
      features,
      subscription_expires_at: newExpiry.toISOString(),
      message: `Plan changed to ${plan.toUpperCase()}. Features: ${features.length}. Expires: ${newExpiry.toLocaleDateString('en-GB')}`,
    })

    return NextResponse.json({
      status: 'success',
      data: {
        id: lic.id,
        plan,
        features,
        subscription_expires_at: newExpiry.toISOString(),
        previous_plan: lic.plan_type,
      }
    })
  } catch (err: any) {
    console.error('[POST /api/subscription/change-plan]:', err)
    return NextResponse.json({ error: err.message || 'Plan change failed' }, { status: 500 })
  }
}
