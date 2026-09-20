-- PC-connection (multi-PC seat) support.
-- total_pcs = base(plan) + extra(purchased). The TOTAL lives on
-- licenses.max_allowed_connections; this log keeps the purchase history.
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS max_allowed_connections INT DEFAULT 1;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS allow_rebind BOOLEAN DEFAULT false;

-- Backfill: Lite/Pro base = 1, Enterprise base = 2 (only where still default/NULL).
UPDATE licenses SET max_allowed_connections = 1
 WHERE max_allowed_connections IS NULL OR max_allowed_connections < 1;
UPDATE licenses SET max_allowed_connections = 2
 WHERE LOWER(plan_type) = 'enterprise'
   AND (max_allowed_connections IS NULL OR max_allowed_connections < 2);

CREATE TABLE IF NOT EXISTS pc_addons (
  id BIGSERIAL PRIMARY KEY,
  license_id BIGINT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  license_key TEXT,
  added_pcs INT NOT NULL DEFAULT 0,
  total_after INT NOT NULL DEFAULT 1,
  amount_paid NUMERIC,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pc_addons_license ON pc_addons(license_id);
