import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { listUnlockKeys, normalizeLockCode } from '@/lib/unlockKeys'

// Admin-only: list generated keys (optionally filtered by lock code).
export async function GET(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const lock = searchParams.get('lock_code') || undefined

  try {
    const keys = await listUnlockKeys(lock ? normalizeLockCode(lock) : undefined)
    return NextResponse.json(keys)
  } catch (e: any) {
    console.error('[GET /api/unlock/history]', e)
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
  }
}
