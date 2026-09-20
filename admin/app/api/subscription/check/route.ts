import { NextRequest, NextResponse } from 'next/server'
import { getLicenseByKey, getSubscriptionInfo } from '@/lib/license'
import { normalizePlan, featuresWithSeats, basePcsFor } from '@/lib/plans'

/**
 * POST /api/subscription/check
 *
 * Single endpoint for software to decide: show normal screen or revoked screen.
 *
 * Body: { key: string, machine_id: string }
 *
 * Response:
 * {
 *   "ok": true/false,        ← false = show revoked/locked screen
 *   "reason": "active" | "grace" | "expired" | "revoked" | "not_found",
 *   "plan": "pro",
 *   "effective_plan": "pro",  ← "lite" during grace
 *   "features": [...],
 *   "expires_at": "2027-08-23T...",
 *   "remaining_days": 365,
 *   "grace_days": 0,
 *   "renewal_amount": 7000,
 *   "business": "Shop Name"
 * }
 */
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 })
  }

  const { key, machine_id } = body
  if (!key?.trim()) {
    return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 })
  }

  try {
    const license = await getLicenseByKey(String(key).trim().toUpperCase())

    // Key not found
    if (!license) {
      return NextResponse.json({
        ok: false, reason: 'not_found', plan: 'lite', effective_plan: 'lite',
        features: [], expires_at: null, remaining_days: 0, grace_days: 0,
        renewal_amount: 0, business: '', updated_at: null,
      }, { headers: cors() })
    }

    // License revoked
    if (license.status === 'revoked') {
      return NextResponse.json({
        ok: false, reason: 'revoked', plan: normalizePlan(license.plan_type),
        effective_plan: 'lite', features: [], expires_at: null,
        remaining_days: 0, grace_days: 0, renewal_amount: 0,
        business: license.business_name, updated_at: license.updated_at ?? null,
      }, { headers: cors() })
    }

    // Machine mismatch
    const bound = license.machine_id || license.activated_machine
    if (bound && machine_id?.trim() && bound !== String(machine_id).trim()) {
      if (!license.allow_rebind) {
        return NextResponse.json({
          ok: false, reason: 'machine_mismatch', plan: normalizePlan(license.plan_type),
          effective_plan: 'lite', features: [], expires_at: null,
          remaining_days: 0, grace_days: 0, renewal_amount: 0,
          business: license.business_name, updated_at: license.updated_at ?? null,
        }, { headers: cors() })
      }
    }

    // Subscription check
    const sub = getSubscriptionInfo(license)
    const plan = normalizePlan(license.plan_type)
    const effectivePlan = sub.status === 'grace' ? 'lite' : plan

    // Expired = show revoke screen
    if (sub.status === 'expired') {
      return NextResponse.json({
        ok: false, reason: 'expired', plan,
        effective_plan: plan, features: [],
        expires_at: sub.expires_at, remaining_days: 0, grace_days: 0,
        renewal_amount: sub.renewal_amount, business: license.business_name,
        updated_at: license.updated_at ?? null,
      }, { headers: cors() })
    }

    // Grace = still ok but degraded
    const pcBase = basePcsFor(plan)
    const pcTotal = Number((license as any).max_allowed_connections ?? pcBase) > 0
      ? Math.floor(Number((license as any).max_allowed_connections ?? pcBase))
      : pcBase
    return NextResponse.json({
      ok: true,
      reason: sub.status === 'grace' ? 'grace' : 'active',
      plan,
      effective_plan: effectivePlan,
      features: featuresWithSeats(effectivePlan, pcTotal),
      max_allowed_connections: pcTotal,
      pc_total: pcTotal,
      pc_base: pcBase,
      pc_extra: Math.max(0, pcTotal - pcBase),
      expires_at: sub.expires_at,
      remaining_days: sub.remaining_days,
      grace_days: sub.grace_remaining_days,
      renewal_amount: sub.renewal_amount,
      business: license.business_name,
      updated_at: license.updated_at ?? null,
    }, { headers: cors() })

  } catch (err) {
    console.error('[SUB-CHECK]', err)
    return NextResponse.json({
      ok: false, reason: 'server_error', plan: 'lite', effective_plan: 'lite',
      features: [], expires_at: null, remaining_days: 0, grace_days: 0,
      renewal_amount: 0, business: '',
    }, { headers: cors() })
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
