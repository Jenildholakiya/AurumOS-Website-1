import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { broadcast } from '@/lib/sse'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/subscription/expire
 *
 * Immediately expire a subscription by setting subscription_expires_at to now().
 * The client software will see 'expired' status on next check.
 *
 * Body: { id: number } or { key: string }
 */
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { id, key: rawKey } = body
  const key = rawKey ? String(rawKey).trim().toUpperCase() : null

  if (!id && !key) {
    return NextResponse.json({ ok: false, error: 'Missing id or key' }, { status: 400 })
  }

  try {
    // Find the license
    let queryBuilder = supabase
      .from('licenses')
      .select('id, key, status, subscription_expires_at')

    if (id) {
      queryBuilder = queryBuilder.eq('id', id)
    } else {
      queryBuilder = queryBuilder.ilike('key', key!)
    }

    const { data: lic, error: fetchError } = await queryBuilder.single()

    if (fetchError || !lic) {
      return NextResponse.json({ ok: false, error: 'License not found' }, { status: 404 })
    }

    const previousExpiry = lic.subscription_expires_at

    // Immediately expire: set subscription_expires_at to now()
    const { error: updateError } = await supabase
      .from('licenses')
      .update({
        subscription_expires_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', lic.id)

    if (updateError) {
      console.error('[EXPIRE] Update failed:', updateError)
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 })
    }

    // Verify the update persisted
    const { data: verified, error: verifyError } = await supabase
      .from('licenses')
      .select('subscription_expires_at, updated_at')
      .eq('id', lic.id)
      .single()

    if (verifyError || !verified?.subscription_expires_at) {
      return NextResponse.json({ ok: false, error: 'Expiry failed — DB update did not persist' }, { status: 500, headers: cors() })
    }

    // Broadcast via SSE so connected clients get notified immediately
    const normalizedKey = lic.key.trim().toUpperCase()
    broadcast(normalizedKey, 'subscription_expired', {
      key: normalizedKey,
      subscription_expires_at: verified.subscription_expires_at,
      message: 'Subscription has been expired immediately.',
    })

    return NextResponse.json({
      ok: true,
      key: normalizedKey,
      subscription_expires_at: verified.subscription_expires_at,
      previous_expiry: previousExpiry,
      updated_at: verified.updated_at,
    }, { headers: cors() })

  } catch (err: any) {
    console.error('[EXPIRE]', err)
    return NextResponse.json({ ok: false, error: err.message || 'Expiry failed' }, { status: 500 })
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
