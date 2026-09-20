-- Subscription system migration
-- Run this ONCE to add subscription tracking columns to the licenses table.
-- Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;

-- Backfill existing active licenses: set subscription_expires_at = created_at + duration_days
-- This gives legacy licenses a subscription window based on their original duration.
UPDATE licenses
SET subscription_expires_at = created_at + (duration_days || ' days')::interval
WHERE subscription_expires_at IS NULL
  AND status = 'active'
  AND duration_days > 0;

-- For perpetual licenses (duration_days = 0 or NULL), set 1-year from now
UPDATE licenses
SET subscription_expires_at = NOW() + INTERVAL '1 year'
WHERE subscription_expires_at IS NULL
  AND status = 'active'
  AND (duration_days = 0 OR duration_days IS NULL);

-- Mark subscription_started_at for legacy rows
UPDATE licenses
SET subscription_started_at = created_at
WHERE subscription_started_at IS NULL;

-- Verify
SELECT id, key, plan_type, duration_days, subscription_expires_at, subscription_started_at, status
FROM licenses
ORDER BY created_at DESC
LIMIT 20;
