-- SSE events table for cross-process real-time messaging.
-- Run this ONCE in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS sse_events (
  id BIGSERIAL PRIMARY KEY,
  channel TEXT NOT NULL,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sse_events_channel ON sse_events(channel, id);

-- Cleanup function: delete events older than 5 minutes
CREATE OR REPLACE FUNCTION cleanup_sse_events() RETURNS void AS $$
BEGIN
  DELETE FROM sse_events WHERE created_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;
