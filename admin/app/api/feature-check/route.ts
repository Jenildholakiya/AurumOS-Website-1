import { NextRequest, NextResponse } from 'next/server'
import { getLicenseByKey, getSubscriptionInfo } from '@/lib/license'
import { normalizePlan, hasFeature, getPlan } from '@/lib/plans'

/**
 * POST /api/feature-check
 *
 * Server-side entitlement enforcement. The external ERP calls this (with the
 * license key + machine id it already has) before enabling any gated feature.
 *
 * Body: { key: string, machine_id: string, feature: string }
 * Response: { allowed: boolean, plan, feature, reason, features? }
 *
 * `allowed` is false when:
 *   - the key is unrecognized (not_found)
 *   - the key is bound to a different machine (machine_mismatch)
 *   - the license is not active (status:<x>)
 *   - the plan does not include the feature (upgrade_required)
 */
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ allowed: false, reason: 'bad_request' }, { status: 400 })
  }

  const { key, machine_id, feature } = body

  if (!key?.trim() || !feature?.trim()) {
    return NextResponse.json(
      { allowed: false, reason: 'bad_request', message: 'key and feature are required' },
      { status: 400 }
    )
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
             || req.headers.get('x-real-ip')
             || 'unknown'

  try {
    const license = await getLicenseByKey(String(key).trim().toUpperCase())

    if (!license) {
      return NextResponse.json(
        { allowed: false, reason: 'not_found', message: 'License key unrecognized' },
        { status: 404, headers: corsHeaders() }
      )
    }

    if (license.status !== 'active') {
      return NextResponse.json(
        { allowed: false, plan: normalizePlan(license.plan_type), feature, reason: `status:${license.status}` },
        { status: 200, headers: corsHeaders() }
      )
    }

    const bound = license.machine_id || license.activated_machine
    if (bound && machine_id?.trim() && bound !== String(machine_id).trim()) {
      return NextResponse.json(
        { allowed: false, plan: normalizePlan(license.plan_type), feature, reason: 'machine_mismatch' },
        { status: 200, headers: corsHeaders() }
      )
    }

    const plan = normalizePlan(license.plan_type)
    const sub = getSubscriptionInfo(license)

    // During grace period, all features degrade to Lite tier
    const effectivePlan = sub.status === 'grace' ? 'lite' : plan
    const allowed = hasFeature(effectivePlan, String(feature).trim())

    return NextResponse.json({
      allowed,
      plan,
      effective_plan: effectivePlan,
      plan_name: getPlan(effectivePlan).name,
      feature: String(feature).trim(),
      reason: allowed ? 'ok' : sub.status === 'grace' ? 'grace_limited' : 'upgrade_required',
      subscription_status: sub.status,
    }, { status: 200, headers: corsHeaders() })
  } catch (err) {
    console.error('[FEATURE-CHECK] Error:', err)
    return NextResponse.json(
      { allowed: false, reason: 'server_error' },
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
