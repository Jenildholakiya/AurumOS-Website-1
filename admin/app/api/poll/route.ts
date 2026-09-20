import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * POST /api/poll
 *
 * Ultra-lightweight change-detection endpoint. The client calls this every
 * 5-10 seconds with its last-known updated_at timestamp. Returns whether
 * the license has changed since then.
 *
 * Body: { key: string, updated_at?: string }
 *
 * Response:
 * {
 *   changed: boolean,         ← true = client must re-fetch via /api/check
 *   updated_at: string,       ← current timestamp from DB
 *   status: string,           ← current status for instant UI update
 * }
 */
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ changed: true, error: 'bad_request' }, { headers: cors() })
  }

  const { key: rawKey, updated_at: clientTimestamp } = body
  const key = rawKey ? String(rawKey).trim().toUpperCase() : null

  if (!key) {
    return NextResponse.json({ changed: true, error: 'key required' }, { headers: cors() })
  }

  try {
    const { rows } = await query<{ status: string; updated_at: string }>(
      `SELECT status, updated_at::text FROM licenses WHERE UPPER(TRIM(key)) = $1 LIMIT 1`,
      [key]
    )

    if (!rows.length) {
      return NextResponse.json({ changed: true, status: 'not_found' }, { headers: cors() })
    }

    const row = rows[0]
    const changed = !clientTimestamp || row.updated_at !== clientTimestamp

    return NextResponse.json({
      changed,
      updated_at: row.updated_at,
      status: row.status,
    }, { headers: cors() })
  } catch (err: any) {
    console.error('[POLL]', err)
    return NextResponse.json({ changed: true, status: 'error' }, { headers: cors() })
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
