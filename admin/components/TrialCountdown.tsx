'use client'
import { useEffect, useState } from 'react'
import { isTrial, trialEndTime, formatRemaining } from '@/lib/trial'
import type { License } from '@/lib/license'

/**
 * Live, self-ticking trial countdown badge.
 *
 * Mirrors the exact markup/colours used in app/licenses/LicenseTable.tsx so the
 * dashboard and the Licenses page can never show conflicting countdowns. Each
 * instance runs its own 1s ticker (cheap; only a handful render at once).
 */
export default function TrialCountdown({ lic, className = '' }: { lic: License; className?: string }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  if (!isTrial(lic)) return null
  const end = trialEndTime(lic)
  if (end == null) return null

  const remaining = end - Date.now()

  if (remaining <= 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${className}`}
        style={{ background: 'rgba(124,45,18,0.10)', color: 'var(--gold)', border: '1px solid rgba(124,45,18,0.28)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-orange-700 animate-pulse" />Expired
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${className}`}
      style={{ background: 'rgba(168,125,30,0.10)', color: 'var(--gold3)', border: '1px solid var(--gold-ln)' }}
      title="Trial time remaining">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      {formatRemaining(remaining)}
    </span>
  )
}
