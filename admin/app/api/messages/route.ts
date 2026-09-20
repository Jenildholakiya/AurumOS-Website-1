import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { query } from '@/lib/db'
import { getLicenseByKey } from '@/lib/license'
import { broadcast } from '@/lib/sse'
import {
  ensureMessagesTable,
  saveMessage,
  deleteMessage,
  clearAllMessages,
  getRecentMessages,
  getMessagesForKey,
  type MessagePriority,
  type MessageTargetMode,
} from '@/lib/messages'

// Desktop WebView2 calls from origin "null" — without these the client is blocked.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors })
}

/**
 * GET /api/messages?key=<LICENSE>&limit=30 — terminal catch-up.
 * Key-auth like /api/subscription/status (NO admin session): the key is
 * verified against licenses; unknown keys get 404. Returns only messages
 * addressed to this key plus global 'all' broadcasts, newest first, max 30.
 *
 * GET /api/messages (no key) — admin dashboard history. Requires session.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawKey = searchParams.get('key')
  const limit = searchParams.get('limit')

  try {
    if (rawKey?.trim()) {
      const license = await getLicenseByKey(rawKey.trim().toUpperCase())
      if (!license) {
        return NextResponse.json({ ok: false, error: 'License key unrecognized' }, { status: 404, headers: cors })
      }
      const items = await getMessagesForKey(rawKey, limit ? parseInt(limit) : 30)
      return NextResponse.json({ ok: true, messages: items }, { headers: cors })
    }
    if (!await requireAuth(req)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: cors })
    }
    const items = await getRecentMessages(30)
    return NextResponse.json({ ok: true, messages: items }, { headers: cors })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to load messages' }, { status: 500, headers: cors })
  }
}

/**
 * POST /api/messages — admin only (session cookie required).
 *
 * Body: {
 *   title: string (required, max 120),
 *   body: string (required, max 1000),
 *   priority: 'info' | 'warning' | 'critical' (default 'info'),
 *   target_mode: 'all' | 'one' | 'many' ('selected' accepted as alias),
 *   target_keys?: string[]  (required unless target_mode === 'all')
 * }
 *
 * Delivery: broadcasts an `urgent_message` SSE event on the EXISTING
 * /api/nexus/stream (no new endpoint). one/many → ONLY each target key's
 * channel. all → '*' global channel AND each per-key channel (client
 * dedupes by id). Events stay replayable ~5 min via sse_events cleanup.
 * Never emits status_change for messages. Plain-text title/body only.
 */
