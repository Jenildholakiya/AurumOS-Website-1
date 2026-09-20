/**
 * lib/plans.ts — Canonical subscription plan + feature catalog.
 *
 * Single source of truth for AurumOS tiers (LITE / PRO / ENTERPRISE) and the
 * features each tier unlocks. The admin portal assigns a plan to each license;
 * the external ERP calls /api/check, /api/nexus/handshake and /api/feature-check
 * to learn a license's plan + resolved feature list and locks its own UI.
 *
 * Tiers are CUMULATIVE: PRO includes every LITE feature, ENTERPRISE includes
 * every PRO feature — matching the pricing spec ("includes everything in …, plus:").
 */

export type PlanId = 'lite' | 'pro' | 'enterprise'

export type FeatureCategory =
  | 'core'
  | 'inventory'
  | 'accounts'
  | 'network'
  | 'printing'
  | 'security'
  | 'cloud'
  | 'support'

export interface Feature {
  id:          string
  label:       string
  description: string
  category:    FeatureCategory
  icon:        string
}

export interface Plan {
  id:          PlanId
  name:        string
  emoji:       string
  price:       number          // one-time onboarding (₹)
  yearly:      number          // annual renewal (₹/yr)
  billingNote: string          // human-readable price line
  accent:      string          // CSS color for badges/cards
  /** Feature ids added AT THIS TIER (before inheritance). */
  ownFeatures: string[]
}

// ── FEATURE CATALOG ────────────────────────────────────────────
// Keyed by feature id. `label` mirrors the plan spec bullet points.
export const FEATURES: Record<string, Feature> = {
  // LITE (core)
  local_mode:          { id: 'local_mode',          label: 'Single-PC local mode',            description: 'Standalone single-computer operation.',                       category: 'core',      icon: '🖥️' },
  billing_retail:      { id: 'billing_retail',      label: 'Billing & retail billing',        description: 'Core billing and retail invoicing.',                          category: 'core',      icon: '🧾' },
  stock_entry:         { id: 'stock_entry',         label: 'Weight stock entry + ledger',      description: 'Basic weight stock entry and stock ledger.',                   category: 'inventory', icon: '⚖️' },
  product_master:      { id: 'product_master',      label: 'Product master + categories',      description: 'Basic product master and category management.',               category: 'inventory', icon: '📦' },
  client_ledger:       { id: 'client_ledger',       label: 'Client ledger / outstanding',      description: 'Basic client ledger and outstanding tracking.',                category: 'accounts',  icon: '📒' },
  staff_login_lockout: { id: 'staff_login_lockout', label: 'Owner + 1 staff login, lockout',   description: 'Owner plus one staff login with lockout.',                     category: 'security',  icon: '🔒' },
  tag_printing_local:  { id: 'tag_printing_local',  label: 'Local tag printing',               description: 'Local tag printing on a basic printer.',                      category: 'printing',  icon: '🏷️' },
  scale_weighing:      { id: 'scale_weighing',      label: 'Scale weighing',                   description: 'Digital scale weighing integration.',                         category: 'inventory', icon: '⚖️' },
  sales_report_basic:  { id: 'sales_report_basic',  label: 'Basic sales report',               description: 'Basic sales reporting.',                                       category: 'core',      icon: '📊' },
  bastion_core:        { id: 'bastion_core',        label: 'Core Bastion security',            description: 'DB watchdog + lock screen.',                                   category: 'security',  icon: '🛡️' },

  // PRO (adds)
  lan_multi_pc:        { id: 'lan_multi_pc',        label: 'Multi-PC LAN network mode',        description: 'Brain server/client, discovery, handshake across a LAN.',      category: 'network',   icon: '🌐' },
  karigar_vouchers:    { id: 'karigar_vouchers',    label: 'Karigar / Katti vouchers',         description: 'Karigar/Katti vouchers + Uchak stock/inward.',                 category: 'inventory', icon: '🧰' },
  touch_groups:        { id: 'touch_groups',        label: 'Touch groups / touch ledger',      description: 'Touch groups, touch ledger and touch-stock report.',           category: 'inventory', icon: '✨' },
  full_accounts:       { id: 'full_accounts',       label: 'Full accounts',                    description: 'Journal, credit ledger, statements, customer purchases.',      category: 'accounts',  icon: '📚' },
  tag_audit:           { id: 'tag_audit',           label: 'Tag audit',                        description: 'Book vs scanned reconciliation.',                              category: 'inventory', icon: '🔍' },
  stock_med_reports:   { id: 'stock_med_reports',   label: 'Stock Med + advanced reports',     description: 'Stock Med, stagnant and low-stock reports.',                   category: 'inventory', icon: '📉' },
  tsc_network_printing:{ id: 'tsc_network_printing',label: 'TSC network printing',             description: 'TSC network label printing.',                                  category: 'printing',  icon: '🖨️' },
  multi_staff:         { id: 'multi_staff',         label: 'Multiple staff + sessions',        description: 'Multiple staff logins and concurrent sessions.',               category: 'security',  icon: '👥' },
  analytics_dashboard: { id: 'analytics_dashboard', label: 'Full analytics dashboard',         description: 'Full analytics dashboard and reporting.',                      category: 'core',      icon: '📈' },
  year_close:          { id: 'year_close',          label: 'Year close + archive',             description: 'Financial year close and archival.',                           category: 'accounts',  icon: '🗄️' },
  bastion_enhanced:    { id: 'bastion_enhanced',    label: 'Enhanced Bastion',                 description: 'Session guard, auto-healer, pattern learner, email alerts, forensic PDF.', category: 'security', icon: '🛡️' },

  // ENTERPRISE (adds)
  cloud_sync:          { id: 'cloud_sync',          label: 'Cloud sync engine',                description: 'Cross-shop sync with conflict resolution.',                    category: 'cloud',     icon: '☁️' },
  fleet_bastion:       { id: 'fleet_bastion',       label: 'Fleet Bastion intelligence',       description: 'Global signatures via bastion_sync / Supabase.',               category: 'cloud',     icon: '🛰️' },
  customer_loyalty:    { id: 'customer_loyalty',    label: 'Customer accounts + loyalty',      description: 'Customer accounts and loyalty programs.',                      category: 'accounts',  icon: '🎁' },
  bastion_ai:          { id: 'bastion_ai',          label: 'Advanced Bastion AI',              description: 'Cloud-brain behavioral detection.',                            category: 'security',  icon: '🤖' },
  nexus_management:    { id: 'nexus_management',    label: 'Remote admin / Nexus',             description: 'Nexus node management + live telemetry stream.',               category: 'network',   icon: '📡' },
  bridge_server:       { id: 'bridge_server',       label: 'Bridge server',                    description: 'Multi-location link via bridge server.',                       category: 'network',   icon: '🌉' },
  custom_db_location:  { id: 'custom_db_location',  label: 'Custom DB location + audit logs',  description: 'Custom database location and audit logs.',                     category: 'cloud',     icon: '🗃️' },
  priority_support:    { id: 'priority_support',    label: 'Priority support / SLA',           description: 'Priority support with SLA.',                                   category: 'support',   icon: '⭐' },
  api_integration:     { id: 'api_integration',     label: 'API / integration access',         description: 'API and third-party integration access.',                      category: 'support',   icon: '🔌' },
}

