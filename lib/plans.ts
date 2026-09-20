/**
 * Shared plan catalogue for AurumOS.
 *
 * Single source of truth for plan ids, one-time prices (INR) and annual
 * maintenance. Mirror of the `PLANS` catalogue that lives in aurumos-admin
 * (`lib/plans.ts`). When the admin repo is the authority, copy changes from
 * there into this file so checkout amounts always match the license server.
 */

export const SOFTWARE_TYPES = ['wholesale', 'retail'] as const;
export type SoftwareType = (typeof SOFTWARE_TYPES)[number];

export const PLAN_IDS = ['lite', 'pro', 'enterprise'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export interface PlanDef {
  id: PlanId;
  name: string;
  /** One-time license fee in INR (rupees, not paise). */
  price: number;
  /** Annual maintenance in INR. */
  annual: number;
  blurb: string;
  features: string[];
}

export const PLANS: Record<PlanId, PlanDef> = {
  lite: {
    id: 'lite',
    name: 'Lite',
    price: 15000,
    annual: 3000,
    blurb: 'For single-shop jewelers who need solid local billing, stock, and security.',
    features: [
      'Single-PC local mode only',
      'Billing & retail billing',
      'Basic weight stock entry + stock ledger',
      'Basic product master + categories',
      'Basic client ledger / outstanding',
      'Owner + 1 staff login, lockout',
      'Local tag printing (basic printer)',
      'Scale weighing',
      'Basic sales report',
      'Core Bastion security (DB watchdog + lock screen)',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 35000,
    annual: 7000,
    blurb: 'For multi-PC shops needing full accounts, analytics, and advanced security.',
    features: [
      'Multi-PC LAN network mode (brain server/client, discovery, handshake)',
      'Karigar / Katti vouchers + Uchak stock/inward',
      'Touch groups / touch ledger / touch-stock report',
      'Full accounts: journal, credit ledger, statements, customer purchases',
      'Tag audit (book vs scanned reconciliation)',
      'Stock Med, stagnant + low-stock reports',
      'TSC network printing',
      'Multiple staff + sessions',
      'Full analytics dashboard + reporting',
      'Year close + archive',
      'Enhanced Bastion (session guard, auto-healer, pattern learner, email alerts, forensic PDF)',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 75000,
    annual: 15000,
    blurb: 'For multi-location chains needing cloud sync, fleet intelligence, and priority SLA.',
    features: [
      'Cloud sync engine (cross-shop sync, conflict resolution)',
      'Fleet Bastion intelligence (global signatures)',
      'Customer accounts + loyalty',
      'Advanced Bastion AI (cloud-brain behavioral detection)',
      'Remote admin / Nexus node management + live telemetry stream',
      'Bridge server (multi-location link)',
      'Custom DB location + audit logs',
      'Priority support / SLA',
      'API / integration access',
    ],
  },
};

/** Normalize user input to a valid plan id. Defaults to `pro`. */
export function normalizePlan(value: unknown): PlanId {
  const v = String(value ?? '').trim().toLowerCase();
  if (v === 'lite' || v === 'pro' || v === 'enterprise') return v;
  return 'pro';
}

export function normalizeSoftwareType(value: unknown): SoftwareType | null {
  const v = String(value ?? '').trim().toLowerCase();
  if (v === 'wholesale' || v === 'retail') return v;
  return null;
}

/**
 * Cumulative feature list for a plan (lite < pro < enterprise), matching
 * admin `getPlanFeatures(plan)`.
 */
export function getPlanFeatures(plan: PlanId): string[] {
  if (plan === 'lite') return [...PLANS.lite.features];
  if (plan === 'pro') return [...PLANS.lite.features, ...PLANS.pro.features];
  return [...PLANS.lite.features, ...PLANS.pro.features, ...PLANS.enterprise.features];
}

/** First-year total in INR: one-time license + year-1 maintenance. This is what checkout charges. */
export function dueTodayRupees(plan: PlanId): number {
  return PLANS[plan].price + PLANS[plan].annual;
}

/** Amount in paise for Razorpay orders (first-year total). */
export function planAmountPaise(plan: PlanId): number {
  return dueTodayRupees(plan) * 100;
}

export function formatINR(rupees: number): string {
  return `₹${rupees.toLocaleString('en-IN')}`;
}
