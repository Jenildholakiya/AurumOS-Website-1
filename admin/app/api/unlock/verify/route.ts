import { NextRequest, NextResponse } from 'next/server'
import {
  getUnlockKeyByKey,
  consumeUnlockKey,
  normalizeLockCode,
} from '@/lib/unlockKeys'

/**
 * PUBLIC endpoint — the AurumOS client calls this to validate an unlock key.
 * It is exempt from session auth in middleware.ts.
 *
 * Body: { lock_code?: string, key: string }
 * - 404  key not found
 * - 400  key does not match the supplied device lock
 * - 410  key already used (one-time enforcement)
 * - 200  valid → key is now spent and cannot be reused
 */
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const k = (body?.key || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!k) {
    return NextResponse.json({ error: 'key is required' }, { status: 400 })
  }

  try {
    const rec = await getUnlockKeyByKey(k)
    if (!rec) {
      return NextResponse.json(
        { valid: false, error: 'Unrecognized unlock key' },
        { status: 404 }
      )
    }

    // Optional device-lock cross-check.
    if (body?.lock_code && normalizeLockCode(body.lock_code) !== rec.lock_code) {
      return NextResponse.json(
        { valid: false, error: 'Key does not match this device lock', key_type: rec.key_type },
        { status: 400 }
      )
    }

    if (rec.status === 'used') {
      return NextResponse.json(
        {
          valid:  false,
          reused: true,
          key_type: rec.key_type,
          error:  'This unlock key has already been used and cannot be reused',
        },
        { status: 410 }
      )
    }

    // Spend it. If a concurrent call already spent it, this returns null.
    const spent = await consumeUnlockKey(rec)
    if (!spent) {
      return NextResponse.json(
        {
          valid:  false,
          reused: true,
          key_type: rec.key_type,
          error:  'This unlock key has already been used and cannot be reused',
        },
        { status: 410 }
      )
    }

    return NextResponse.json({
      valid:    true,
      key_type: rec.key_type,
      message:  'Unlock authorized. This key is now spent and cannot be reused.',
    })
  } catch (e: any) {
    console.error('[POST /api/unlock/verify]', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
