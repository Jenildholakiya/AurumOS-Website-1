import { NextRequest, NextResponse } from 'next/server'
import { getLicenseByKey, getSubscriptionInfo, type License } from '@/lib/license'
import { normalizePlan, featuresWithSeats, basePcsFor } from '@/lib/plans'

/**
 * POST /api/subscription/status
 *
 * Client software calls this to get full subscription state including
 * effective plan, feature list, and renewal info. The client should
 * call this on startup and periodically (every 15-30 min) to sync.
 *
 * Body: { key: string, machine_id: string }
 */
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ valid: false, reason: 'bad_request' }, { status: 400 })
  }

  const { key, machine_id } = body

  if (!key?.trim()) {
    return NextResponse.json(
      { valid: false, reason: 'bad_request', message: 'key is required' },
      { status: 400 }
    )
  }

  try {
    const license = await getLicenseByKey(String(key).trim().toUpperCase())

    if (!license) {
      return NextResponse.json(
        { valid: false, reason: 'not_found', message: 'License key unrecognized', updated_at: null },
        { status: 404, headers: corsHeaders() }
      )
    }

    if (license.status !== 'active') {
      return NextResponse.json({
        valid: false,
        reason: `status:${license.status}`,
        plan: normalizePlan(license.plan_type),
        updated_at: license.updated_at ?? null,
      }, { status: 200, headers: corsHeaders() })
    }

    const bound = license.machine_id || license.activated_machine
    if (bound && machine_id?.trim() && bound !== String(machine_id).trim()) {
      return NextResponse.json({
        valid: false,
        reason: 'machine_mismatch',
        plan: normalizePlan(license.plan_type),
        updated_at: license.updated_at ?? null,
      }, { status: 200, headers: corsHeaders() })
    }

    const sub = getSubscriptionInfo(license)
    const plan = normalizePlan(license.plan_type)
    const effectivePlan = sub.status === 'grace' ? 'lite' : plan
    const pcBase = basePcsFor(plan)
    const pcTotal = Number((license as any).max_allowed_connections ?? pcBase) > 0
      ? Math.floor(Number((license as any).max_allowed_connections ?? pcBase))
      : pcBase

    return NextResponse.json({
      valid: true,
      plan,
      plan_name: effectivePlan === 'lite' ? 'Lite' : effectivePlan === 'pro' ? 'Pro' : 'Enterprise',
      effective_plan: effectivePlan,
      subscription_status: sub.status,
      subscription_expires_at: sub.expires_at,
      remaining_days: sub.remaining_days,
      grace_remaining_days: sub.grace_remaining_days,
      renewal_amount: sub.renewal_amount,
      features: featuresWithSeats(effectivePlan, pcTotal),
      max_allowed_connections: pcTotal,
      pc_total: pcTotal,
      pc_base: pcBase,
      pc_extra: Math.max(0, pcTotal - pcBase),
      is_trial: false,
      business: license.business_name,
      owner: license.owner_name,
      updated_at: license.updated_at ?? null,
    }, { status: 200, headers: corsHeaders() })
  } catch (err) {
    console.error('[SUBSCRIPTION-STATUS] Error:', err)
    return NextResponse.json(
      { valid: false, reason: 'server_error' },
      { status: 200, headers: corsHeaders() }
    )
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control':                'no-store',
  }
}