// ── PLAN DEFINITIONS ───────────────────────────────────────────
const LITE_FEATURES = [
  'local_mode', 'billing_retail', 'stock_entry', 'product_master',
  'client_ledger', 'staff_login_lockout', 'tag_printing_local',
  'scale_weighing', 'sales_report_basic', 'bastion_core',
]

const PRO_OWN = [
  'lan_multi_pc', 'karigar_vouchers', 'touch_groups', 'full_accounts',
  'tag_audit', 'stock_med_reports', 'tsc_network_printing', 'multi_staff',
  'analytics_dashboard', 'year_close', 'bastion_enhanced',
]

const ENTERPRISE_OWN = [
  'cloud_sync', 'fleet_bastion', 'customer_loyalty', 'bastion_ai',
  'nexus_management', 'bridge_server', 'custom_db_location',
  'priority_support', 'api_integration',
]

export const PLANS: Record<PlanId, Plan> = {
  lite: {
    id: 'lite', name: 'Lite', emoji: '🥉',
    price: 15000, yearly: 3000,
    billingNote: '₹15,000 + ₹3,000/yr',
    accent: '#b45309',
    ownFeatures: LITE_FEATURES,
  },
  pro: {
    id: 'pro', name: 'Pro', emoji: '🥈',
    price: 35000, yearly: 7000,
    billingNote: '₹35,000 + ₹7,000/yr',
    accent: '#6b7280',
    ownFeatures: PRO_OWN,
  },
  enterprise: {
    id: 'enterprise', name: 'Enterprise', emoji: '🥇',
    price: 75000, yearly: 15000,
    billingNote: '₹75,000 + ₹15,000/yr',
    accent: '#a87d1e',
    ownFeatures: ENTERPRISE_OWN,
  },
}

// ── PC CONNECTION ALLOWANCE ───────────────────────────────────
// Base PCs included with each tier. Pro ships with 1 PC; jewellers buy
// extra PC packs (e.g. +3 → total 4) from the admin "PC Connections" page.
// Lite is single-PC local mode — extra PCs are not allowed on Lite.
export const PC_BASE_LIMIT: Record<PlanId, number> = {
  lite: 1,
  pro: 1,
  enterprise: 2,
}