export async function POST(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized — admin login required' }, { status: 401, headers: cors })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400, headers: cors })
  }

  const title = String(body?.title ?? '').trim().slice(0, 120)
  const msgBody = String(body?.body ?? '').trim().slice(0, 1000)
  const priority = (['info', 'warning', 'critical'].includes(body?.priority) ? body.priority : 'info') as MessagePriority
  const rawMode = String(body?.target_mode ?? 'selected').toLowerCase()

  if (!title) return NextResponse.json({ ok: false, error: 'Title is required' }, { status: 400, headers: cors })
  if (!msgBody) return NextResponse.json({ ok: false, error: 'Message body is required' }, { status: 400, headers: cors })

  await ensureMessagesTable()

  // Resolve target license keys (normalized, de-duplicated).
  let targetKeys: string[] = []
  let storedMode: MessageTargetMode
  if (rawMode === 'all') {
    storedMode = 'all'
    try {
      const { rows } = await query<{ key: string }>(
        `SELECT key FROM licenses WHERE status = 'active'`
      )
      targetKeys = Array.from(new Set(rows.map(r => String(r.key || '').trim().toUpperCase()).filter(Boolean)))
    } catch (err) {
      console.error('[MESSAGES] failed to resolve all clients:', err)
      return NextResponse.json({ ok: false, error: 'Could not resolve client list' }, { status: 500, headers: cors })
    }
    if (targetKeys.length === 0) {
      return NextResponse.json({ ok: false, error: 'No active clients to message' }, { status: 400, headers: cors })
    }
  } else if (['one', 'many', 'selected'].includes(rawMode)) {
    const raw = Array.isArray(body?.target_keys) ? body.target_keys : []
    targetKeys = Array.from(new Set(raw.map((k: any) => String(k || '').trim().toUpperCase()).filter(Boolean)))
    if (targetKeys.length === 0) {
      return NextResponse.json({ ok: false, error: 'Select at least one client' }, { status: 400, headers: cors })
    }
    if (targetKeys.length > 500) {
      return NextResponse.json({ ok: false, error: 'Too many targets (max 500)' }, { status: 400, headers: cors })
    }
    storedMode = targetKeys.length === 1 ? 'one' : 'many'
  } else {
    return NextResponse.json({ ok: false, error: "target_mode must be 'one', 'many' or 'all'" }, { status: 400, headers: cors })
  }

  const payload = {
    title,
    body: msgBody,
    priority,
    sent_at: new Date().toISOString(),
  }

  // Persist first so history survives even if broadcast hiccups.
  let saved
  try {
    saved = await saveMessage({ title, body: msgBody, priority, target_mode: storedMode, target_keys: targetKeys })
  } catch (err: any) {
    console.error('[MESSAGES] save failed:', err)
    const detail = err?.message || 'Failed to save message'
    return NextResponse.json({ ok: false, error: `Failed to save message: ${detail}` }, { status: 500, headers: cors })
  }

  // Broadcast on the EXISTING stream channels. one/many → per-key ONLY.
  // all → '*' global AND per-key (duplicates expected, client dedupes by id).
  try {
    if (storedMode === 'all') {
      await broadcast('*', 'urgent_message', { ...payload, id: saved.id, broadcast: 'all' })
    }
    const CHUNK = 25
    for (let i = 0; i < targetKeys.length; i += CHUNK) {
      const chunk = targetKeys.slice(i, i + CHUNK)
      await Promise.all(chunk.map(k => broadcast(k, 'urgent_message', { ...payload, id: saved.id, key: k })))
    }
  } catch (err) {
    console.error('[MESSAGES] broadcast failed (non-fatal):', err)
  }

  return NextResponse.json({ ok: true, id: saved.id, delivered_to: targetKeys.length, target_mode: storedMode }, { headers: cors })
}

/**
 * DELETE /api/messages?id=<ID> — admin only. Deletes one sent message and
 * broadcasts a `message_retract` event so terminals remove it live.
 *
 * DELETE /api/messages?all=true — admin only. Deletes ALL sent messages and
 * broadcasts `message_retract_all` so terminals clear their admin inbox.
 */
export async function DELETE(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized — admin login required' }, { status: 401, headers: cors })
  }

  const { searchParams } = new URL(req.url)

  try {
    if (searchParams.get('all') === 'true') {
      const n = await clearAllMessages()
      try {
        await broadcast('*', 'message_retract_all', { cleared_at: new Date().toISOString(), count: n })
      } catch (err) {
        console.error('[MESSAGES] retract-all broadcast failed (non-fatal):', err)
      }
      return NextResponse.json({ ok: true, deleted: n }, { headers: cors })
    }

    const id = parseInt(searchParams.get('id') || '')
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id query param required' }, { status: 400, headers: cors })
    }

    const gone = await deleteMessage(id)
    if (!gone) {
      return NextResponse.json({ ok: false, error: 'Message not found' }, { status: 404, headers: cors })
    }

    const payload = { id: gone.id, retracted_at: new Date().toISOString() }
    try {
      await broadcast('*', 'message_retract', payload)
      const CHUNK = 25
      for (let i = 0; i < gone.target_keys.length; i += CHUNK) {
        const chunk = gone.target_keys.slice(i, i + CHUNK)
        await Promise.all(chunk.map(k => broadcast(k, 'message_retract', { ...payload, key: k })))
      }
    } catch (err) {
      console.error('[MESSAGES] retract broadcast failed (non-fatal):', err)
    }

    return NextResponse.json({ ok: true, id: gone.id }, { headers: cors })
  } catch (err: any) {
    console.error('[MESSAGES] delete failed:', err)
    return NextResponse.json({ ok: false, error: `Delete failed: ${err?.message || 'unknown'}` }, { status: 500, headers: cors })
  }
}
