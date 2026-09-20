-- Urgent messages from admin to jeweller owners (clients).
-- Run this ONCE in Supabase SQL Editor (or it auto-creates via ensure table).
--
-- NOTE v2: target_mode now stores 'all' | 'one' | 'many' (targeted sends).
-- If you already ran v1 of this file, re-run the ALTER lines below once —
-- otherwise targeted sends fail the old CHECK. (The app also self-heals
-- this automatically via ensureMessagesTable, so re-running is optional.)

CREATE TABLE IF NOT EXISTS urgent_messages (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'critical')),
  target_mode TEXT NOT NULL DEFAULT 'selected' CHECK (target_mode IN ('all', 'one', 'many', 'selected')),
  target_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_urgent_messages_created ON urgent_messages(created_at DESC);

-- v1 → v2 heal (safe to run even if v1 was never applied):
ALTER TABLE urgent_messages DROP CONSTRAINT IF EXISTS urgent_messages_target_mode_check;
ALTER TABLE urgent_messages DROP CONSTRAINT IF EXISTS urgent_messages_priority_check;
