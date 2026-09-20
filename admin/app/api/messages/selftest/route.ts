import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { broadcast, pollEvents, getHighWaterMark } from '@/lib/sse'

/**
 * GET /api/messages/selftest?key=<LICENSE> — admin only.
 *
 * Proves the SERVER delivery path without needing the desktop client:
 * writes a probe event to this key's SSE channel, then reads it back
 * through the same pollEvents() path the stream endpoint uses.
 *
 * Uses event name 'sse_selftest' (NOT 'urgent_message') so connected
 * terminals ignore it — no popup appears on the owner's screen.
 *
 * Response:
 * { ok: true, channel, event_id, round_trip_ms } → server path proven,
 *   any remaining gap is in the software (stream URL / listener).
 * { ok: false, stage, error } → server/DB problem, fix before blaming client.
 */
export async function GET(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized — admin login required' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const key = (searchParams.get('key') || '').trim().toUpperCase()
  if (!key) {
    return NextResponse.json({ ok: false, error: 'key query param required' }, { status: 400 })
  }

  const started = Date.now()
  try {
    const highWater = await getHighWaterMark(key)

    const probe = { probe: 'ping', at: new Date().toISOString() }
    await broadcast(key, 'sse_selftest', probe)

    const events = await pollEvents(key, highWater)
    const found = events.find(e => e.event === 'sse_selftest')

    if (!found) {
      return NextResponse.json({
        ok: false,
        stage: 'read_back',
        channel: key,
        error: 'Probe was broadcast but pollEvents() could not read it back. Check DB + Vercel logs for [SSE] errors.',
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      channel: key,
      event_id: found.id,
      round_trip_ms: Date.now() - started,
      message: 'Server path proven: broadcast → sse_events → poll. If the terminal still shows nothing, the gap is in the software (stream connection or urgent_message listener).',
    })
  } catch (err: any) {
    console.error('[SELFTEST]', err)
    return NextResponse.json({ ok: false, stage: 'exception', error: err?.message || 'Self-test failed' }, { status: 500 })
  }
}
