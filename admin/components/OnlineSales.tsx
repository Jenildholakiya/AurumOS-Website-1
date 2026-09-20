'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { License } from '@/lib/license'
import { PLANS, normalizePlan } from '@/lib/plans'

type Source = 'online' | 'manual'

interface Summary {
  orders: number
  revenue: number
  this_month_orders: number
  this_month_revenue: number
  by_plan: { lite: number; pro: number; enterprise: number }
}

interface MintAttempt {
  id: number
  ip: string
  ok: boolean
  stage: string
  payment_id: string | null
  order_id: string | null
  created_at: string
}

const STAGE_HINT: Record<string, string> = {
  'misconfigured-503': 'LICENSE_API_SECRET missing on this server — set it in env and redeploy.',
  'bad-auth-401': 'Caller used a wrong/old LICENSE_API_SECRET — copy the exact value from .env.local.',
  'rate-limited-429': 'Too many mint calls from one IP — retry shortly.',
  'bad-json-400': 'Caller sent invalid JSON.',
  'validation-400': 'Caller missed required fields (business_name, owner_name, phone, software_type, plan_type).',
  'server-error-500': 'Server error while minting — check server logs.',
  minted: 'Key minted successfully.',
  'duplicate-payment': 'Retry of an already-minted payment — same key returned.',
  'duplicate-order': 'Retry of an already-minted order — same key returned.',
  'duplicate-idempotency': 'Retry with same idempotency key — same key returned.',
}

const EMPTY_SUMMARY: Summary = {
  orders: 0, revenue: 0, this_month_orders: 0, this_month_revenue: 0,
  by_plan: { lite: 0, pro: 0, enterprise: 0 },
}

const PAGE_SIZE = 25

function inr(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
  return `₹${Number(n).toLocaleString('en-IN')}`
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function dateParts(iso: string | null | undefined): { date: string; time: string } | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  }
}

function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted2)', letterSpacing: '1px' }}>
        {label}
      </div>
      <div className={`text-sm mt-1 break-all ${mono ? 'font-mono' : 'font-medium'}`} style={{ color: 'var(--ink)' }}>
        {value}
      </div>
    </div>
  )
}

const cardBase: React.CSSProperties = {
  background: 'var(--cream)',
  border: '1px solid var(--rule)',
}

function CopyText({ text, title }: { text: string; title?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={e => {
        e.stopPropagation()
        navigator.clipboard.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1200)
        }).catch(() => { /* clipboard unavailable */ })
      }}
      title={title ?? 'Click to copy'}
      className="shrink-0 w-5 h-5 rounded text-[10px] font-bold leading-none transition-all hover:bg-[rgba(168,125,30,0.12)]"
      style={{ color: done ? 'var(--green)' : 'var(--gold3)' }}>
      {done ? '✓' : '⧉'}
    </button>
  )
}

type CacheEntry = { rows: License[]; total: number; summary: Summary }
const CACHE_LIMIT = 20

// Pure loader: fetches one tab page, writes NO state (safe for prefetch).
async function loadRows(
  src: Source,
  f: { q: string; plan: string; software: string; from: string; to: string; offset: number },
  signal: AbortSignal,
): Promise<CacheEntry> {
  const sp = new URLSearchParams({
    source: src,
    limit: String(PAGE_SIZE),
    offset: String(f.offset),
  })
  if (f.q) sp.set('q', f.q)
  if (f.plan) sp.set('plan', f.plan)
  if (f.software) sp.set('software', f.software)
  if (f.from) sp.set('from', f.from)
  if (f.to) sp.set('to', f.to)
  const res = await fetch(`/api/payments?${sp.toString()}`, { signal })
  if (res.status === 401) throw new Error('SESSION_EXPIRED')
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.ok) throw new Error(data?.error || `Request failed (${res.status})`)
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    total: Number(data.total ?? 0),
    summary: data.summary ? (data.summary as Summary) : EMPTY_SUMMARY,
  }
}

