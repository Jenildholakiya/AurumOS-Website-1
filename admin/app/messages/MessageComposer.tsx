'use client'

import { useMemo, useState } from 'react'

export type ClientRow = {
  key: string
  business_name: string
  owner_name: string
  city: string | null
  status: string
}

export type HistoryItem = {
  id: number
  title: string
  body: string
  priority: 'info' | 'warning' | 'critical'
  target_mode: 'all' | 'one' | 'many' | 'selected'
  target_keys: string[]
  target_count: number
  created_at: string
}

const TEMPLATES = [
  { label: 'Server maintenance', title: 'Scheduled maintenance tonight', body: 'AurumOS services will be under maintenance tonight 11 PM – 1 AM. Please save your work and keep the terminal online. No action needed after that.' },
  { label: 'Payment reminder', title: 'Subscription renewal due', body: 'Your AurumOS subscription renewal is due. Please contact support to renew and avoid interruption to your billing and stock features.' },
  { label: 'Urgent: update required', title: 'Urgent: please update your terminal', body: 'A critical update is required on your terminal. Please keep the system online for the next 30 minutes so the update can sync automatically.' },
  { label: 'Festival greetings', title: 'Festive greetings from AurumOS', body: 'Wishing you and your family a prosperous festive season. Thank you for trusting AurumOS with your business.' },
]

const PRIORITY_META = {
  info:     { label: 'Info',     dot: 'var(--blue)',  bg: 'rgba(59,130,246,0.08)',  bd: 'rgba(59,130,246,0.25)' },
  warning:  { label: 'Warning',  dot: 'var(--gold)',  bg: 'rgba(201,162,39,0.08)',  bd: 'rgba(201,162,39,0.30)' },
  critical: { label: 'Critical', dot: 'var(--red)',   bg: 'rgba(185,28,28,0.08)',   bd: 'rgba(185,28,28,0.30)' },
} as const

