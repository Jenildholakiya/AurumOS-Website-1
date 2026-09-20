import { query } from '@/lib/db'

export type MessagePriority = 'info' | 'warning' | 'critical'

export type MessageTargetMode = 'all' | 'one' | 'many'

export interface UrgentMessage {
  id: number
  title: string
  body: string
  priority: MessagePriority
  target_mode: MessageTargetMode
  target_keys: string[]
  target_count: number
  created_at: string
}

let _ensured = false

export async function ensureMessagesTable(): Promise<void> {
  if (_ensured) return
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS urgent_messages (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'info',
        target_mode TEXT NOT NULL DEFAULT 'selected',
        target_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
        target_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)
    // Heal tables created by the first migration, whose CHECK only allowed
    // ('all','selected') — targeted sends store 'one'/'many' and would
    // otherwise fail with "Failed to save message".
    await query(`ALTER TABLE urgent_messages ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''`)
    await query(`ALTER TABLE urgent_messages ADD COLUMN IF NOT EXISTS body TEXT NOT NULL DEFAULT ''`)
    await query(`ALTER TABLE urgent_messages ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'info'`)
    await query(`ALTER TABLE urgent_messages ADD COLUMN IF NOT EXISTS target_mode TEXT NOT NULL DEFAULT 'selected'`)
    await query(`ALTER TABLE urgent_messages ADD COLUMN IF NOT EXISTS target_keys JSONB NOT NULL DEFAULT '[]'::jsonb`)
    await query(`ALTER TABLE urgent_messages ADD COLUMN IF NOT EXISTS target_count INT NOT NULL DEFAULT 0`)
    await query(`ALTER TABLE urgent_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`)
    await query(`ALTER TABLE urgent_messages DROP CONSTRAINT IF EXISTS urgent_messages_target_mode_check`)
    await query(`ALTER TABLE urgent_messages DROP CONSTRAINT IF EXISTS urgent_messages_priority_check`)
    await query(`CREATE INDEX IF NOT EXISTS idx_urgent_messages_created ON urgent_messages(created_at DESC)`)
    _ensured = true
  } catch (err) {
    console.error('[DB] ensureMessagesTable failed:', err)
  }
}

export async function getRecentMessages(limit = 20): Promise<UrgentMessage[]> {
  await ensureMessagesTable()
  const { rows } = await query<UrgentMessage>(
    `SELECT id, title, body, priority, target_mode,
            COALESCE(target_keys, '[]'::jsonb) AS target_keys,
            target_count, created_at::text AS created_at
       FROM urgent_messages
      ORDER BY created_at DESC
      LIMIT $1`,
    [limit]
  )
  return rows.map(r => ({
    ...r,
    id: Number(r.id),
    target_keys: Array.isArray(r.target_keys) ? r.target_keys : [],
  }))
}

export async function saveMessage(input: {
  title: string
  body: string
  priority: MessagePriority
  target_mode: MessageTargetMode
  target_keys: string[]
  target_count?: number
}): Promise<UrgentMessage> {
  await ensureMessagesTable()
  const count = input.target_count ?? input.target_keys.length
  const { rows } = await query<UrgentMessage>(
    `INSERT INTO urgent_messages (title, body, priority, target_mode, target_keys, target_count)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)
     RETURNING id, title, body, priority, target_mode, target_keys, target_count, created_at::text AS created_at`,
    [
      input.title,
      input.body,
      input.priority,
      input.target_mode,
      JSON.stringify(input.target_keys),
      count,
    ]
  )
  const r = rows[0]
  return { ...r, id: Number(r.id), target_keys: Array.isArray(r.target_keys) ? r.target_keys : input.target_keys }
}

/**
 * Catch-up query for a desktop terminal. Returns messages addressed to
 * this license key (target_keys contains it) plus global 'all' broadcasts,
 * newest first, capped at `limit` (max 30).
 */
export async function getMessagesForKey(rawKey: string, limit = 30): Promise<UrgentMessage[]> {
  await ensureMessagesTable()
  const key = String(rawKey || '').trim().toUpperCase()
  const n = Math.min(Math.max(parseInt(String(limit)) || 30, 1), 30)
  const { rows } = await query<UrgentMessage>(
    `SELECT id, title, body, priority, target_mode,
            COALESCE(target_keys, '[]'::jsonb) AS target_keys,
            target_count, created_at::text AS created_at
       FROM urgent_messages
      WHERE target_mode = 'all'
         OR target_keys @> to_jsonb($1::text)
      ORDER BY created_at DESC
      LIMIT $2`,
    [key, n]
  )
  return rows.map(r => ({
    ...r,
    id: Number(r.id),
    target_keys: Array.isArray(r.target_keys) ? r.target_keys : [],
  }))
}

export interface DeletedMessage {
  id: number
  target_mode: string
  target_keys: string[]
}

/** Hard-delete one message. Returns its targets (for retract broadcast) or null. */
export async function deleteMessage(id: number): Promise<DeletedMessage | null> {
  await ensureMessagesTable()
  const { rows } = await query<{ id: string; target_mode: string; target_keys: any }>(
    `DELETE FROM urgent_messages WHERE id = $1
     RETURNING id, target_mode, COALESCE(target_keys, '[]'::jsonb) AS target_keys`,
    [id]
  )
  if (!rows.length) return null
  const r = rows[0]
  return {
    id: Number(r.id),
    target_mode: r.target_mode,
    target_keys: Array.isArray(r.target_keys) ? r.target_keys : [],
  }
}

/** Hard-delete ALL messages. Returns the deleted count. */
export async function clearAllMessages(): Promise<number> {
  await ensureMessagesTable()
  const { rows } = await query(`DELETE FROM urgent_messages RETURNING id`)
  return rows.length
}
