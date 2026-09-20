/**
 * lib/rateLimit.ts — IP-based brute-force guard for /api/auth.
 * In-memory sliding window (per Lambda instance) + DB audit log.
 * 5 fails / 15 min -> 429 + lockout. Success resets the counter.
 */

export interface RateState {
  fails: number[]
  lockedUntil: number
}

const buckets = new Map<string, RateState>()

const MAX_FAILS = 5
const WINDOW_MS = 15 * 60 * 1000
const LOCK_MS = 15 * 60 * 1000

export function clientIp(req: Request): string {
  const h = (n: string) => req.headers.get(n) || ''
  return (
    h('x-forwarded-for').split(',')[0]?.trim() ||
    h('x-real-ip').trim() ||
    'unknown'
  )
}

function stateFor(ip: string): RateState {
  let s = buckets.get(ip)
  if (!s) {
    s = { fails: [], lockedUntil: 0 }
    buckets.set(ip, s)
  }
  return s
}

export function isLocked(ip: string, now = Date.now()): boolean {
  const s = stateFor(ip)
  s.fails = s.fails.filter((t) => now - t < WINDOW_MS)
  return s.lockedUntil > now
}

export function lockRemainingSec(ip: string, now = Date.now()): number {
  const s = stateFor(ip)
  return Math.max(0, Math.ceil((s.lockedUntil - now) / 1000))
}

export function recordFail(ip: string, now = Date.now()): { locked: boolean; remainingSec: number } {
  const s = stateFor(ip)
  s.fails = s.fails.filter((t) => now - t < WINDOW_MS)
  s.fails.push(now)
  if (s.fails.length >= MAX_FAILS) {
    s.lockedUntil = now + LOCK_MS
    return { locked: true, remainingSec: Math.ceil(LOCK_MS / 1000) }
  }
  return { locked: false, remainingSec: 0 }
}

export function recordSuccess(ip: string): void {
  buckets.delete(ip)
}

export function attemptsLeft(ip: string, now = Date.now()): number {
  const s = stateFor(ip)
  s.fails = s.fails.filter((t) => now - t < WINDOW_MS)
  return Math.max(0, MAX_FAILS - s.fails.length)
}
