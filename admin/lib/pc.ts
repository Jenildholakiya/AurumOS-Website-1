/**
 * lib/pc.ts — PC-connection (multi-PC seat) helpers.
 *
 * Model:
 *   total_pcs = base_pcs(plan) + extra_pcs(purchased)
 *   licenses.max_allowed_connections stores the TOTAL.
 *   pc_addons logs every grant so the admin can see who bought what, when.
 *
 * Extra PCs are granted by the admin; the total is stored on the license.
 * The jeweller (brain server) reads `max_allowed_connections` from
 * /api/check, /api/nexus/handshake or GET /api/public/pc-connections?key=…
 * and caps its LAN client count to that number.
 */

import { query } from '@/lib/db'
import {
  normalizePlan,
  basePcsFor,
  canAddExtraPcs,
  PC_MAX_TOTAL,
  type PlanId,
} from '@/lib/plans'

export { basePcsFor, canAddExtraPcs, PC_MAX_TOTAL }
export type { PlanId }

export interface PcAddon {
  id: number
  license_id: number
  license_key: string | null
  added_pcs: number
  total_after: number
  amount_paid: number | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface PcSummary {
  total: number
  base: number
  extra: number
  plan: PlanId
  locked: boolean // true on Lite — extra PCs not allowed
}

export function pcSummary(
  planRaw: string | null | undefined,
  total: number | null | undefined,
): PcSummary {
  const plan = normalizePlan(planRaw)
  const base = basePcsFor(plan)
  const raw = Number(total ?? base)
  const safeTotal = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : base
  return {
    total: safeTotal,
    base,
    extra: Math.max(0, safeTotal - base),
    plan,
    locked: !canAddExtraPcs(plan),
  }
}

/** Clamp a requested total into [base, PC_MAX_TOTAL]. Lite is pinned to 1. */
export function clampTotal(
  planRaw: string | null | undefined,
  requested: number,
): number {
  const plan = normalizePlan(planRaw)
  const base = basePcsFor(plan)
  if (!canAddExtraPcs(plan)) return base
  const n = Math.floor(Number(requested))
  if (!Number.isFinite(n)) return base
  return Math.min(PC_MAX_TOTAL, Math.max(base, n))
}

export async function ensurePcTables(): Promise<void> {
  await query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS max_allowed_connections INT DEFAULT 1`)
  await query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS allow_rebind BOOLEAN DEFAULT false`)
  await query(`
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
    )
  `)
  await query(`CREATE INDEX IF NOT EXISTS idx_pc_addons_license ON pc_addons(license_id)`)
}

export async function getPcHistory(licenseId: number): Promise<PcAddon[]> {
  await ensurePcTables()
  const { rows } = await query<PcAddon>(
    `SELECT * FROM pc_addons WHERE license_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [licenseId],
  )
  return rows
}

export async function getRecentPcAddons(limit = 20): Promise<PcAddon[]> {
  await ensurePcTables()
  const { rows } = await query<PcAddon>(
    `SELECT * FROM pc_addons ORDER BY created_at DESC LIMIT $1`,
    [Math.min(100, Math.max(1, limit))],
  )
  return rows
}
