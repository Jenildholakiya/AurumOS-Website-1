import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { normalizePlan, featuresWithSeats, basePcsFor } from '@/lib/plans'
import { isTrial, isTrialExpired, trialEndTime, updateLicenseActivation, getSubscriptionInfo, type License } from '@/lib/license'
import { broadcast } from '@/lib/sse'

const noCache = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
}

// ── 1. CLIENT HANDSHAKE VERIFICATION GATEWAY ──
export async function POST(req: NextRequest) {
  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ valid: false, status: 'bad_request', message: 'Invalid JSON payload shape' }, { status: 400, headers: noCache })
    }

    const { key, machine_id } = body

    if (!key?.trim()) {
      return NextResponse.json({ valid: false, status: 'invalid', message: 'License authorization key required' }, { status: 400, headers: noCache })
    }

    const sql = `SELECT * FROM licenses WHERE UPPER(TRIM("key")) = $1 LIMIT 1`
    const result = await query(sql, [key.trim().toUpperCase()])

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ valid: false, status: 'not_found', message: 'License key unrecognized on server' }, { headers: noCache })
    }

    const license = result.rows[0] as License

    if (license.status !== 'active') {
      return NextResponse.json({ valid: false, status: license.status || 'revoked', message: `License is ${license.status || 'revoked'}. Contact AurumOS support.` }, { headers: noCache })
    }

    if (license.is_used && license.activated_machine && license.activated_machine !== machine_id?.trim()) {
      return NextResponse.json({ valid: false, status: 'invalid', message: 'License key bound to alternative hardware footprint' }, { headers: noCache })
    }

    if (!license.is_used && machine_id?.trim()) {
      // Unified activation: binds the machine AND stamps the trial clock on
      // first activation (see updateLicenseActivation). Refresh our local copy
      // so expiry math + the response reflect the freshly-stamped start.
      const updated = await updateLicenseActivation(license.id, {
        is_used: true,
        activated_machine: machine_id.trim()
      })
      if (updated) Object.assign(license, updated)
    }

    // Real-time trial enforcement: lock the terminal the instant the horizon
    // elapses, regardless of what the admin has (or hasn't) clicked.
    if (isTrialExpired(license, Date.now())) {
      return NextResponse.json({
        valid: false,
        status: 'trial_expired',
        message: 'Evaluation horizon has elapsed — terminal locked.'
      }, { headers: noCache })
    }

    // Subscription enforcement
    const sub = getSubscriptionInfo(license)
    if (sub.status === 'expired') {
      return NextResponse.json({
        valid: false,
        status: 'subscription_expired',
        message: 'Subscription has expired. Please renew to continue.',
        subscription: sub,
      }, { headers: noCache })
    }

    const plan = normalizePlan(license.plan_type)
    const effectivePlan = sub.status === 'grace' ? 'lite' : plan
    // PC connections for the jeweller (brain server): total = base + purchased extra.
    const pcBase = basePcsFor(plan)
    const pcTotal = Number(license.max_allowed_connections ?? pcBase) > 0
      ? Math.floor(Number(license.max_allowed_connections ?? pcBase))
      : pcBase
    return NextResponse.json({
      valid: true,
      status: sub.status === 'grace' ? 'grace' : 'active',
      business: license.business_name,
      owner: license.owner_name,
      plan_type: license.plan_type || 'lite',
      plan,                              // normalized tier: lite | pro | enterprise
      effective_plan: effectivePlan,     // 'lite' during grace period
      features: featuresWithSeats(effectivePlan, pcTotal), // resolved ids + terminals=N seat token (degraded during grace)
      duration_days: license.duration_days,
      is_trial: isTrial(license),
      trial_end_ms: trialEndTime(license),
      max_allowed_connections: pcTotal,
      pc_total: pcTotal,
      pc_base: pcBase,
      pc_extra: Math.max(0, pcTotal - pcBase),
      activated_at: license.activated_at || new Date().toISOString(),
      trial_started_at: license.trial_started_at ?? null,
      subscription: sub,
    }, { headers: noCache })

  } catch (err: any) {
    console.error('[POST /api/nexus/handshake Exception]:', err)
    return NextResponse.json({ valid: false, status: 'server_error', message: 'Internal validation handshake failure' }, { status: 500, headers: noCache })
  }
}

