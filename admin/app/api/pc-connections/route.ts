import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { query } from '@/lib/db'
import { normalizePlan, basePcsFor, canAddExtraPcs, PC_MAX_TOTAL } from '@/lib/plans'
import { ensurePcTables, clampTotal, pcSummary, getRecentPcAddons } from '@/lib/pc'
import { broadcast } from '@/lib/sse'
import type { License } from '@/lib/license'

/**
 * GET /api/pc-connections
 *   ?license_id=123 → history for one license + its live PC summary
 *   (no param)     → recent purchase history (latest 20)
 *
 * POST /api/pc-connections  (admin auth required)
 *   { license_id, mode: 'add' | 'set', pcs, amount_paid?, notes? }
 *   - mode 'add': total = current_total + pcs
 *   - mode 'set': total = pcs
 *   Updates licenses.max_allowed_connections, logs a pc_addons row, and
 *   broadcasts an SSE event so open dashboards refresh. The jeweller's
 *   software picks the new total up on its next /api/check (or polls
 *   GET /api/public/pc-connections?key=…).
 */
export async function GET(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensurePcTables()
    const { searchParams } = new URL(req.url)
    const licenseId = parseInt(searchParams.get('license_id') || '', 10)

    if (Number.isFinite(licenseId) && licenseId > 0) {
      const lic = await query<License>(`SELECT * FROM licenses WHERE id = $1 LIMIT 1`, [licenseId])
      if (!lic.rows[0]) return NextResponse.json({ error: 'License not found' }, { status: 404 })
      const l = lic.rows[0]
      const summary = pcSummary(l.plan_type, (l as any).max_allowed_connections)
      const { rows: history } = await query(
        `SELECT * FROM pc_addons WHERE license_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [licenseId],
      )
      return NextResponse.json({
        license: {
          id: l.id,
          key: l.key,
          business_name: l.business_name,
          owner_name: l.owner_name,
          city: l.city,
          plan_type: l.plan_type,
          status: l.status,
          ...summary,
        },
        history,
      })
    }

    const history = await getRecentPcAddons(20)
    return NextResponse.json({ history })
  } catch (err: any) {
    console.error('[GET /api/pc-connections]', err)
    return NextResponse.json({ error: 'Failed to load PC connections' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const licenseId = parseInt(String(body?.license_id ?? ''), 10)
  const mode = String(body?.mode ?? 'add').trim().toLowerCase() // 'add' | 'set'
  const pcs = Math.floor(Number(body?.pcs))
  const amountPaid = body?.amount_paid === null || body?.amount_paid === undefined || body?.amount_paid === ''
    ? null
    : Number(body.amount_paid)
  const notes = body?.notes ? String(body.notes).slice(0, 500) : null

  if (!Number.isFinite(licenseId) || licenseId <= 0) {
    return NextResponse.json({ error: 'license_id is required' }, { status: 400 })
  }
  if (!Number.isFinite(pcs) || pcs <= 0) {
    return NextResponse.json({ error: 'pcs must be a positive number' }, { status: 400 })
  }
  if (mode !== 'add' && mode !== 'set') {
    return NextResponse.json({ error: "mode must be 'add' or 'set'" }, { status: 400 })
  }
  if (amountPaid !== null && (!Number.isFinite(amountPaid) || amountPaid < 0)) {
    return NextResponse.json({ error: 'amount_paid must be a non-negative number' }, { status: 400 })
  }

  try {
    await ensurePcTables()
    const lic = await query<License>(`SELECT * FROM licenses WHERE id = $1 LIMIT 1`, [licenseId])
    const l = lic.rows[0]
    if (!l) return NextResponse.json({ error: 'License not found' }, { status: 404 })

    const plan = normalizePlan(l.plan_type)
    if (!canAddExtraPcs(plan)) {
      return NextResponse.json(
        { error: `Lite plan is single-PC only — upgrade to Pro to add PC connections.` },
        { status: 400 },
      )
    }

    const base = basePcsFor(plan)
    const current = Number((l as any).max_allowed_connections ?? base) > 0
      ? Math.floor(Number((l as any).max_allowed_connections ?? base))
      : base
    const requested = mode === 'add' ? current + pcs : pcs
    const total = clampTotal(plan, requested)
    if (total > PC_MAX_TOTAL) {
      return NextResponse.json({ error: `PC ceiling is ${PC_MAX_TOTAL} per license.` }, { status: 400 })
    }
    const addedPcs = total - current
    if (addedPcs === 0 && mode === 'set') {
      return NextResponse.json({ error: `License already has ${current} PC(s).` }, { status: 400 })
    }

    const updated = await query<License>(
      `UPDATE licenses SET max_allowed_connections = $1 WHERE id = $2 RETURNING *`,
      [total, licenseId],
    )
    const u = updated.rows[0] as License

    const { rows: logRows } = await query(
      `INSERT INTO pc_addons
         (license_id, license_key, added_pcs, total_after, amount_paid, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'admin')
       RETURNING *`,
      [licenseId, u.key, addedPcs, total, amountPaid, notes],
    )

    // Notify open dashboards / SSE listeners that this key's PC grant changed.
    try {
      const normalizedKey = (u.key || '').trim().toUpperCase()
      broadcast(normalizedKey, 'pc_change', {
        key: normalizedKey,
        max_allowed_connections: total,
        pc_total: total,
        pc_base: base,
        pc_extra: Math.max(0, total - base),
        message: `PC connections updated to ${total}.`,
      })
    } catch { /* best-effort */ }

    return NextResponse.json({
      ok: true,
      license: {
        id: u.id,
        key: u.key,
        business_name: u.business_name,
        ...pcSummary(plan, total),
      },
      addon: logRows[0] ?? null,
    })
  } catch (err: any) {
    console.error('[POST /api/pc-connections]', err)
    return NextResponse.json({ error: 'Failed to update PC connections' }, { status: 500 })
  }
}