export default function OnlineSales() {
  const [source, setSource] = useState<Source>('online')
  const [rows, setRows] = useState<License[]>([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false) // background revalidate over cached data
  const [error, setError] = useState('')
  const [offset, setOffset] = useState(0)

  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')
  const [plan, setPlan] = useState('')
  const [software, setSoftware] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [selected, setSelected] = useState<License | null>(null)
  const [copiedKey, setCopiedKey] = useState<number | null>(null)

  const [attempts, setAttempts] = useState<MintAttempt[]>([])
  const [attemptsFailed, setAttemptsFailed] = useState(0)
  const [attemptsTotal, setAttemptsTotal] = useState(0)

  const isManual = source === 'manual'

  // Stale-while-revalidate tab cache: switching back to a recently seen
  // tab+filter paints instantly from cache, then quietly revalidates.
  const cacheRef = useRef(new Map<string, CacheEntry>())
  const abortRef = useRef<AbortController | null>(null)
  const prefetchRef = useRef<AbortController | null>(null)

  function cacheSet(key: string, entry: CacheEntry) {
    const m = cacheRef.current
    if (m.has(key)) m.delete(key) // refresh recency
    m.set(key, entry)
    while (m.size > CACHE_LIMIT) {
      const oldest = m.keys().next()
      if (oldest.done) break
      m.delete(oldest.value)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => { setQDebounced(q.trim()); setOffset(0) }, 400)
    return () => clearTimeout(t)
  }, [q])

  const fetchRows = useCallback(async (opts?: { prefetch?: boolean; src?: Source }) => {
    const prefetch = opts?.prefetch ?? false
    const src = opts?.src ?? source
    const filters = { q: qDebounced, plan, software, from, to, offset }
    const key = [src, qDebounced, plan, software, from, to, offset].join('|')

    // Background prefetch: cache-only, never touches UI state (no races).
    if (prefetch) {
      if (cacheRef.current.has(key)) return
      prefetchRef.current?.abort()
      const ctrl = new AbortController()
      prefetchRef.current = ctrl
      try {
        const data = await loadRows(src, filters, ctrl.signal)
        if (!ctrl.signal.aborted) cacheSet(key, data)
      } catch { /* prefetch is best-effort */ }
      return
    }

    const cached = cacheRef.current.get(key)
    if (cached) {
      // Instant paint — table/cards never blank on tab switch.
      setRows(cached.rows)
      setTotal(cached.total)
      setSummary(cached.summary)
      setError('')
      setLoading(false)
      setRefreshing(true)
    } else {
      setLoading(true)
      setError('')
      setRefreshing(false)
    }

    prefetchRef.current?.abort() // real navigation wins over prefetch
    abortRef.current?.abort() // kill stale request: late responses must never overwrite the new tab
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const data = await loadRows(src, filters, ctrl.signal)
      cacheSet(key, data)
      if (ctrl.signal.aborted) return
      setRows(data.rows)
      setTotal(data.total)
      setSummary(data.summary)
      setError('')
      setLoading(false)
      setRefreshing(false)
      // Warm the other tab with the same filters — the next switch is free.
      const other: Source = src === 'online' ? 'manual' : 'online'
      void fetchRows({ prefetch: true, src: other })
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (ctrl.signal.aborted) return
      const expired = err instanceof Error && err.message === 'SESSION_EXPIRED'
      // Background-revalidate failure keeps good cached data on screen.
      if (!cached) {
        setError(expired ? 'Session expired. Please log in again.' : err instanceof Error ? err.message : 'Failed to load sales.')
        setRows([])
      } else if (expired) {
        setError('Session expired. Please log in again.')
      }
      setLoading(false)
      setRefreshing(false)
    }
  }, [source, qDebounced, plan, software, from, to, offset])

  useEffect(() => { void fetchRows() }, [fetchRows])

  // Never leave requests running after unmount.
  useEffect(() => () => {
    abortRef.current?.abort()
    prefetchRef.current?.abort()
  }, [])

  const fetchAttempts = useCallback(async () => {
    try {
      const res = await fetch('/api/payments/attempts')
      if (!res.ok) return
      const data = await res.json().catch(() => ({}))
      if (!data?.ok) return
      setAttempts(Array.isArray(data.rows) ? data.rows.slice(0, 10) : [])
      setAttemptsTotal(Number(data.summary?.total ?? 0))
      setAttemptsFailed(Number(data.summary?.failed ?? 0))
    } catch { /* diagnostics are best-effort */ }
  }, [])

  useEffect(() => { void fetchAttempts() }, [fetchAttempts])

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  function switchSource(s: Source) {
    if (s === source) return
    setSource(s)
    setOffset(0)
    setSelected(null)
  }

  async function copyKey(id: number, key: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKey(id)
      setTimeout(() => setCopiedKey(cur => (cur === id ? null : cur)), 1500)
    } catch { /* clipboard unavailable */ }
  }

  const resetFilters = () => {
    setQ(''); setQDebounced(''); setPlan(''); setSoftware(''); setFrom(''); setTo(''); setOffset(0)
  }

  const fromN = offset + 1
  const toN = Math.min(offset + PAGE_SIZE, total)
  // Online: Date | Customer | Contact | Plan | Amount | Payment ref | License key | Status
  // Manual: same minus Payment ref.
  const colCount = isManual ? 7 : 8
  const planSplit = [
    { label: 'Lite', val: summary.by_plan.lite, color: PLANS.lite.accent },
    { label: 'Pro', val: summary.by_plan.pro, color: PLANS.pro.accent },
    { label: 'Enterprise', val: summary.by_plan.enterprise, color: PLANS.enterprise.accent },
  ]
  const statCards = [
    {
      label: isManual ? 'Manual keys' : 'Online orders',
      value: String(summary.orders),
      sub: isManual ? 'created from Generate Key' : 'auto-minted website sales',
      bar: 'linear-gradient(90deg, var(--gold3), var(--gold2))',
    },
    {
      label: isManual ? 'Manual revenue' : 'Online revenue',
      value: inr(summary.revenue),
      sub: 'total collected',
      bar: 'linear-gradient(90deg, var(--green), var(--green))',
      gold: true,
    },
    {
      label: 'This month',
      value: inr(summary.this_month_revenue),
      sub: `${summary.this_month_orders} ${summary.this_month_orders === 1 ? 'order' : 'orders'}`,
      bar: 'linear-gradient(90deg, var(--ink), var(--ink2))',
    },
  ]

  return (
    <section className="bg-cream2 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--rule)', boxShadow: '0 1px 3px rgba(14,12,9,0.07)' }}>
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold2), var(--gold))' }} />

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--rule)' }}>
        <div className="flex rounded-lg p-1 gap-1" style={{ background: 'var(--cream)', border: '1px solid var(--rule)' }}>
          {(['online', 'manual'] as Source[]).map(s => {
            const active = source === s
            return (
              <button
                key={s}
                onClick={() => switchSource(s)}
                className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all"
                style={active
                  ? { background: 'var(--ink)', color: 'var(--cream)', boxShadow: '0 2px 8px rgba(14,12,9,0.2)' }
                  : { color: 'var(--muted)' }}>
                {s === 'online' ? '🌐 Online' : '🔑 Manual'}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px]" style={{ color: 'var(--muted2)' }}>
            {isManual ? 'Keys created from Generate Key' : 'Website Razorpay purchases · auto-minted keys'}
          </span>
          <button
            onClick={() => { void fetchRows(); void fetchAttempts() }}
            disabled={loading || refreshing}
            className="text-[10px] font-semibold uppercase px-3 py-1.5 rounded-lg transition-all hover:bg-[rgba(168,125,30,0.07)] disabled:opacity-50"
            style={{ color: 'var(--gold3)', border: '1px solid rgba(168,125,30,0.2)' }}>
            {loading ? 'Loading…' : refreshing ? 'Updating…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {statCards.map(c => (
            <div key={c.label} className="rounded-xl p-4 pt-5 relative overflow-hidden group transition-all hover:shadow-md" style={cardBase}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: c.bar }} />
              <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted2)', letterSpacing: '1px' }}>{c.label}</div>
              <div className="font-serif text-3xl mt-1 leading-none" style={{ color: c.gold ? 'var(--gold3)' : 'var(--ink)', letterSpacing: '-0.5px' }}>{c.value}</div>
              <div className="text-[11px] mt-1.5" style={{ color: 'var(--muted)' }}>{c.sub}</div>
            </div>
          ))}
          <div className="rounded-xl p-4 pt-5 relative overflow-hidden" style={cardBase}>
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, var(--gold3), var(--gold2))' }} />
            <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted2)', letterSpacing: '1px' }}>Plan split</div>
            <div className="flex flex-col gap-1.5">
              {planSplit.map(p => (
                <div key={p.label} className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                  <span style={{ color: p.color }}>{p.label}</span>
                  <span className="ml-auto font-mono">{p.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mint diagnostics — visible in Online tab when something needs attention */}
        {!isManual && (summary.orders === 0 || attemptsFailed > 0) && (
          <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--cream)', border: '1px solid var(--rule)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--gold3)', letterSpacing: '1px' }}>
              🔍 Mint diagnostics — {attemptsTotal} calls received, {attemptsFailed} failed
            </div>
            {attemptsTotal === 0 ? (
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                The server never received a mint call. If a purchase was made, the software/website is not reaching
                <span className="font-mono"> POST /api/public/mint-license</span> — check the server URL it calls,
                push the latest code (<span className="font-mono">git push</span>) and redeploy.
              </p>
            ) : (
              <div className="mt-2 flex flex-col gap-1.5">
                {attempts.map(a => (
                  <div key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs px-3 py-2 rounded-lg"
                       style={{ background: 'var(--cream2)', border: '1px solid var(--rule)' }}>
                    <span className="font-bold" style={{ color: a.ok ? 'var(--green)' : 'var(--red)' }}>
                      {a.ok ? '✓' : '✕'} {a.stage}
                    </span>
                    <span className="font-mono" style={{ color: 'var(--muted)' }}>
                      {a.payment_id || a.order_id || 'no refs'}
                    </span>
                    <span className="ml-auto" style={{ color: 'var(--muted2)' }}>{fmtDate(a.created_at)}</span>
                    <span className="w-full" style={{ color: 'var(--muted)' }}>
                      {STAGE_HINT[a.stage] || 'See server logs for details.'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mb-4">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={isManual ? 'Search business, owner, key…' : 'Search business, owner, email, key, payment…'}
            className="lg:col-span-2 h-10 px-3 rounded-lg text-sm outline-none"
            style={{ background: 'var(--cream)', border: '1px solid var(--rule)', color: 'var(--ink)' }}
          />
          <select
            value={plan}
            onChange={e => { setPlan(e.target.value); setOffset(0) }}
            className="h-10 px-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--cream)', border: '1px solid var(--rule)', color: 'var(--ink)' }}>
            <option value="">All plans</option>
            <option value="lite">Lite</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={software}
            onChange={e => { setSoftware(e.target.value); setOffset(0) }}
            className="h-10 px-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--cream)', border: '1px solid var(--rule)', color: 'var(--ink)' }}>
            <option value="">Wholesale + Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="retail">Retail</option>
          </select>
          <input
            type="date"
            value={from}
            onChange={e => { setFrom(e.target.value); setOffset(0) }}
            className="h-10 px-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--cream)', border: '1px solid var(--rule)', color: 'var(--ink)' }}
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={to}
              onChange={e => { setTo(e.target.value); setOffset(0) }}
              className="h-10 px-2 rounded-lg text-sm outline-none flex-1"
              style={{ background: 'var(--cream)', border: '1px solid var(--rule)', color: 'var(--ink)' }}
            />
            <button
              onClick={resetFilters}
              title="Clear filters"
              className="h-10 px-3 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--cream)', border: '1px solid var(--rule)', color: 'var(--muted)' }}>
              ✕
            </button>
          </div>
        </div>

        {error && (
          <div className="text-xs font-medium px-4 py-3 rounded-lg mb-4" style={{ background: 'rgba(185,28,28,0.07)', color: 'var(--red)', border: '1px solid rgba(185,28,28,0.2)' }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--rule)' }}>
          <table className="w-full text-left text-xs table-fixed min-w-[940px]">
            {isManual ? (
              <colgroup>
                <col style={{ width: 108 }} /><col /><col /><col style={{ width: 108 }} />
                <col style={{ width: 92 }} /><col style={{ width: 196 }} /><col style={{ width: 112 }} />
              </colgroup>
            ) : (
              <colgroup>
                <col style={{ width: 108 }} /><col /><col /><col style={{ width: 108 }} />
                <col style={{ width: 92 }} /><col style={{ width: 172 }} /><col style={{ width: 196 }} />
                <col style={{ width: 112 }} />
              </colgroup>
            )}
            <thead className="sticky top-0">
              <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--rule)' }}>
                {(isManual
                  ? ['Date', 'Customer', 'Contact', 'Plan', 'Amount', 'License key', 'Status']
                  : ['Date', 'Customer', 'Contact', 'Plan', 'Amount', 'Payment ref', 'License key', 'Status']).map(h => (
                  <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--muted2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr><td colSpan={colCount} className="px-4 py-10 text-center" style={{ color: 'var(--muted2)' }}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={colCount} className="px-4 py-10 text-center" style={{ color: 'var(--muted2)' }}>
                  {isManual ? 'No manual keys yet. Create one from Generate Key →' : 'No online purchases yet. Website orders will appear here automatically.'}
                </td></tr>
              ) : rows.map(r => {
                const p = normalizePlan(r.plan_type)
                const dp = dateParts(r.created_at)
                const active = r.status === 'active'
                const statusColor = active ? 'var(--green)' : 'var(--red)'
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="cursor-pointer hover:bg-[var(--cream)] transition-colors"
                    style={{ borderBottom: '1px solid rgba(14,12,9,0.05)' }}>
                    {/* Date */}
                    <td className="px-3 py-2.5 whitespace-nowrap align-top">
                      <div className="font-semibold" style={{ color: 'var(--ink)' }}>{dp?.date ?? '—'}</div>
                      <div className="text-[11px]" style={{ color: 'var(--muted2)' }}>{dp?.time ?? ''}</div>
                    </td>
                    {/* Customer */}
                    <td className="px-3 py-2.5 align-top overflow-hidden">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold truncate" title={r.business_name} style={{ color: 'var(--ink)' }}>
                          {r.business_name}
                        </span>
                        <span className="shrink-0 px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wider whitespace-nowrap"
                              style={isManual
                                ? { background: 'rgba(14,12,9,0.06)', color: 'var(--muted)', border: '1px solid var(--rule)' }
                                : { background: 'rgba(168,125,30,0.1)', color: 'var(--gold3)', border: '1px solid rgba(168,125,30,0.3)' }}>
                          {isManual ? '🔑 Manual' : '🌐 Online'}
                        </span>
                      </div>
                      <div className="truncate" title={`${r.owner_name}${r.city ? ` · ${r.city}` : ''}`} style={{ color: 'var(--muted2)' }}>
                        {r.owner_name}{r.city ? ` · ${r.city}` : ''}
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-3 py-2.5 align-top overflow-hidden">
                      <div className="truncate" title={r.email || ''} style={{ color: 'var(--ink)' }}>{r.email || '—'}</div>
                      <div className="text-[11px]" style={{ color: 'var(--muted2)' }}>{r.phone || ''}</div>
                    </td>
                    {/* Plan + software type */}
                    <td className="px-3 py-2.5 whitespace-nowrap align-top">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            style={{ background: `${PLANS[p].accent}14`, color: PLANS[p].accent, border: `1px solid ${PLANS[p].accent}33` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: PLANS[p].accent }} />
                        {PLANS[p].name}
                      </span>
                      <div className="text-[11px] capitalize mt-0.5" style={{ color: 'var(--muted2)' }}>{r.software_type}</div>
                    </td>
                    {/* Amount */}
                    <td className="px-3 py-2.5 whitespace-nowrap align-top font-semibold" style={{ color: 'var(--ink)' }}>
                      {inr(r.amount_paid ? Number(r.amount_paid) : null)}
                    </td>
                    {/* Payment ref — stacked, truncated, click ⧉ to copy */}
                    {!isManual && (
                      <td className="px-3 py-2.5 align-top overflow-hidden">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-mono truncate text-[11px]" title={r.payment_id || ''} style={{ color: 'var(--muted)' }}>
                            {r.payment_id || '—'}
                          </span>
                          {r.payment_id && <CopyText text={r.payment_id} title="Copy payment ID" />}
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-mono truncate text-[11px]" title={r.order_id || ''} style={{ color: 'var(--muted2)' }}>
                            {r.order_id || '—'}
                          </span>
                          {r.order_id && <CopyText text={r.order_id} title="Copy order ID" />}
                        </div>
                      </td>
                    )}
                    {/* License key */}
                    <td className="px-3 py-2.5 align-top overflow-hidden">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono truncate px-1.5 py-0.5 rounded text-[11px]" title={r.key}
                              style={{ background: 'rgba(168,125,30,0.07)', color: 'var(--gold3)', border: '1px solid rgba(168,125,30,0.2)' }}>
                          {r.key}
                        </span>
                        <button
                          onClick={e => void copyKey(r.id, r.key, e)}
                          className="shrink-0 text-[10px] font-bold uppercase whitespace-nowrap"
                          style={{ color: 'var(--gold3)' }}>
                          {copiedKey === r.id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </td>
                    {/* Status + expiry */}
                    <td className="px-3 py-2.5 whitespace-nowrap align-top">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            style={{ color: statusColor, background: active ? 'rgba(22,101,52,0.08)' : 'rgba(185,28,28,0.08)', border: `1px solid ${active ? 'rgba(22,101,52,0.25)' : 'rgba(185,28,28,0.25)'}` }}>
                        ● {r.status}
                      </span>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted2)' }} title={fmtDate(r.subscription_expires_at)}>
                        Exp {shortDate(r.subscription_expires_at)}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-3 text-xs" style={{ color: 'var(--muted)' }}>
          <span>{total === 0 ? '0 results' : `Showing ${fromN}–${toN} of ${total}`}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(o => Math.max(0, o - PAGE_SIZE))}
              disabled={offset === 0 || loading}
              className="px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40"
              style={{ border: '1px solid var(--rule)', color: 'var(--ink)' }}>
              ← Prev
            </button>
            <button
              onClick={() => setOffset(o => o + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total || loading}
              className="px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40"
              style={{ border: '1px solid var(--rule)', color: 'var(--ink)' }}>
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50" onClick={() => setSelected(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(14,12,9,0.45)' }} />
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-md overflow-y-auto p-6"
            style={{ background: 'var(--cream2)', borderLeft: '1px solid var(--rule)', boxShadow: '-16px 0 48px rgba(14,12,9,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="font-serif text-xl" style={{ color: 'var(--ink)' }}>{selected.business_name}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {selected.payment_id ? 'Online purchase detail' : 'Manual key detail'}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-lg text-sm font-bold"
                style={{ border: '1px solid var(--rule)', color: 'var(--muted)' }}>
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="License key" value={selected.key} mono />
              <Field label="Status" value={selected.status} />
              <Field label="Owner" value={selected.owner_name} />
              <Field label="Business" value={selected.business_name} />
              <Field label="Email" value={selected.email || '—'} />
              <Field label="Phone" value={selected.phone || '—'} />
              <Field label="City" value={selected.city || '—'} />
              <Field label="Plan" value={`${PLANS[normalizePlan(selected.plan_type)].emoji} ${PLANS[normalizePlan(selected.plan_type)].name}`} />
              <Field label="Software" value={selected.software_type} />
              <Field label="Duration" value={`${selected.duration_days} days`} />
              <Field label="Amount paid" value={selected.amount_paid != null ? `₹${Number(selected.amount_paid).toLocaleString('en-IN')}` : '—'} />
              {selected.payment_id && (
                <>
                  <Field label="Payment ID" value={selected.payment_id} mono />
                  <Field label="Order ID" value={selected.order_id || '—'} mono />
                  <Field label="Idempotency key" value={selected.idempotency_key || '—'} mono />
                </>
              )}
              <Field label="Machine bound" value={selected.machine_id || selected.activated_machine || 'Not yet activated'} mono />
              <Field label="Activated at" value={fmtDate(selected.activated_at)} />
              <Field label="Subscription started" value={fmtDate(selected.subscription_started_at)} />
              <Field label="Subscription expires" value={fmtDate(selected.subscription_expires_at)} />
              <Field label="Created" value={fmtDate(selected.created_at)} />
              <Field label="Last updated" value={fmtDate(selected.updated_at)} />
              <div className="sm:col-span-2">
                <Field label="Notes" value={selected.notes || '—'} />
              </div>
            </div>
            <button
              onClick={e => void copyKey(selected.id, selected.key, e)}
              className="w-full mt-6 py-3 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
              {copiedKey === selected.id ? 'Copied!' : 'Copy License Key'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
