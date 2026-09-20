import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { query } from '@/lib/db'

export interface MintAttempt {
  id: number
  ip: string
  ok: boolean
  stage: string
  payment_id: string | null
  order_id: string | null
  created_at: string
}

/**
 * GET /api/payments/attempts — mint diagnostics for the dashboard.
 * Admin session only (401 JSON when logged out). Shows the last 50 calls to
 * POST /api/public/mint-license, successes AND failures, so a purchase that
 * never became a license still shows up with its exact reason.
 */
export async function GET(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // NOTE: no DDL here — mint_attempts is ensured by POST /api/public/mint-license
    // on every mint (the write path), so the read path stays DDL-free.
    // The two reads are independent — one batch, not sequential round-trips.
    const [rowsRes, aggRes] = await Promise.all([
      query<MintAttempt>(
        `SELECT * FROM mint_attempts ORDER BY created_at DESC LIMIT 50`
      ),
      query<{ total: string; ok_count: string; fail_count: string }>(
        `SELECT COUNT(*)::text AS total,
                COUNT(CASE WHEN ok THEN 1 END)::text AS ok_count,
                COUNT(CASE WHEN NOT ok THEN 1 END)::text AS fail_count
           FROM mint_attempts`
      ),
    ])
    const rows = rowsRes.rows
    const a = aggRes.rows[0]
    return NextResponse.json({
      ok: true,
      rows: rows ?? [],
      summary: {
        total: Number(a?.total ?? 0),
        ok: Number(a?.ok_count ?? 0),
        failed: Number(a?.fail_count ?? 0),
      },
    })
  } catch (err: unknown) {
    // Fresh DB with no mints yet: answer empty instead of 500.
    if ((err as { code?: string })?.code === '42P01') {
      return NextResponse.json({
        ok: true,
        rows: [],
        summary: { total: 0, ok: 0, failed: 0 },
      })
    }
    console.error('[GET /api/payments/attempts] failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false, error: 'Failed to fetch attempts.' }, { status: 500 })
  }
}
