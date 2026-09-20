import { NextRequest } from 'next/server'
import { subscribe, pollEvents, getHighWaterMark, cleanupOldEvents } from '@/lib/sse'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = (searchParams.get('key') || '').trim().toUpperCase()
  if (!key) {
    return new Response(JSON.stringify({ error: 'key query param required' }), { status: 400 })
  }

  const encoder = new TextEncoder()
  let alive = true

  // Get starting high-water mark (skip old events)
  let highWaterId = await getHighWaterMark(key)

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: any) => {
        if (!alive) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      // Send connected event
      send('connected', { status: 'connected', server_time: Date.now() })

      // Heartbeat every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        if (!alive) return clearInterval(heartbeat)
        try { controller.enqueue(encoder.encode(': heartbeat\n\n')) } catch {}
      }, 15000)

      // Subscribe to in-memory events (fast path for local dev)
      const unsub = subscribe(key, send)
      const unsubGlobal = subscribe('*', send)

      // Poll database every 2 seconds (for Vercel cross-process events)
      const pollInterval = setInterval(async () => {
        if (!alive) return clearInterval(pollInterval)
        try {
          const events = await pollEvents(key, highWaterId)
          for (const evt of events) {
            send(evt.event, evt.data)
            highWaterId = evt.id
          }

          // Also poll the '*' channel for global broadcasts
          const globalEvents = await pollEvents('*', highWaterId)
          for (const evt of globalEvents) {
            send(evt.event, evt.data)
            highWaterId = evt.id
          }
        } catch {}
      }, 2000)

      // Cleanup old events every 60s
      const cleanupInterval = setInterval(() => {
        if (!alive) return clearInterval(cleanupInterval)
        cleanupOldEvents()
      }, 60000)

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        alive = false
        clearInterval(heartbeat)
        clearInterval(pollInterval)
        clearInterval(cleanupInterval)
        unsub()
        unsubGlobal()
        try { controller.close() } catch {}
      })
    },
    cancel() { alive = false },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}
