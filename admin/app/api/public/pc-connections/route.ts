import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { normalizePlan, basePcsFor } from '@/lib/plans'
import type { License } from '@/lib/license'

const noCache = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

/**
 * GET /api/public/pc-connections?key=AU-XXXX-…
 *
 * Lightweight endpoint for the jeweller's software (brain server) to learn
 * how many LAN PCs this license may use — WITHOUT doing a full activation
 * handshake. The license key itself is the credential (same as /api/check).
 *
 * Response:
 *   { ok:true, key, plan, status, max_allowed_connections, pc_total, pc_base, pc_extra }
 *
 * The brain server should cap its LAN client count to `pc_total` and
 * re-poll this endpoint (or /api/check) periodically so an admin PC grant
 * (+3 PCs → total 4) takes effect without re-entering the key.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const key = (searchParams.get('key') || '').trim().toUpperCase()
    if (!key) {
      return NextResponse.json(
        { ok: false, error: 'key query param is required' },
        { status: 400, headers: noCache },
      )
    }
    const { rows } = await query<License>(
      `SELECT id, key, business_name, plan_type, status, duration_days,
              max_allowed_connections, subscription_expires_at
         FROM licenses WHERE UPPER(TRIM("key")) = $1 LIMIT 1`,
      [key],
    )
    const lic = rows[0]
    if (!lic) {
      return NextResponse.json({ ok: false, status: 'not_found' }, { headers: noCache })
    }
    const plan = normalizePlan(lic.plan_type)
    const base = basePcsFor(plan)
    const total = Number((lic as any).max_allowed_connections ?? base) > 0
      ? Math.floor(Number((lic as any).max_allowed_connections ?? base))
      : base
    return NextResponse.json(
      {
        ok: true,
        key: lic.key,
        business: (lic as any).business_name ?? null,
        plan,
        plan_type: lic.plan_type,
        status: lic.status,
        max_allowed_connections: total, // legacy name — brain servers read this
        pc_total: total,
        pc_base: base,
        pc_extra: Math.max(0, total - base),
      },
      { headers: noCache },
    )
  } catch (err) {
    console.error('[GET /api/public/pc-connections]', err)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500, headers: noCache })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: noCache })
}