export default function MessageComposer({ clients, initialHistory }: { clients: ClientRow[]; initialHistory: HistoryItem[] }) {
  const [search, setSearch] = useState('')
  const [sendAll, setSendAll] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [priority, setPriority] = useState<'info' | 'warning' | 'critical'>('warning')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [busyId, setBusyId] = useState<number | 'all' | null>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      c.business_name.toLowerCase().includes(q) ||
      c.owner_name.toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      c.key.toLowerCase().includes(q)
    )
  }, [clients, search])

  const activeCount = sendAll ? clients.length : selected.size

  function toggleKey(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleFiltered() {
    setSelected(prev => {
      const next = new Set(prev)
      const allIn = filtered.every(c => next.has(c.key))
      if (allIn) filtered.forEach(c => next.delete(c.key))
      else filtered.forEach(c => next.add(c.key))
      return next
    })
  }

  async function refreshHistory() {
    const h = await fetch('/api/messages').then(r => r.json()).catch(() => null)
    if (h?.messages) setHistory(h.messages)
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this message? It will also be retracted from terminals.')) return
    setBusyId(id); setError(''); setDone('')
    try {
      const res = await fetch(`/api/messages?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Delete failed')
      setDone('Message deleted and retracted from terminals.')
      await refreshHistory()
    } catch (e: any) {
      setError(e.message || 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleClearAll() {
    if (history.length === 0) return
    if (!window.confirm(`Delete ALL ${history.length} sent messages? Terminals will clear them too.`)) return
    setBusyId('all'); setError(''); setDone('')
    try {
      const res = await fetch('/api/messages?all=true', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Clear failed')
      setDone(`Cleared ${data.deleted} message${data.deleted === 1 ? '' : 's'}. Terminals will clear them too.`)
      await refreshHistory()
    } catch (e: any) {
      setError(e.message || 'Clear failed')
    } finally {
      setBusyId(null)
    }
  }
  async function handleSend() {
    setError('')
    setDone('')
    if (!title.trim()) { setError('Please add a short title.'); return }
    if (!body.trim()) { setError('Please write the message.'); return }
    if (!sendAll && selected.size === 0) { setError('Select at least one client — or switch on “All clients”.'); return }

    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          priority,
          target_mode: sendAll ? 'all' : 'selected',
          target_keys: sendAll ? [] : Array.from(selected),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Send failed')
      setDone(`Delivered to ${data.delivered_to} client${data.delivered_to === 1 ? '' : 's'}. It will pop up on their terminal instantly.`)
      setTitle('')
      setBody('')
      setSelected(new Set())
      const h = await fetch('/api/messages').then(r => r.json()).catch(() => null)
      if (h?.messages) setHistory(h.messages)
    } catch (e: any) {
      setError(e.message || 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const labelStyle = {
    fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase' as const,
    letterSpacing: '0.9px', color: 'var(--muted)', marginBottom: '5px', display: 'block',
  }
  const inputStyle = {
    background: 'var(--cream)', border: '1px solid var(--rule)', color: 'var(--ink)',
    borderRadius: '8px', height: '40px', padding: '0 12px', fontSize: '0.875rem', width: '100%', outline: 'none',
  }

  const pm = PRIORITY_META[priority]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 fade-up">
        <h2 className="font-serif text-2xl md:text-3xl" style={{ color: 'var(--ink)', letterSpacing: '-0.5px' }}>
          Message <em style={{ color: 'var(--gold3)' }}>Jewellers</em>
        </h2>
        <p className="text-sm mt-1.5" style={{ color: 'var(--muted)' }}>
          Send an urgent message straight to an owner&apos;s terminal. Pick clients — or broadcast to everyone at once.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

        {/* ── Client picker ── */}
        <div className="lg:col-span-2 bg-cream2 rounded-2xl overflow-hidden fade-up flex flex-col"
             style={{ border: '1px solid var(--rule)', animationDelay: '0.05s', maxHeight: '640px' }}>
          <div className="absolute" />
          <div className="h-1 flex-shrink-0" style={{ background: 'linear-gradient(90deg, var(--gold3), var(--gold2))' }} />
          <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--rule)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink2)', letterSpacing: '1px' }}>
                Select Clients
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{ background: 'var(--gold-bg)', color: 'var(--gold3)', border: '1px solid var(--gold-ln)' }}>
                {activeCount} picked
              </span>
            </div>

            {/* All-clients switch */}
            <button type="button" onClick={() => setSendAll(v => !v)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl mb-3 transition-all"
                    style={{
                      background: sendAll ? 'var(--gold-bg)' : 'var(--cream)',
                      border: sendAll ? '1px solid var(--gold2)' : '1px solid var(--rule)',
                    }}>
              <span className="flex items-center gap-2.5">
                <span className="w-9 h-5 rounded-full relative flex-shrink-0 transition-colors"
                      style={{ background: sendAll ? 'var(--gold)' : 'var(--cream3)' }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                        style={{ background: '#fff', left: sendAll ? '18px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
                </span>
                <span className="text-left">
                  <span className="block text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>All clients</span>
                  <span className="block text-[11px]" style={{ color: 'var(--muted2)' }}>Broadcast to all {clients.length} active</span>
                </span>
              </span>
              {sendAll && <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--gold3)' }}>On</span>}
            </button>

            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search business, owner, city, key…" style={inputStyle} disabled={sendAll} />
          </div>

          <div className="flex-1 overflow-y-auto">
            {sendAll ? (
              <div className="px-5 py-8 text-center">
                <div className="w-11 h-11 mx-auto mb-3 rounded-xl flex items-center justify-center"
                     style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-ln)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-8-8 18-2.5-7.5z" /></svg>
                </div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>Broadcast mode</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Every active terminal gets this message.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-xs" style={{ color: 'var(--muted2)' }}>No clients match “{search}”.</p>
              </div>
            ) : (
              <>
                <button type="button" onClick={toggleFiltered}
                        className="w-full text-left px-5 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:bg-[var(--cream)]"
                        style={{ color: 'var(--gold3)', borderBottom: '1px solid rgba(14,12,9,0.04)' }}>
                  {filtered.every(c => selected.has(c.key)) ? 'Deselect visible' : `Select visible (${filtered.length})`}
                </button>
                {filtered.map(c => {
                  const on = selected.has(c.key)
                  return (
                    <button key={c.key} type="button" onClick={() => toggleKey(c.key)}
                            className="w-full px-5 py-3 flex items-center gap-3 text-left transition-colors hover:bg-[var(--cream)]"
                            style={{ borderBottom: '1px solid rgba(14,12,9,0.04)', background: on ? 'var(--gold-bg)' : 'transparent' }}>
                      <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                            style={{
                              background: on ? 'var(--gold)' : 'transparent',
                              border: on ? '1px solid var(--gold)' : '1px solid var(--cream3)',
                              color: '#fff', fontSize: '11px', fontWeight: 700,
                            }}>
                        {on ? '✓' : ''}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{c.business_name}</span>
                        <span className="block text-[11px] truncate" style={{ color: 'var(--muted2)' }}>
                          {c.owner_name}{c.city ? ` · ${c.city}` : ''}
                        </span>
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 hidden sm:inline-block"
                            style={{ background: 'var(--cream)', color: 'var(--muted)', border: '1px solid var(--rule)' }}>
                        {c.key.slice(0, 8)}…
                      </span>
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* ── Composer ── */}
        <div className="lg:col-span-3 bg-cream2 rounded-2xl overflow-hidden fade-up"
             style={{ border: '1px solid var(--rule)', animationDelay: '0.1s' }}>
          <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--ink), var(--gold2))' }} />
          <div className="p-5 md:p-6 space-y-5">
            <div>
              <label style={labelStyle}>Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PRIORITY_META) as Array<keyof typeof PRIORITY_META>).map(p => {
                  const m = PRIORITY_META[p]
                  const active = priority === p
                  return (
                    <button key={p} type="button" onClick={() => setPriority(p)}
                            className="px-3 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
                            style={{
                              background: active ? m.bg : 'var(--cream)',
                              border: active ? `1.5px solid ${m.dot}` : '1px solid var(--rule)',
                              color: 'var(--ink)',
                            }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: m.dot }} />
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} maxLength={120}
                     placeholder="e.g. Urgent: keep terminal online tonight" style={inputStyle} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-[5px]">
                <label style={{ ...labelStyle, marginBottom: 0 }}>Message</label>
                <span className="text-[10px] font-mono" style={{ color: 'var(--muted2)' }}>{body.length}/1000</span>
              </div>
              <textarea value={body} onChange={e => setBody(e.target.value.slice(0, 1000))} rows={4}
                        placeholder="Write a short, clear message for the owner…"
                        style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical', minHeight: '104px' }} />
            </div>

            <div>
              <label style={labelStyle}>Quick templates</label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.label} type="button"
                          onClick={() => { setTitle(t.title); setBody(t.body) }}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:bg-[rgba(168,125,30,0.07)]"
                          style={{ color: 'var(--gold3)', border: '1px solid rgba(168,125,30,0.2)', background: 'var(--cream)' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview — what the owner sees */}
            <div>
              <label style={labelStyle}>Owner sees this</label>
              <div className="rounded-xl p-4 flex gap-3"
                   style={{ background: pm.bg, border: `1px solid ${pm.bd}` }}>
                <span className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ background: pm.dot }} />
                <div className="min-w-0">
                  <div className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>
                    {title.trim() || 'Your title appears here'}
                  </div>
                  <div className="text-[13px] mt-1 whitespace-pre-wrap" style={{ color: 'var(--ink2)' }}>
                    {body.trim() || 'Your message appears here…'}
                  </div>
                  <div className="text-[10px] font-mono mt-2" style={{ color: 'var(--muted2)' }}>
                    AurumOS · {PRIORITY_META[priority].label} · just now
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-xs font-medium px-3 py-2.5 rounded-lg"
                   style={{ background: 'rgba(185,28,28,0.07)', color: 'var(--red)', border: '1px solid rgba(185,28,28,0.2)' }}>
                {error}
              </div>
            )}
            {done && (
              <div className="text-xs font-medium px-3 py-2.5 rounded-lg"
                   style={{ background: 'rgba(21,128,61,0.07)', color: 'var(--green)', border: '1px solid rgba(21,128,61,0.2)' }}>
                {done}
              </div>
            )}

            <button type="button" onClick={handleSend} disabled={sending}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                    style={{
                      background: sending ? 'var(--muted2)' : 'var(--ink)',
                      color: 'var(--cream)',
                      boxShadow: '0 2px 8px rgba(14,12,9,0.15)',
                      opacity: sending ? 0.7 : 1,
                    }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></svg>
              {sending ? 'Sending…' : sendAll ? `Broadcast to all ${clients.length} clients` : `Send to ${selected.size} client${selected.size === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      </div>

      {/* ── History ── */}
      <div className="bg-cream2 rounded-2xl overflow-hidden fade-up" style={{ border: '1px solid var(--rule)', animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--rule)' }}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--ink2)', letterSpacing: '1px' }}>
              Sent Messages
            </span>
            <span className="text-[10px] mt-0.5 block" style={{ color: 'var(--muted2)' }}>
              Last {history.length} broadcasts
            </span>
          </div>
          {history.length > 0 && (
            <button type="button" onClick={handleClearAll} disabled={busyId === 'all'}
                    className="text-[10px] font-semibold uppercase px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      color: 'var(--red)',
                      border: '1px solid rgba(185,28,28,0.25)',
                      background: 'rgba(185,28,28,0.05)',
                      opacity: busyId === 'all' ? 0.6 : 1,
                      letterSpacing: '0.5px',
                    }}>
              {busyId === 'all' ? 'Clearing…' : 'Clear all'}
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-xs" style={{ color: 'var(--muted2)' }}>Nothing sent yet. Your urgent messages will appear here.</p>
          </div>
        ) : (
          <div>
            {history.map(h => {
              const m = PRIORITY_META[h.priority] || PRIORITY_META.info
              return (
                <div key={h.id} className="px-5 py-4 hover:bg-[var(--cream)] transition-colors"
                     style={{ borderBottom: '1px solid rgba(14,12,9,0.04)' }}>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: m.bg, color: m.dot, border: `1px solid ${m.bd}` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />
                      {m.label}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                          style={{ background: 'var(--cream)', color: 'var(--muted)', border: '1px solid var(--rule)' }}>
                      {h.target_mode === 'all' ? `All · ${h.target_count}` : `${h.target_count} selected`}
                    </span>
                    <span className="text-[10px] ml-auto" style={{ color: 'var(--muted2)' }}>
                      {new Date(h.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button type="button" onClick={() => handleDelete(h.id)} disabled={busyId === h.id}
                            title="Delete this message"
                            className="w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all flex-shrink-0"
                            style={{
                              color: busyId === h.id ? 'var(--muted2)' : 'var(--red)',
                              border: '1px solid rgba(185,28,28,0.2)',
                              background: 'transparent',
                              opacity: busyId === h.id ? 0.6 : 1,
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(185,28,28,0.08)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                      {busyId === h.id ? '…' : '✕'}
                    </button>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{h.title}</div>
                  <div className="text-[13px] mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--ink3)' }}>{h.body}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
