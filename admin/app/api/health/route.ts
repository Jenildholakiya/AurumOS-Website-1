export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const url = process.env.POSTGRES_URL || ''
  const host = url.match(/@([^/:?]+)/)?.[1] || 'unknown'
  const isVercelManaged = url.includes('vercel-storage.com') || url.includes('internal postgres')

  const result: Record<string, any> = {
    db_host: host,
    is_vercel_managed_storage: isVercelManaged,
    tables: [],
    errors: [],
  }

  const pool = getPool()
  const client = await pool.connect()
  try {
    const tableRes = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    )
    result.tables = tableRes.rows.map((r: any) => r.table_name)

    if (result.tables.includes('licenses')) {
      const countRes = await client.query('SELECT COUNT(*)::int AS n FROM licenses')
      result.license_count = countRes.rows[0].n

      const colsRes = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'licenses' ORDER BY ordinal_position`
      )
      result.license_columns = colsRes.rows.map((r: any) => r.column_name)
    } else {
      result.errors.push('Table "licenses" does NOT exist. Run /api/setup-db to create it.')
    }
  } catch (err: any) {
    result.errors.push(err.message)
  } finally {
    client.release()
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
