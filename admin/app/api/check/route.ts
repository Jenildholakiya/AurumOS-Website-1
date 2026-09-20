import { NextRequest, NextResponse } from 'next/server'
import { checkLicense } from '@/lib/license' 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { key, machine_id } = body

    if (!key || !machine_id) {
      return NextResponse.json(
        { valid: false, status: 'bad_request' },
        { status: 400 }
      )
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
               || req.headers.get('x-real-ip')
               || 'unknown'

    const result = await checkLicense(
      String(key).trim().toUpperCase(),
      String(machine_id).trim(),
      ip
    )

    console.log('[API CHECK] Sending to Software:', result)

    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control':                'no-store',
      }
    })

  } catch (e) {
    console.error('[CHECK] Error:', e)
    // Fail CLOSED at the API, but use a distinct status (not `valid:true`) so the
    // client can fall back to its cached grace window instead of being unlocked
    // on a server error.
    return NextResponse.json(
      { valid: false, status: 'server_error', message: 'License server error. Please try again shortly.' },
      { status: 200 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}

// ⚠️ IMPORTANT: 
// Do NOT put "export async function checkLicense" down here! 
// It must live in lib/license.ts.