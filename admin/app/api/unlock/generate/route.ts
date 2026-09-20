import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import {
  generateUnlockKey,
  normalizeLockCode,
  UnlockKeyType,
} from '@/lib/unlockKeys'

// Admin-only: mints a new one-time unlock key and registers it.
export async function POST(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const lc = normalizeLockCode(body?.lock_code || '')
  if (lc.length < 6) {
    return NextResponse.json(
      { error: 'Lock code must be at least 6 characters' },
      { status: 400 }
    )
  }

  const keyType: UnlockKeyType = body?.type === 'bastion' ? 'bastion' : 'regular'

  try {
    const rec = await generateUnlockKey(lc, keyType)
    return NextResponse.json(
      {
        id:         rec.id,
        key:        rec.unlock_key,
        type:       rec.key_type,
        lock_code:  rec.lock_code,
        status:     rec.status,
        created_at: rec.created_at,
      },
      { status: 201 }
    )
  } catch (e: any) {
    console.error('[POST /api/unlock/generate]', e)
    return NextResponse.json({ error: 'Failed to generate key' }, { status: 500 })
  }
}
