'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PLANS,
  normalizePlan,
  basePcsFor,
  canAddExtraPcs,
  PC_EXTRA_PRICE,
  PC_MAX_TOTAL,
} from '@/lib/plans'

interface LicenseRow {
  id: number
  key: string
  business_name: string
  owner_name: string
  city: string | null
  plan_type: string
  status: string
  max_allowed_connections?: number | null
}

interface PcAddonRow {
  id: number
  license_id: number
  license_key: string | null
  added_pcs: number
  total_after: number
  amount_paid: number | null
  notes: string | null
  created_at: string
}

function totalOf(l: LicenseRow): number {
  const base = basePcsFor(l.plan_type)
  const t = Number(l.max_allowed_connections ?? base)
  return Number.isFinite(t) && t > 0 ? Math.floor(t) : base
}

const card: React.CSSProperties = {
  background: 'var(--cream2)',
  border: '1px solid var(--rule)',
  borderRadius: '16px',
  boxShadow: '0 8px 30px rgba(14,12,9,0.05)',
}

const label: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--gold3)',
  display: 'block',
  marginBottom: '7px',
}

const field: React.CSSProperties = {
  background: 'var(--cream)',
  border: '1px solid var(--rule)',
  color: 'var(--ink)',
  borderRadius: '10px',
  height: '46px',
  padding: '0 14px',
  fontSize: '0.9rem',
  width: '100%',
  outline: 'none',
}

