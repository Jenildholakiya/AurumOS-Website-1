/**
 * lib/subscription.ts — Pure subscription helpers (NO server/db imports).
 *
 * Safe to import from client components like LicenseTable.tsx.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const GRACE_DAYS = 7
const HARD_EXPIRY_DAYS = 30

export type SubscriptionStatus = 'active' | 'grace' | 'expired'

export interface SubscriptionInfo {
  status:              SubscriptionStatus
  expires_at:          string | null
  remaining_days:      number
  grace_remaining_days: number
  effective_plan:      string
  renewal_amount:      number
}

export interface SubscriptionInput {
  plan_type:            string
  duration_days:        number
  subscription_expires_at: string | null
}

function getRenewalAmount(plan: string): number {
  const amounts: Record<string, number> = { lite: 3000, pro: 7000, enterprise: 15000 }
  return amounts[plan] || 0
}

/**
 * Resolve the subscription status of a license.
 * - active:  subscription_expires_at is in the future
 * - grace:   within 7 days past expiry → features degrade to Lite
 * - expired: > 30 days past expiry → license fully locked
 */
export function getSubscriptionInfo(lic: SubscriptionInput): SubscriptionInfo {
  const now = Date.now()
  const plan = normalizePlan(lic.plan_type)

  if (!lic.subscription_expires_at) {
    return {
      status: 'active',
      expires_at: null,
      remaining_days: 9999,
      grace_remaining_days: 0,
      effective_plan: plan,
      renewal_amount: 0,
    }
  }

  const expiryMs = new Date(lic.subscription_expires_at).getTime()
  if (Number.isNaN(expiryMs)) {
    return {
      status: 'active',
      expires_at: lic.subscription_expires_at,
      remaining_days: 9999,
      grace_remaining_days: 0,
      effective_plan: plan,
      renewal_amount: 0,
    }
  }

  const diffMs = expiryMs - now
  const remainingDays = Math.ceil(diffMs / DAY_MS)

  if (diffMs > 0) {
    return {
      status: 'active',
      expires_at: lic.subscription_expires_at,
      remaining_days: remainingDays,
      grace_remaining_days: 0,
      effective_plan: plan,
      renewal_amount: getRenewalAmount(plan),
    }
  }

  const graceMs = GRACE_DAYS * DAY_MS
  const graceRemaining = graceMs - Math.abs(diffMs)
  const graceRemainingDays = Math.ceil(graceRemaining / DAY_MS)

  if (graceRemaining > 0) {
    return {
      status: 'grace',
      expires_at: lic.subscription_expires_at,
      remaining_days: 0,
      grace_remaining_days: graceRemainingDays,
      effective_plan: 'lite',
      renewal_amount: getRenewalAmount(plan),
    }
  }

  return {
    status: 'expired',
    expires_at: lic.subscription_expires_at,
    remaining_days: 0,
    grace_remaining_days: 0,
    effective_plan: plan,
    renewal_amount: getRenewalAmount(plan),
  }
}

function normalizePlan(raw: string | null | undefined): string {
  const v = (raw || '').toString().trim().toLowerCase()
  if (v === 'lite' || v === 'pro' || v === 'enterprise') return v
  if (v === 'premium') return 'pro'
  return 'lite'
}
