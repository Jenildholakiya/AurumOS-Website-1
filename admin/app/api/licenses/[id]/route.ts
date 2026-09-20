import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { normalizePlan } from '@/lib/plans'

interface RouteContext {
  params: Promise<{ id: string }> | { id: string }
}

// ── PATCH: Used for Updating Trial / Status ──
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const params = await context.params
    const id = parseInt(params.id, 10)
    const body = await request.json()
    const { plan_type, duration_days, is_used, status, allow_rebind } = body

    await query(
      `UPDATE licenses
       SET plan_type = $1,
           duration_days = $2,
           is_used = $3,
           status = $4,
           allow_rebind = COALESCE($5, allow_rebind)
       WHERE id = $6`,
      [plan_type !== undefined ? normalizePlan(plan_type) : plan_type, duration_days, is_used, status, allow_rebind, id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Database Update Failed:', error)
    return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
  }
}

// ── DELETE: Used for Removing License ──
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const params = await context.params
    const licenseId = parseInt(params.id, 10)

    if (isNaN(licenseId)) {
      return NextResponse.json(
        { error: 'Invalid or missing configuration identifier signature.' },
        { status: 400 }
      )
    }

    const result = await query(
      `DELETE FROM licenses WHERE id = $1 RETURNING id, business_name`,
      [licenseId]
    )

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'License ledger target profile not found.' },
        { status: 404 }
      )
    }

    const deletedLicense = result.rows[0]

    return NextResponse.json({
      success: true,
      message: `Permanently unlinked license context for ${deletedLicense.business_name}.`
    })

  } catch (error: any) {
    console.error('[API DELETE ERROR] Failure inside licenses sub-route:', error)
    
    if (error.code === '23503') {
      return NextResponse.json(
        { 
          error: 'Dependency block: Cannot delete this license because dependent records depend on it.' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal system fault executing database row erasure matrix.' },
      { status: 500 }
    )
  }
}