/**
 * lib/sse.ts — Real-time pub/sub backed by Postgres.
 *
 * Works on Vercel (serverless) because all Lambda instances share the
 * same Postgres database. Events are written to `sse_events` table and
 * polled by connected SSE clients.
 */

import { query } from '@/lib/db'

export type Listener = (event: string, data: any) => void

// In-memory listeners for the CURRENT process (fast path for local dev)
const localListeners = new Map<string, Set<Listener>>()

// Track last-seen event ID per channel for polling
const lastSeenId = new Map<string, number>()

let _sseEnsured = false

/**
 * Self-healing: the sse_events table only existed if someone ran the
 * migration SQL or hit /api/setup-db. Without it, broadcast() silently
 * swallowed the INSERT failure and messages were "saved but never arrived".
 */
export async function ensureSseTable(): Promise<void> {
  if (_sseEnsured) return
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS sse_events (
        id BIGSERIAL PRIMARY KEY,
        channel TEXT NOT NULL,
        event TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sse_events_channel ON sse_events(channel, id);
    `)
    _sseEnsured = true
  } catch (err) {
    console.error('[SSE] ensureSseTable failed:', err)
  }
}

export function subscribe(key: string, listener: Listener): () => void {
  if (!localListeners.has(key)) localListeners.set(key, new Set())
  localListeners.get(key)!.add(listener)
  return () => {
    localListeners.get(key)?.delete(listener)
    if (localListeners.get(key)?.size === 0) localListeners.delete(key)
  }
}

/**
 * Broadcast an event. Writes to BOTH:
 * 1. In-memory map (instant, for same-process listeners — local dev)
 * 2. Postgres sse_events table (for cross-process listeners — Vercel)
 */
export async function broadcast(key: string, event: string, data: any) {
  // 1. Fast path: notify in-memory listeners (same process)
  const subs = localListeners.get(key)
  if (subs) {
    Array.from(subs).forEach(fn => {
      try { fn(event, data) } catch {}
    })
  }

  // 2. Slow path: write to database for other processes (Vercel)
  try {
    await ensureSseTable()
    await query(
      `INSERT INTO sse_events (channel, event, payload) VALUES ($1, $2, $3)`,
      [key, event, JSON.stringify(data)]
    )
  } catch (err) {
    console.error('[SSE] Failed to write event to database:', err)
  }
}

/**
 * Poll for new events from the database since a given event ID.
 * Returns new events and updates the high-water mark.
 */
export async function pollEvents(channel: string, sinceId: number): Promise<{ id: number; event: string; data: any }[]> {
  try {
    await ensureSseTable()
    const { rows } = await query<{ id: number; event: string; payload: any }>(
      `SELECT id, event, payload FROM sse_events
       WHERE channel = $1 AND id > $2
       ORDER BY id ASC
       LIMIT 50`,
      [channel, sinceId]
    )

    if (rows.length > 0) {
      lastSeenId.set(channel, rows[rows.length - 1].id)
    }

    return rows.map(r => ({
      id: Number(r.id),
      event: r.event,
      data: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
    }))
  } catch (err) {
    console.error('[SSE] Poll failed:', err)
    return []
  }
}

/**
 * Get the current high-water mark for a channel.
 * Used when starting a new SSE connection.
 */
export async function getHighWaterMark(channel: string): Promise<number> {
  // Check local cache first
  const cached = lastSeenId.get(channel)
  if (cached !== undefined) return cached

  try {
    await ensureSseTable()
    const { rows } = await query<{ max_id: string | null }>(
      `SELECT COALESCE(MAX(id), 0)::text as max_id FROM sse_events WHERE channel = $1`,
      [channel]
    )
    const id = parseInt(rows[0]?.max_id || '0')
    lastSeenId.set(channel, id)
    return id
  } catch {
    return 0
  }
}

/**
 * Cleanup old events (call periodically or from a cron job).
 */
export async function cleanupOldEvents(): Promise<void> {
  try {
    await query(`DELETE FROM sse_events WHERE created_at < NOW() - INTERVAL '5 minutes'`)
  } catch {}
}

// Export broadcastAll for convenience (broadcasts to all known channels)
export function broadcastAll(event: string, data: any) {
  // In-memory broadcast to all channels
  Array.from(localListeners.values()).forEach(subs => {
    Array.from(subs).forEach(fn => {
      try { fn(event, data) } catch {}
    })
  })

  // Also write to '*' channel in database
  try {
    query(
      `INSERT INTO sse_events (channel, event, payload) VALUES ($1, $2, $3)`,
      ['*', event, JSON.stringify(data)]
    )
  } catch {}
}
