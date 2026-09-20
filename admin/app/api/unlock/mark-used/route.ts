import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { markUsedById } from '@/lib/unlockKeys'

// Admin-only: manually mark a key as used (e.g. client reported usage offline).
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

  const { id } = body || {}
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  try {
    const ok = await markUsedById(id)
    if (!ok) {
      return NextResponse.json(
        { error: 'Key already used or not found' },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[POST /api/unlock/mark-used]', e)
    return NextResponse.json({ error: 'Failed to mark key' }, { status: 500 })
  }
}
