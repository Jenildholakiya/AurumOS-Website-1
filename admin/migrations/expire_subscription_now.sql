-- Supabase RPC function: expire_subscription
-- Run this in the Supabase SQL Editor to create a server-side function.
-- Usage: SELECT expire_subscription(123);        -- by ID
--        SELECT expire_subscription(NULL, 'KEY');  -- by key

CREATE OR REPLACE FUNCTION expire_subscription(
  p_id BIGINT DEFAULT NULL,
  p_key TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  key TEXT,
  subscription_expires_at TIMESTAMPTZ,
  previous_expiry TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev TIMESTAMPTZ;
BEGIN
  -- Validate input
  IF p_id IS NULL AND p_key IS NULL THEN
    RAISE EXCEPTION 'Either p_id or p_key must be provided';
  END IF;

  -- Fetch current state
  IF p_id IS NOT NULL THEN
    SELECT l.subscription_expires_at INTO v_prev
    FROM licenses l WHERE l.id = p_id;
  ELSE
    SELECT l.subscription_expires_at INTO v_prev
    FROM licenses l WHERE UPPER(TRIM(l.key)) = UPPER(TRIM(p_key));
  END IF;

  IF v_prev IS NULL AND p_id IS NULL AND p_key IS NULL THEN
    RAISE EXCEPTION 'License not found';
  END IF;

  -- Expire immediately
  IF p_id IS NOT NULL THEN
    UPDATE licenses
    SET subscription_expires_at = now(),
        updated_at = now()
    WHERE id = p_id
    RETURNING licenses.id, licenses.key, licenses.subscription_expires_at,
              v_prev AS previous_expiry, licenses.updated_at
    INTO id, key, subscription_expires_at, previous_expiry, updated_at;
  ELSE
    UPDATE licenses
    SET subscription_expires_at = now(),
        updated_at = now()
    WHERE UPPER(TRIM(key)) = UPPER(TRIM(p_key))
    RETURNING licenses.id, licenses.key, licenses.subscription_expires_at,
              v_prev AS previous_expiry, licenses.updated_at
    INTO id, key, subscription_expires_at, previous_expiry, updated_at;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'License not found';
  END IF;

  RETURN NEXT;
END;
$$;
