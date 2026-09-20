-- Client document upload columns for KYC during license generation.
-- Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS identity_proof_url   TEXT,
  ADD COLUMN IF NOT EXISTS address_proof_url    TEXT,
  ADD COLUMN IF NOT EXISTS identity_proof_type  TEXT,
  ADD COLUMN IF NOT EXISTS address_proof_type   TEXT;

-- Verify
SELECT id, key, business_name, identity_proof_url, address_proof_url
FROM licenses
ORDER BY created_at DESC
LIMIT 10;
