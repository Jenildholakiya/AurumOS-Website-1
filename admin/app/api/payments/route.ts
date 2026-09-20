import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/payments — sales ledger for the dashboard.
 * Admin session only.
 *
 * ?source=online (default): licenses with payment_id set (website auto-mint).
 * ?source=manual:           licenses with payment_id NULL (admin Generate Key).
 * Query: ?source=&q=&plan=lite|pro|enterprise&software=wholesale|retail
 *        &from=YYYY-MM-DD&to=YYYY-MM-DD&limit=&offset=
 * Returns: { ok, rows, total, summary:{orders,revenue,this_month_orders,
 *            this_month_revenue,by_plan:{lite,pro,enterprise}} }
 */
export async function GET(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // NOTE: no DDL here — schema lives in POST /api/setup-db (one-time,
    // admin-triggered). ALTER TABLE on every read added 4 sequential
    // round-trips to each dashboard view / tab switch.
    const sp = req.nextUrl.searchParams
    const source = (sp.get('source') ?? '').trim().toLowerCase() === 'manual' ? 'manual' : 'online'
    const match = source === 'manual' ? `payment_id IS NULL` : `payment_id IS NOT NULL`
    const q = (sp.get('q') ?? '').trim()
    const plan = (sp.get('plan') ?? '').trim().toLowerCase()
    const software = (sp.get('software') ?? '').trim().toLowerCase()
    const from = (sp.get('from') ?? '').trim()
    const to = (sp.get('to') ?? '').trim()
    const limit = Math.min(Math.max(parseInt(sp.get('limit') || '25', 10) || 25, 1), 100)
    const offset = Math.max(parseInt(sp.get('offset') || '0', 10) || 0, 0)

    const conds: string[] = [match]
    const params: any[] = []
    const push = (sql: string, val: any) => {
      params.push(val)
      conds.push(sql.replace('?', `$${params.length}`))
    }

    if (plan === 'lite' || plan === 'pro' || plan === 'enterprise') {
      push(`plan_type = ?`, plan)
    }
    if (software === 'wholesale' || software === 'retail') {
      push(`software_type = ?`, software)
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(from)) push(`created_at >= ?::date`, from)
    if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      params.push(to)
      conds.push(`created_at < ($${params.length}::date + interval '1 day')`)
    }
    if (q) {
      params.push(`%${q}%`)
      const n = params.length
      conds.push(
        `(business_name ILIKE $${n} OR owner_name ILIKE $${n} OR email ILIKE $${n} OR phone ILIKE $${n} OR key ILIKE $${n} OR payment_id ILIKE $${n} OR order_id ILIKE $${n})`
      )
    }
    const where = `WHERE ${conds.join(' AND ')}`

    // The three reads are independent — fire as one batch instead of three
    // sequential round-trips (this is the hot path for every tab switch).
    const [agg, month, rows] = await Promise.all([
      query<{
        orders: string
        revenue: string
        by_lite: string
        by_pro: string
        by_enterprise: string
      }>(
        `SELECT COUNT(*)::text AS orders,
                COALESCE(SUM(amount_paid), 0)::text AS revenue,
                COUNT(CASE WHEN plan_type = 'lite' THEN 1 END)::text AS by_lite,
                COUNT(CASE WHEN plan_type = 'pro' THEN 1 END)::text AS by_pro,
                COUNT(CASE WHEN plan_type = 'enterprise' THEN 1 END)::text AS by_enterprise
           FROM licenses ${where}`,
        params
      ),
      query<{ orders: string; revenue: string }>(
        `SELECT COUNT(*)::text AS orders, COALESCE(SUM(amount_paid), 0)::text AS revenue
           FROM licenses WHERE ${match}
             AND created_at >= DATE_TRUNC('month', NOW())`
      ),
      query(
        `SELECT * FROM licenses ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ])
    const total = Number(agg.rows[0]?.orders ?? 0)

    const a = agg.rows[0]
    const m = month.rows[0]
    return NextResponse.json({
      ok: true,
      rows: rows.rows ?? [],
      total,
      summary: {
        orders: Number(a?.orders ?? 0),
        revenue: Number(a?.revenue ?? 0),
        this_month_orders: Number(m?.orders ?? 0),
        this_month_revenue: Number(m?.revenue ?? 0),
        by_plan: {
          lite: Number(a?.by_lite ?? 0),
          pro: Number(a?.by_pro ?? 0),
          enterprise: Number(a?.by_enterprise ?? 0),
        },
      },
    })
  } catch (err: unknown) {
    // Fresh DB where setup-db was never run: answer empty instead of 500.
    const code = (err as { code?: string })?.code
    if (code === '42P01') {
      return NextResponse.json({
        ok: true,
        rows: [],
        total: 0,
        summary: {
          orders: 0,
          revenue: 0,
          this_month_orders: 0,
          this_month_revenue: 0,
          by_plan: { lite: 0, pro: 0, enterprise: 0 },
        },
      })
    }
    console.error('[GET /api/payments] failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false, error: 'Failed to fetch payments.' }, { status: 500 })
  }
}