/** Tiers that may purchase extra PC connections. */
export const PC_EXTRA_ALLOWED: PlanId[] = ['pro', 'enterprise']

/** Suggested one-time price per extra PC (₹) — admin may override. */
export const PC_EXTRA_PRICE = 5000

/** Suggested yearly maintenance per extra PC (₹/yr) — admin may override. */
export const PC_EXTRA_YEARLY = 1000

/** Hard ceiling for total PCs on any single license. */
export const PC_MAX_TOTAL = 20

export function basePcsFor(raw: string | null | undefined): number {
  return PC_BASE_LIMIT[normalizePlan(raw)] ?? 1
}

export function canAddExtraPcs(raw: string | null | undefined): boolean {
  return PC_EXTRA_ALLOWED.includes(normalizePlan(raw))
}

export function extraPcsFor(raw: string | null | undefined, total: number | null | undefined): number {
  const t = Number(total ?? 0)
  if (!Number.isFinite(t) || t <= 0) return 0
  return Math.max(0, Math.floor(t) - basePcsFor(raw))
}

/**
 * Seat token the jeweller software reads (`terminals=N`).
 *
 * The desktop client (`core/permissions.py::licensed_seats`) scans the
 * license `features[]` list for this token and caps its LAN terminals to N.
 * Append it to EVERY license features response (check, handshake, verify,
 * subscription status/check) so a granted PC total flows to the shop's
 * brain server on its next sync — no client update needed.
 */
export function seatToken(total: number | null | undefined): string {
  const t = Math.floor(Number(total))
  const safe = Number.isFinite(t) && t > 0 ? Math.min(t, PC_MAX_TOTAL) : 1
  return `terminals=${safe}`
}

/** Plan features + seat token, for license API responses consumed by the software. */
export function featuresWithSeats(raw: string | null | undefined, total: number | null | undefined): string[] {
  return [...getPlanFeatures(raw), seatToken(total)]
}

// Order low → high. Index = rank.
export const PLAN_ORDER: PlanId[] = ['lite', 'pro', 'enterprise']

export const PLAN_PRICES: Record<PlanId, { price: number; yearly: number }> = {
  lite:       { price: PLANS.lite.price,       yearly: PLANS.lite.yearly },
  pro:        { price: PLANS.pro.price,        yearly: PLANS.pro.yearly },
  enterprise: { price: PLANS.enterprise.price, yearly: PLANS.enterprise.yearly },
}

// ── HELPERS ────────────────────────────────────────────────────

/**
 * Coerce any stored/legacy plan value to a real tier.
 * legacy 'premium' → 'pro'; 'free_trial'/null/''/unknown → 'lite'.
 */
export function normalizePlan(raw: string | null | undefined): PlanId {
  const v = (raw || '').toString().trim().toLowerCase()
  if (v === 'lite' || v === 'pro' || v === 'enterprise') return v
  if (v === 'premium') return 'pro'
  // 'free_trial', '', null, unknown → base tier
  return 'lite'
}

export function getPlan(raw: string | null | undefined): Plan {
  return PLANS[normalizePlan(raw)]
}

export function planRank(raw: string | null | undefined): number {
  return PLAN_ORDER.indexOf(normalizePlan(raw))
}

export function isUpgrade(from: string | null | undefined, to: string | null | undefined): boolean {
  return planRank(to) > planRank(from)
}

/**
 * Resolved (inherited) feature ids for a plan, ordered low tier → high tier.
 * lite → its own; pro → lite + pro; enterprise → lite + pro + enterprise.
 */
export function getPlanFeatures(raw: string | null | undefined): string[] {
  const rank = planRank(raw)
  const out: string[] = []
  for (let i = 0; i <= rank; i++) {
    out.push(...PLANS[PLAN_ORDER[i]].ownFeatures)
  }
  return out
}

/** Full Feature objects for a plan (inherited). */
export function getPlanFeatureObjects(raw: string | null | undefined): Feature[] {
  return getPlanFeatures(raw).map(id => FEATURES[id]).filter(Boolean)
}

/** Does a plan include a given feature id? */
export function hasFeature(raw: string | null | undefined, featureId: string): boolean {
  return getPlanFeatures(raw).includes(featureId)
}

/** The lowest tier that includes a feature (for "upgrade to X" messaging). */
export function requiredPlanFor(featureId: string): PlanId | null {
  for (const id of PLAN_ORDER) {
    if (PLANS[id].ownFeatures.includes(featureId)) return id
  }
  return null
}