export default function PcManager({
  initialLicenses,
  initialHistory,
}: {
  initialLicenses: LicenseRow[]
  initialHistory: PcAddonRow[]
}) {
  const router = useRouter()
  const [licenses, setLicenses] = useState<LicenseRow[]>(initialLicenses || [])
  const [history, setHistory] = useState<PcAddonRow[]>(initialHistory || [])
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<'all' | 'pro' | 'enterprise' | 'lite'>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mode, setMode] = useState<'add' | 'set'>('add')
  // All inputs start EMPTY — nothing pre-filled, admin types every value.
  const [pcs, setPcs] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null)

  // Auto-dismiss the toast so it never gets stuck on screen.
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.err ? 5000 : 4000)
    return () => clearTimeout(t)
  }, [toast])

  // Enter-key navigation refs: PCs → Amount → Note → Grant.
  const pcsRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  function handleEnter(e: React.KeyboardEvent, nextRef: React.RefObject<HTMLElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef.current?.focus()
    }
  }

  const stats = useMemo(() => {
    let extraLicenses = 0
    let totalExtra = 0
    for (const l of licenses || []) {
      const base = basePcsFor(l.plan_type)
      const extra = Math.max(0, totalOf(l) - base)
      if (extra > 0) {
        extraLicenses += 1
        totalExtra += extra
      }
    }
    const revenue = (history || []).reduce((s, h) => s + (Number(h.amount_paid) || 0), 0)
    return { extraLicenses, totalExtra, revenue, grants: (history || []).length }
  }, [licenses, history])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (licenses || []).filter((l) => {
      if (planFilter !== 'all' && normalizePlan(l.plan_type) !== planFilter) return false
      if (!q) return true
      return (
        (l.business_name || '').toLowerCase().includes(q) ||
        (l.key || '').toLowerCase().includes(q) ||
        (l.owner_name || '').toLowerCase().includes(q) ||
        (l.city || '').toLowerCase().includes(q)
      )
    })
  }, [licenses, search, planFilter])

  const selected = useMemo(
    () => licenses.find((l) => l.id === selectedId) ?? null,
    [licenses, selectedId],
  )

  function pickLicense(l: LicenseRow) {
    setSelectedId(l.id)
    setMode('add')
    // Reset to EMPTY on every selection — admin always types fresh values.
    setPcs('')
    setAmount('')
    setNotes('')
    setToast(null)
    // Jump straight into the PCs field so Enter-navigation can flow.
    setTimeout(() => pcsRef.current?.focus(), 60)
  }

  function previewTotal(): number | null {
    if (!selected) return null
    if (pcs.trim() === '') return null
    const n = Math.floor(Number(pcs))
    if (!Number.isFinite(n) || n <= 0) return null
    const cur = totalOf(selected)
    const base = basePcsFor(selected.plan_type)
    if (!canAddExtraPcs(selected.plan_type)) return base
    const req = mode === 'add' ? cur + n : n
    return Math.min(PC_MAX_TOTAL, Math.max(base, req))
  }

  async function submit() {
    if (!selected || saving) return
    const n = Math.floor(Number(pcs))
    if (pcs.trim() === '' || !Number.isFinite(n) || n <= 0) {
      setToast({ msg: 'Enter the number of PCs first.', err: true })
      return
    }
    setSaving(true)
    setToast(null)
    try {
      const res = await fetch('/api/pc-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_id: selected.id,
          mode,
          pcs: n,
          amount_paid: amount.trim() === '' ? null : Number(amount),
          notes: notes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update PCs')
      const newTotal = Number(data?.license?.total ?? previewTotal() ?? totalOf(selected))
      setLicenses((prev) => prev.map((l) => (l.id === selected.id ? { ...l, max_allowed_connections: newTotal } : l)))
      if (data?.addon) setHistory((prev) => [data.addon, ...prev].slice(0, 20))
      setToast({ msg: `${selected.business_name} now has ${newTotal} PC(s) — live on their next software sync.`, err: false })
      setPcs('')
      setAmount('')
      setNotes('')
      router.refresh()
    } catch (e: any) {
      setToast({ msg: e?.message || 'Failed to update PCs', err: true })
    } finally {
      setSaving(false)
    }
  }

  const preview = previewTotal()

  return (
    <div>
      {/* ── Hero ── */}
      <div className="mb-6">
        <div className="text-[10px] font-bold uppercase tracking-[2px] mb-2" style={{ color: 'var(--gold3)' }}>
          Multi-PC licensing
        </div>
        <h2 className="font-serif text-3xl md:text-4xl" style={{ color: 'var(--ink)', letterSpacing: '-0.6px' }}>
          Grant extra <em style={{ color: 'var(--gold3)' }}>PCs</em> to a jeweller
        </h2>
        <p className="text-sm mt-2 max-w-2xl leading-relaxed" style={{ color: 'var(--muted)' }}>
          Each plan includes base PCs. When a jeweller purchases extra connections, select them below
          and grant the additional PCs — the new total goes live on their next software sync with no
          key re-entry. Lite stays single-PC.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { k: 'Shops with extra PCs', v: String(stats.extraLicenses), sub: 'licenses above base' },
          { k: 'Extra PCs granted', v: String(stats.totalExtra), sub: `ceiling ${PC_MAX_TOTAL} / license` },
          { k: 'PC revenue', v: `₹${stats.revenue.toLocaleString('en-IN')}`, sub: 'from recorded grants' },
          { k: 'Grants logged', v: String(stats.grants), sub: 'recent purchase history' },
        ].map((s) => (
          <div key={s.k} className="p-4 md:p-5" style={card}>
            <div className="text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: 'var(--muted)' }}>
              {s.k}
            </div>
            <div className="font-serif text-2xl md:text-3xl mt-1.5" style={{ color: 'var(--ink)' }}>
              {s.v}
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--muted2)' }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div
          className="mb-5 px-4 py-3 rounded-xl text-sm font-medium fade-up"
          style={{
            background: toast.err ? 'rgba(185,28,28,0.07)' : 'rgba(21,128,61,0.07)',
            color: toast.err ? 'var(--red)' : 'var(--green)',
            border: `1px solid ${toast.err ? 'rgba(185,28,28,0.22)' : 'rgba(21,128,61,0.22)'}`,
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5 items-start">
        {/* ── License directory ── */}
        <div className="lg:col-span-3 overflow-hidden" style={card}>
          <div className="h-[3px] gold-shimmer" />
          <div className="p-4 md:p-5" style={{ borderBottom: '1px solid var(--rule)' }}>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted2)' }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (filtered[0]) pickLicense(filtered[0])
                  }
                }}
                placeholder="Search business, key, owner, city…"
                className="w-full pl-10 pr-4 transition-all focus:ring-2 focus:ring-yellow-700/20"
                style={{ ...field, borderRadius: '10px' }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {(['all', 'pro', 'enterprise', 'lite'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setPlanFilter(f)}
                  className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: planFilter === f ? 'var(--ink)' : 'var(--cream)',
                    color: planFilter === f ? 'var(--cream)' : 'var(--ink3)',
                    border: `1px solid ${planFilter === f ? 'var(--ink)' : 'var(--rule)'}`,
                  }}
                >
                  {f}
                </button>
              ))}
              <span className="ml-auto text-[11px] font-serif" style={{ color: 'var(--muted2)' }}>
                {filtered.length} shop{filtered.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {filtered.slice(0, 40).map((l) => {
              const plan = normalizePlan(l.plan_type)
              const base = basePcsFor(plan)
              const total = totalOf(l)
              const extra = Math.max(0, total - base)
              const sel = l.id === selectedId
              const locked = !canAddExtraPcs(plan)
              return (
                <button
                  key={l.id}
                  onClick={() => pickLicense(l)}
                  className="w-full text-left px-4 md:px-5 py-4 flex items-center gap-4 transition-all hover:bg-yellow-900/[0.03]"
                  style={{
                    borderBottom: '1px solid rgba(14,12,9,0.05)',
                    background: sel ? 'var(--gold-bg)' : 'transparent',
                    boxShadow: sel ? 'inset 3px 0 0 var(--gold2)' : 'none',
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-serif text-lg"
                    style={{
                      background: sel ? 'var(--ink)' : 'var(--cream3)',
                      color: sel ? 'var(--gold2)' : 'var(--ink3)',
                    }}
                  >
                    {(l.business_name || '?').trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold truncate" style={{ color: 'var(--ink)' }}>
                        {l.business_name || '--'}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: `${PLANS[plan].accent}14`, color: PLANS[plan].accent, border: `1px solid ${PLANS[plan].accent}33` }}
                      >
                        {PLANS[plan].emoji} {PLANS[plan].name}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono mt-0.5 truncate" style={{ color: 'var(--muted2)' }}>
                      {l.key} · {l.city || '—'}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-serif text-xl font-bold leading-none" style={{ color: 'var(--ink)' }}>
                      {total}<span className="text-[10px] font-sans font-semibold" style={{ color: 'var(--muted2)' }}> PC</span>
                    </div>
                    <div className="text-[10px] font-serif mt-1" style={{ color: locked ? 'var(--muted2)' : 'var(--gold3)' }}>
                      {locked ? 'single-PC' : `base ${base} + ${extra} extra`}
                    </div>
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="text-center py-14 text-sm" style={{ color: 'var(--muted2)' }}>
                No shops match your search.
              </div>
            )}
          </div>
          {filtered.length > 40 && (
            <div className="px-5 py-2.5 text-[11px]" style={{ color: 'var(--muted2)', borderTop: '1px solid var(--rule)' }}>
              Showing 40 of {filtered.length} — refine your search.
            </div>
          )}
        </div>

        {/* ── Grant panel ── */}
        <div className="lg:col-span-2 lg:sticky lg:top-20">
          <div className="overflow-hidden" style={card}>
            <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold2))' }} />
            <div className="p-5 md:p-6">
              {!selected ? (
                <div className="text-center py-10">
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-ln)' }}
                  >
                    <svg width="26" height="26" fill="none" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                  </div>
                  <div className="font-serif text-xl" style={{ color: 'var(--ink)' }}>
                    Select a shop
                  </div>
                  <p className="text-[13px] mt-2 leading-relaxed max-w-[260px] mx-auto" style={{ color: 'var(--muted)' }}>
                    Pick a jeweller from the directory to grant extra PC connections.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[2px]" style={{ color: 'var(--gold3)' }}>
                    Granting PCs to
                  </div>
                  <div className="font-serif text-2xl mt-1 leading-tight" style={{ color: 'var(--ink)' }}>
                    {selected.business_name}
                  </div>
                  <div
                    className="inline-block font-mono text-[11px] px-2.5 py-1 rounded-md mt-2 tracking-wider"
                    style={{ background: 'var(--cream3)', color: 'var(--ink3)', border: '1px solid var(--rule)' }}
                  >
                    {selected.key}
                  </div>

                  {/* Current total hero */}
                  <div
                    className="mt-4 rounded-xl px-5 py-4 flex items-center justify-between"
                    style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                  >
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: 'var(--gold2)' }}>
                        Current allowance
                      </div>
                      <div className="text-[11px] mt-1 font-serif" style={{ color: 'rgba(250,248,243,0.65)' }}>
                        base {basePcsFor(selected.plan_type)} + {Math.max(0, totalOf(selected) - basePcsFor(selected.plan_type))} extra
                      </div>
                    </div>
                    <div className="font-serif text-4xl font-bold" style={{ color: 'var(--gold2)' }}>
                      {totalOf(selected)}
                      <span className="text-xs ml-1" style={{ color: 'rgba(250,248,243,0.6)' }}>PC</span>
                    </div>
                  </div>

                  {!canAddExtraPcs(selected.plan_type) ? (
                    <div
                      className="mt-4 rounded-xl px-4 py-3.5 text-[13px] leading-relaxed"
                      style={{ background: 'rgba(185,28,28,0.06)', color: 'var(--red)', border: '1px solid rgba(185,28,28,0.18)' }}
                    >
                      <strong>Lite is single-PC only.</strong> Upgrade this license to Pro first
                      (Licenses → Change Plan), then grant extra PCs here.
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {/* Mode segmented control */}
                      <div
                        className="grid grid-cols-2 gap-1 p-1 rounded-xl"
                        style={{ background: 'var(--cream3)' }}
                      >
                        {([
                          { id: 'add', t: '+ Add PCs', s: 'on top of current' },
                          { id: 'set', t: '= Set total', s: 'override to exact' },
                        ] as const).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setMode(m.id)}
                            className="rounded-lg px-3 py-2.5 transition-all"
                            style={{
                              background: mode === m.id ? 'var(--cream)' : 'transparent',
                              boxShadow: mode === m.id ? '0 2px 8px rgba(14,12,9,0.10)' : 'none',
                              border: mode === m.id ? '1px solid var(--rule)' : '1px solid transparent',
                            }}
                          >
                            <div className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>{m.t}</div>
                            <div className="text-[10px]" style={{ color: 'var(--muted2)' }}>{m.s}</div>
                          </button>
                        ))}
                      </div>

                      <div>
                        <label style={label}>
                          {mode === 'add' ? 'Extra PCs — how many?' : 'New total PCs'}
                        </label>
                        <input
                          ref={pcsRef}
                          value={pcs}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v === '' || /^\d+$/.test(v)) setPcs(v)
                          }}
                          onKeyDown={(e) => handleEnter(e, amountRef)}
                          inputMode="numeric"
                          placeholder={mode === 'add' ? 'Number of PCs' : 'Total PCs'}
                          className="font-serif transition-all focus:ring-2 focus:ring-yellow-700/20"
                          style={field}
                        />
                        <div className="text-[11px] mt-1.5" style={{ color: 'var(--muted2)' }}>
                          {mode === 'add'
                            ? `Adds on top of ${totalOf(selected)} · ceiling ${PC_MAX_TOTAL}`
                            : `Base is ${basePcsFor(selected.plan_type)} · ceiling ${PC_MAX_TOTAL}`}
                        </div>
                      </div>

                      <div>
                        <label style={label}>Amount received · ₹</label>
                        <input
                          ref={amountRef}
                          value={amount}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v === '' || /^\d+$/.test(v)) setAmount(v)
                          }}
                          onKeyDown={(e) => handleEnter(e, notesRef)}
                          inputMode="numeric"
                          placeholder="Amount in ₹"
                          className="font-serif transition-all focus:ring-2 focus:ring-yellow-700/20"
                          style={field}
                        />
                        <div className="text-[11px] mt-1.5" style={{ color: 'var(--muted2)' }}>
                          Suggested ₹{PC_EXTRA_PRICE.toLocaleString('en-IN')} per extra PC · leave blank if unpaid
                        </div>
                      </div>

                      <div>
                        <label style={label}>Note <span style={{ color: 'var(--muted2)', fontWeight: 400 }}>(optional)</span></label>
                        <input
                          ref={notesRef}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          onKeyDown={(e) => handleEnter(e, submitRef)}
                          placeholder="UPI ref / bill no. / remark…"
                          className="transition-all focus:ring-2 focus:ring-yellow-700/20"
                          style={field}
                        />
                      </div>

                      {/* Live preview */}
                      <div
                        className="rounded-xl px-4 py-3.5 text-center transition-all"
                        style={{
                          background: preview != null ? 'rgba(21,128,61,0.07)' : 'var(--cream)',
                          border: `1px dashed ${preview != null ? 'rgba(21,128,61,0.35)' : 'var(--rule)'}`,
                        }}
                      >
                        {preview != null ? (
                          <div className="text-sm font-bold" style={{ color: 'var(--green)' }}>
                            New total: {preview} PC{preview === 1 ? '' : 's'}
                            <span className="font-normal" style={{ color: 'var(--muted)' }}>
                              {mode === 'add' ? `  ·  ${totalOf(selected)} + ${Math.floor(Number(pcs))}` : '  ·  set exact'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[13px]" style={{ color: 'var(--muted2)' }}>
                            Type the PC count above to preview the new total
                          </div>
                        )}
                      </div>

                      <button
                        ref={submitRef}
                        onClick={submit}
                        disabled={saving}
                        className="w-full rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:cursor-wait h-[50px]"
                        style={{ background: 'linear-gradient(135deg, var(--gold3), var(--gold))', color: '#fff', boxShadow: '0 4px 16px rgba(168,125,30,0.35)' }}
                      >
                        {saving ? 'Granting…' : preview != null ? `Grant → ${preview} PC${preview === 1 ? '' : 's'}` : 'Grant PCs'}
                      </button>
                      <p className="text-[11px] leading-relaxed text-center" style={{ color: 'var(--muted2)' }}>
                        The jeweller&apos;s software enforces this as its LAN cap on the next sync — no key re-entry needed.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Recent grants ── */}
          <div className="mt-4 overflow-hidden" style={card}>
            <div
              className="px-5 py-3 text-[10px] font-bold uppercase tracking-[1.5px]"
              style={{ color: 'var(--muted)', borderBottom: '1px solid var(--rule)', background: 'var(--cream)' }}
            >
              Recent grants
            </div>
            {history.length === 0 ? (
              <div className="px-5 py-7 text-[13px] text-center" style={{ color: 'var(--muted2)' }}>
                No PC grants recorded yet.
              </div>
            ) : (
              history.slice(0, 8).map((h) => (
                <div
                  key={h.id}
                  className="px-5 py-3 flex items-center gap-3"
                  style={{ borderBottom: '1px solid rgba(14,12,9,0.05)' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold font-serif"
                    style={{ background: 'var(--gold-bg)', color: 'var(--gold3)', border: '1px solid var(--gold-ln)' }}
                  >
                    +{h.added_pcs}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold font-mono truncate" style={{ color: 'var(--ink)' }}>
                      {h.license_key || `#${h.license_id}`}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: 'var(--muted2)' }}>
                      {new Date(h.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {h.amount_paid ? ` · ₹${Number(h.amount_paid).toLocaleString('en-IN')}` : ''}
                      {h.notes ? ` · ${h.notes}` : ''}
                    </div>
                  </div>
                  <div className="font-serif text-base font-bold flex-shrink-0" style={{ color: 'var(--ink)' }}>
                    → {h.total_after}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
