/**
 * lib/trial.ts — pure trial-lifecycle helpers (NO server/db imports).
 *
 * Kept free of `@/lib/db` (pg) so it is safe to import from client components
 * like app/licenses/LicenseTable.tsx without pulling the Postgres driver into
 * the browser bundle.
 */

import { normalizePlan } from '@/lib/plans'
import type { License } from '@/lib/license'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * A "trial" = any active Lite tier with a finite horizon. Every Lite license
 * shows a live evaluation countdown and locks when that horizon elapses —
 * including annual Lite licenses (duration 365), which simply count down a
 * full year instead of a short trial window. This keeps the timer visible on
 * the terminal for the whole Lite tier instead of only sub-annual durations.
 */
export function isTrial(lic: Pick<License, 'plan_type' | 'duration_days'>): boolean {
  const plan = normalizePlan(lic.plan_type)
  const d = Number(lic.duration_days)
  return plan === 'lite' && d > 0
}

/**
 * Epoch ms at which a trial expires. Uses the recorded start moment when
 * available, falling back to license creation for legacy rows. Returns null
 * when the license is not a trial or has no usable timestamp.
 */
export function trialEndTime(lic: License): number | null {
  if (!isTrial(lic)) return null
  const startIso = lic.trial_started_at || lic.created_at
  if (!startIso) return null
  const start = new Date(startIso).getTime()
  if (Number.isNaN(start)) return null
  return start + Number(lic.duration_days) * DAY_MS
}

/** True once the trial horizon has elapsed. */
export function isTrialExpired(lic: License, nowMs: number): boolean {
  const end = trialEndTime(lic)
  if (end === null) return false
  return nowMs >= end
}

/** Format remaining ms as "Dd HH:MM:SS" (days only shown when > 0). */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return '0s'
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  const clock = `${pad(hours)}:${pad(mins)}:${pad(secs)}`
  return days > 0 ? `${days}d ${clock}` : clock
}