// ── 2. ADMINISTRATIVE PROFILE CONFIGURATION MODIFIER ──
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '')

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Missing or invalid identifier string (?id=...)' }, { status: 400 })
    }

    const body = await req.json()
    const allowedUpdates: Record<string, any> = {}

    if (body.status !== undefined) allowedUpdates.status = body.status
    if (body.plan_type !== undefined) allowedUpdates.plan_type = normalizePlan(body.plan_type)
    if (body.duration_days !== undefined) allowedUpdates.duration_days = parseInt(body.duration_days)
    if (body.max_allowed_connections !== undefined) allowedUpdates.max_allowed_connections = parseInt(body.max_allowed_connections)
    if (body.machine_id !== undefined) allowedUpdates.machine_id = body.machine_id
    if (body.activated_machine !== undefined) allowedUpdates.activated_machine = body.activated_machine
    if (body.is_used !== undefined) allowedUpdates.is_used = body.is_used
    if (body.activated_at !== undefined) allowedUpdates.activated_at = body.activated_at

    // Trial lifecycle clock: an explicit trial_started_at (e.g. forced-expiry
    // on Terminate) is honored as-is; otherwise starting a finite Lite trial
    // stamps NOW and leaving trial state clears it.
    if (body.trial_started_at !== undefined) {
      allowedUpdates.trial_started_at = body.trial_started_at
    } else if (body.plan_type !== undefined && body.duration_days !== undefined) {
      allowedUpdates.trial_started_at = isTrial({
        plan_type: body.plan_type,
        duration_days: parseInt(body.duration_days),
      }) ? new Date().toISOString() : null
    }

    const keys = Object.keys(allowedUpdates)
    if (keys.length === 0) {
      return NextResponse.json({ error: 'No valid modification fields provided' }, { status: 400 })
    }

    const setClauses = keys.map((key, index) => `"${key}" = $${index + 1}`)
    const queryValues = Object.values(allowedUpdates)
    
    queryValues.push(id)
    const idParamIndex = queryValues.length

    const sql = `
      UPDATE licenses 
      SET ${setClauses.join(', ')}
      WHERE id = $${idParamIndex}
      RETURNING *
    `

    const result = await query(sql, queryValues)
    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: 'Target profile missing' }, { status: 404 })
    }

    const updated = result.rows[0] as License

    if (body.status !== undefined && body.status !== updated.status) {
      const normalizedKey = (updated.key || '').trim().toUpperCase()
      broadcast(normalizedKey, 'status_change', {
        key: normalizedKey,
        status: updated.status,
        message: updated.status === 'revoked'
          ? 'License has been revoked by administrator.'
          : updated.status === 'expired'
            ? 'License has expired.'
            : `License status changed to ${updated.status}.`
      })
    }

    return NextResponse.json({ status: 'success', data: updated })
  } catch (err: any) {
    console.error('[PATCH /api/nexus/handshake Exception]:', err)
    return NextResponse.json({ error: err.message || 'Database mutation fault' }, { status: 500 })
  }
}

// ── 3. ADMINISTRATIVE PURGE CONTROL ENGINE ──
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '')

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Missing parameter mapping target (?id=...)' }, { status: 400 })
    }

    const sql = `DELETE FROM licenses WHERE id = $1 RETURNING *`
    const result = await query(sql, [id])

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: 'Target ledger entity absent' }, { status: 404 })
    }

    return NextResponse.json({ status: 'success', message: 'Entity purged cleanly.' })
  } catch (err: any) {
    console.error('[DELETE /api/nexus/handshake Exception]:', err)
    return NextResponse.json({ error: err.message || 'Erase pipeline failure' }, { status: 500 })
  }
}