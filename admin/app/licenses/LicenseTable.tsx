'use client'

import { useState, useEffect, useMemo, useRef } from 'react'

import { createPortal } from 'react-dom'

import type { License } from '@/lib/license'

import { useRouter } from 'next/navigation'

import { isTrial, trialEndTime, isTrialExpired, formatRemaining } from '@/lib/trial'
import { getSubscriptionInfo, type SubscriptionStatus } from '@/lib/subscription'

import { PLANS, PLAN_ORDER, FEATURES, getPlanFeatures, normalizePlan, type PlanId } from '@/lib/plans'



function StatusBadge({ status }: { status: string }) {

  if (status === 'active') {

    return (

      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"

            style={{ background: 'rgba(21,128,61,0.08)', color: 'var(--green)', border: '1px solid rgba(21,128,61,0.2)' }}>

        <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />Active

      </span>

    )

  }

  if (status === 'revoked') {

    return (

      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"

            style={{ background: 'rgba(185,28,28,0.08)', color: 'var(--red)', border: '1px solid rgba(185,28,28,0.2)' }}>

        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />Revoked

      </span>

    )

  }

  if (status === 'expired') {

    return (

      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"

            style={{ background: 'rgba(120,53,15,0.10)', color: 'var(--gold)', border: '1px solid rgba(124,45,18,0.28)' }}>

        <span className="w-1.5 h-1.5 rounded-full bg-orange-700 animate-pulse" />Expired

      </span>

    )

  }

  return (

    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"

          style={{ background: 'rgba(180,83,9,0.08)', color: 'var(--gold)', border: '1px solid rgba(180,83,9,0.2)' }}>

      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Pending

    </span>

  )

}



export default function LicenseTable({ licenses: initialLicenses = [] }: { licenses: License[] }) {

  const [licenses, setLicenses] = useState<License[]>(initialLicenses)

  const [search, setSearch] = useState('')

  const [filter, setFilter] = useState('all')

  const [copied, setCopied] = useState<string | null>(null)

  const [loading, setLoading] = useState<number | null>(null)



  // Modals

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [activeLic, setActiveLic] = useState<License | null>(null)

  const [trialDays, setTrialDays] = useState('')

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [deleteTargetLic, setDeleteTargetLic] = useState<License | null>(null)



  // Connection Ceiling Modal State Overlays

  const [isConnModalOpen, setIsConnModalOpen] = useState(false)

  const [activeConnLic, setActiveConnLic] = useState<License | null>(null)

  const [connectionLimitInput, setConnectionLimitInput] = useState('')



  // Plan change modal

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)

  const [activePlanLic, setActivePlanLic] = useState<License | null>(null)

  const [planChoice, setPlanChoice] = useState<PlanId>('lite')

  const [planDuration, setPlanDuration] = useState('365')


  // Confirm modals (renew / revoke / terminate trial)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    message: string
    accent: 'gold' | 'red'
    onConfirm: () => void
  }>({ open: false, title: '', message: '', accent: 'gold', onConfirm: () => {} })



  // Safe Multi-click Toast State Ref

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({

    show: false,

    msg: '',

    type: 'success'

  })



  const [mounted, setMounted] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)

  const router = useRouter()



  // Close dropdown on outside click
  useEffect(() => {
    if (openDropdown === null) return
    const handler = () => { setOpenDropdown(null); setDropdownPos(null); }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openDropdown])

  // Real-time clock for all trial countdowns (single shared 1s ticker).

  const [nowTick, setNowTick] = useState(() => Date.now())

  // Guards so an expired trial's auto-terminate PATCH fires exactly once.

  const expiredFiredRef = useRef<Set<number>>(new Set())



  useEffect(() => {

    setLicenses(initialLicenses)

  }, [initialLicenses])



  useEffect(() => {

    setMounted(true)

    return () => setMounted(false)

  }, [])



  // Master 1-second ticker that drives every countdown.

  useEffect(() => {

    const t = setInterval(() => setNowTick(Date.now()), 1000)

    return () => clearInterval(t)

  }, [])



  // Real-time termination: the instant a trial horizon elapses, flip the

  // record to "expired" server-side so the lock is persisted immediately.

  useEffect(() => {

    for (const lic of licenses) {

      if (isTrial(lic) && isTrialExpired(lic, nowTick) && !expiredFiredRef.current.has(lic.id)) {

        expiredFiredRef.current.add(lic.id)

        handleAutoExpire(lic.id)

      }

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [nowTick, licenses])



  async function handleAutoExpire(id: number) {

    try {

      const res = await fetch(`/api/nexus/handshake?id=${id}`, {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ status: 'expired' }),

      })

      if (res.ok) router.refresh()

    } catch {

      // Best-effort: the ERP client is already locked via /api/check.

      expiredFiredRef.current.delete(id)

    }

  }



  const filtered = useMemo(() => {

    const q = search.toLowerCase().trim()

    return (licenses || []).filter(l => {

      if (!l) return false

      const matchQ = !q || 

        (l.business_name && l.business_name.toLowerCase().includes(q)) ||

        (l.key && l.key.toLowerCase().includes(q)) ||

        (l.owner_name && l.owner_name.toLowerCase().includes(q)) ||

        (l.city && l.city.toLowerCase().includes(q))

      const matchF = filter === 'all' || l.status === filter

      return matchQ && matchF

    })

  }, [licenses, search, filter])



  function triggerNotification(msg: string, type: 'success' | 'error' = 'success') {

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)

    setToast({ show: true, msg, type })

    toastTimeoutRef.current = setTimeout(() => {

      setToast(prev => ({ ...prev, show: false }))

    }, 3000)

  }



  async function copyKey(key: string) {

    await navigator.clipboard.writeText(key)

    setCopied(key)

    setTimeout(() => setCopied(null), 1500)

  }



  async function handleActivate(id: number, bizName: string) {

    const previousLicenses = [...licenses]

    const targetLic = licenses.find(l => l.id === id)

    const shouldFillDefaults = !targetLic || !targetLic.plan_type

    const resolvedPlan = shouldFillDefaults ? 'pro' : targetLic.plan_type

    const resolvedDays = shouldFillDefaults ? 365 : targetLic.duration_days



    setLicenses(prev => prev.map(l => l.id === id ? { 

      ...l, status: 'active', plan_type: resolvedPlan, duration_days: resolvedDays 

    } : l))

    

    triggerNotification(`${bizName} has been activated as ${resolvedPlan.toUpperCase()}.`)



    try {

      // UPDATED: Rerouted to core subfolder API endpoint layout parameter

      const res = await fetch(`/api/nexus/handshake?id=${id}`, {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ status: 'active', plan_type: resolvedPlan, duration_days: resolvedDays })

      })

      if (!res.ok) throw new Error()

      router.refresh()

    } catch (err) {

      setLicenses(previousLicenses)

      triggerNotification('Failed to sync activation status to server.', 'error')

    }

  }

  async function handleRenewSubscription(lic: any) {
    const sub = getSubscriptionInfo(lic)
    const amount = sub.renewal_amount ? ` (${sub.renewal_amount.toLocaleString('en-IN')}/yr)` : ''
    setConfirmModal({
      open: true,
      title: 'Renew Subscription',
      message: `Renew subscription for ${lic.business_name}?${amount}`,
      accent: 'gold',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/subscription/renew', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: lic.id }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Renewal failed')

          setLicenses(prev => prev.map(l => l.id === lic.id
            ? { ...l, subscription_expires_at: data.subscription_expires_at, plan_type: data.plan }
            : l
          ))
          triggerNotification(`${lic.business_name} renewed until ${new Date(data.subscription_expires_at).toLocaleDateString('en-GB')}`)
        } catch (err: any) {
          triggerNotification(err.message || 'Renewal failed', 'error')
        }
      }
    })
  }

  async function handleRevoke(id: number, bizName: string) {
    setConfirmModal({
      open: true,
      title: 'Revoke License',
      message: `Revoke ${bizName}? This will instantly lock their software and wipe the hardware footprint.`,
      accent: 'red',
      onConfirm: async () => {
        const previousLicenses = [...licenses]

        setLicenses(prev => prev.map(l => l.id === id ? { 
          ...l, status: 'revoked', machine_id: null, activated_machine: null, activated_at: null, is_used: false 
        } : l))

        triggerNotification(`${bizName} revoked and footprint cleared.`)

        try {
          const res = await fetch(`/api/nexus/handshake?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: 'revoked', machine_id: null, activated_machine: null, activated_at: null, is_used: false
            })
          })

          if (!res.ok) throw new Error()

          router.refresh()

        } catch (err) {
          setLicenses(previousLicenses)
          triggerNotification('Failed to sync revocation matrix to cloud base.', 'error')
        }
      }
    })
  }



  async function handleAssignTrial(id: number) {

    const days = parseInt(trialDays)

    if (isNaN(days) || days <= 0) return triggerNotification('Enter a valid operational duration.', 'error')



    const previousLicenses = [...licenses]

    const targetLicense = licenses.find(l => l.id === id)

    const bizName = targetLicense ? targetLicense.business_name : 'The terminal'



    setLicenses(prev => prev.map(l => l.id === id ? {

      ...l, plan_type: 'lite', duration_days: days, is_used: false, status: 'active',

      machine_id: null, activated_machine: null,

      trial_started_at: new Date().toISOString()

    } : l))



    setIsModalOpen(false)

    triggerNotification(`Trial horizon of ${days} days assigned to ${bizName}.`)



    try {

      const res = await fetch(`/api/nexus/handshake?id=${id}`, {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ plan_type: 'free_trial', duration_days: days, is_used: false, status: 'active', machine_id: null, activated_machine: null }),

      })

      if (!res.ok) throw new Error()

      router.refresh()

    } catch (err) {

      setLicenses(previousLicenses)

      triggerNotification('Failed to provision evaluation context on server.', 'error')

    }

  }



  async function handleTextTerminateTrial(id: number) {
    const targetLicense = licenses.find(l => l.id === id)
    const bizName = targetLicense ? targetLicense.business_name : 'the jeweler'
    const days = Number(targetLicense?.duration_days) || 1
    const endedStart = new Date(Date.now() - days * 86400000).toISOString()

    setConfirmModal({
      open: true,
      title: 'Terminate Trial',
      message: `Are you sure you want to terminate the active trial for ${bizName}? This will end the timer and lock their terminal instantly.`,
      accent: 'red',
      onConfirm: async () => {
        const previousLicenses = [...licenses]

        setLicenses(prev => prev.map(l => l.id === id ? {
          ...l, status: 'expired', trial_started_at: endedStart
        } : l))

        triggerNotification(`Trial terminated. ${bizName}'s evaluation timer ended and terminal locked.`)

        try {
          const res = await fetch(`/api/nexus/handshake?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'expired', trial_started_at: endedStart }),
          })

          if (!res.ok) throw new Error()

          router.refresh()

        } catch (err) {
          setLicenses(previousLicenses)
          triggerNotification('Failed to broadcast trial termination parameters.', 'error')
        }
      }
    })
  }



  async function handleCommitConnectionCeiling(id: number) {

    const totalConnections = parseInt(connectionLimitInput)

    if (isNaN(totalConnections) || totalConnections < 0) return triggerNotification('Enter a valid connection allocation limit number.', 'error')



    const previousLicenses = [...licenses]

    const targetLic = licenses.find(l => l.id === id)

    const bizName = targetLic ? targetLic.business_name : 'Jeweler'



    setLicenses(prev => prev.map(l => l.id === id ? {

      ...l, max_allowed_connections: totalConnections

    } : l))



    setIsConnModalOpen(false)

    triggerNotification(`Ceiling set to ${totalConnections} terminal nodes for ${bizName}.`)



    try {

      // UPDATED: Rerouted to core subfolder API endpoint layout parameter

      const res = await fetch(`/api/nexus/handshake?id=${id}`, {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ max_allowed_connections: totalConnections }),

      })

      if (!res.ok) throw new Error()

      router.refresh()

    } catch (err) {

      setLicenses(previousLicenses)

      triggerNotification('Failed to sync node boundary matrices to database.', 'error')

    }

  }



  async function handleCommitPlan(id: number) {

    const days = parseInt(planDuration) || 365

    const previousLicenses = [...licenses]

    const targetLic = licenses.find(l => l.id === id)

    const bizName = targetLic ? targetLic.business_name : 'Jeweler'



    setLicenses(prev => prev.map(l => l.id === id ? {

      ...l, plan_type: planChoice, duration_days: days

    } : l))



    setIsPlanModalOpen(false)

    triggerNotification(`${bizName} moved to ${PLANS[planChoice].emoji} ${PLANS[planChoice].name} plan.`)



    try {

      const res = await fetch('/api/subscription/change-plan', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ id, plan: planChoice }),

      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Plan change failed')

      // Update local state with server response (new expiry date)
      setLicenses(prev => prev.map(l => l.id === id ? {
        ...l, plan_type: data.data.plan, subscription_expires_at: data.data.subscription_expires_at
      } : l))

      router.refresh()

    } catch (err) {

      setLicenses(previousLicenses)

      triggerNotification('Failed to sync plan change to server.', 'error')

    }

  }



  function openPlanModal(lic: License) {

    setActivePlanLic(lic)

    setPlanChoice(normalizePlan(lic.plan_type))

    setPlanDuration(String(lic.duration_days ?? 365))

    setIsPlanModalOpen(true)

  }



  async function handleToggleRebind(lic: License) {

    const next = !lic.allow_rebind

    const previousLicenses = [...licenses]

    setLicenses(prev => prev.map(l => l.id === lic.id ? { ...l, allow_rebind: next } : l))

    try {

      const res = await fetch(`/api/licenses/${lic.id}`, {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ allow_rebind: next }),

      })

      if (!res.ok) throw new Error()

      triggerNotification(next

        ? `Rebind enabled for ${lic.business_name} - key will follow the next machine that activates it.`

        : `Rebind disabled for ${lic.business_name}.`)

      router.refresh()

    } catch {

      setLicenses(previousLicenses)

      triggerNotification('Failed to update rebind setting.', 'error')

    }

  }



  async function handleConfirmDelete() {

    if (!deleteTargetLic) return

    const id = deleteTargetLic.id

    const bizName = deleteTargetLic.business_name



    setIsDeleteModalOpen(false)

    setLoading(id)



    try {

      // UPDATED: Rerouted to core subfolder API endpoint layout parameter via query string

      const res = await fetch(`/api/nexus/handshake?id=${id}`, { method: 'DELETE' })

      if (!res.ok) throw new Error()

      triggerNotification(`${bizName} successfully purged from inventory ledger.`)

      router.refresh()

    } catch (err) {

      triggerNotification('Failed to erase entity parameters from directory nodes.', 'error')

    } finally {

      setLoading(null)

      setDeleteTargetLic(null)

    }

  }



  function openTrialModal(lic: License) {

    setActiveLic(lic)

    setTrialDays('')

    setIsModalOpen(true)

  }



  if (!mounted) return null;



  return (

    <div>

      {/* Search & Filtering Control Matrix */}

      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">

        <div className="relative w-full lg:flex-1 lg:max-w-md">

          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </span>

          <input

            type="text"

            placeholder="Search business, key, city?"

            value={search}

            onChange={e => setSearch(e.target.value)}

            className="w-full h-10 pl-9 pr-4 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-700/20"

            style={{ background: 'var(--cream)', border: '1px solid var(--rule)', color: 'var(--ink)' }}

          />

        </div>



        <div className="flex flex-wrap items-center gap-2 lg:flex-1">

          {['all', 'active', 'revoked', 'pending'].map(f => (

            <button key={f} onClick={() => setFilter(f)}

              className="px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"

              style={{

                background: filter === f ? 'var(--ink)' : 'var(--cream)',

                color: filter === f ? 'var(--cream)' : 'var(--ink3)',

                border: `1px solid ${filter === f ? 'var(--ink)' : 'var(--rule)'}`,

                boxShadow: filter === f ? '0 4px 12px rgba(14,12,9,0.1)' : 'none'

              }}>

              {f}

            </button>

          ))}

          <span className="ml-auto text-xs font-mono pt-1 lg:pt-0" style={{ color: 'var(--muted2)' }}>

            Showing {filtered.length} of {licenses.length}

          </span>

        </div>

      </div>



      {/* Main Ledger Table Grid */}

      <div className="bg-cream2 rounded-xl overflow-hidden"

        style={{ border: '1px solid var(--rule)', boxShadow: '0 8px 30px rgba(14,12,9,0.04)' }}>

        <div className="overflow-x-auto w-full">

          <table className="w-full whitespace-nowrap">

            <thead>

              <tr style={{ background: 'var(--cream2)', borderBottom: '1px solid var(--rule)' }}>

                {['Business / Owner', 'License Key', 'City', 'Amount', 'Plan', 'Subscription', 'Machine ID', 'Status', 'Date', 'Actions'].map(h => (

                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-[1.5px]"

                    style={{ color: 'var(--muted)' }}>{h}</th>

                ))}

              </tr>

            </thead>

            <tbody>

              {filtered.length === 0 && (

                <tr>

                  <td colSpan={10} className="text-center py-16 text-sm" style={{ color: 'var(--muted2)' }}>

                    No ledger entries found matching your criteria.

                  </td>

                </tr>

              )}

              {filtered.map(lic => {

                const plan = normalizePlan(lic.plan_type)

                // A "trial" = a Lite plan with a finite (sub-annual) duration.

                const isTrialActive = isTrial(lic)

                const trialEnd = trialEndTime(lic)

                const remainingMs = trialEnd != null ? trialEnd - nowTick : 0

                const trialExpired = trialEnd != null && remainingMs <= 0



                return (

                  <tr key={lic.id} className="transition-all duration-200 hover:bg-yellow-900/[0.015]"
                    style={{ borderBottom: '1px solid rgba(14,12,9,0.04)' }}>

                    <td className="px-5 py-4">
                      <div className="min-w-[180px]">
                        <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{lic.business_name || '--'}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted2)' }}>{lic.owner_name || '--'}</div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] px-2 py-1 rounded-md tracking-wider"
                          style={{ background: 'var(--cream3)', color: 'var(--ink)', border: '1px solid var(--rule)' }}>
                          {copied === lic.key ? 'Copied!' : lic.key}
                        </span>
                        <button onClick={() => { navigator.clipboard.writeText(lic.key); setCopied(lic.key); setTimeout(() => setCopied(null), 2000); }}
                          className="w-6 h-6 rounded flex items-center justify-center transition-all"
                          style={{ color: copied === lic.key ? 'var(--green)' : 'var(--muted2)' }}
                          title="Copy key">
                          {copied === lic.key
                            ? <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                            : <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                          }
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--ink3)' }}>{lic.city || '--'}</td>

                    <td className="px-5 py-4 font-mono text-sm font-normal" style={{ color: 'var(--ink)' }}>
                      {lic.amount_paid ? `\u20B9${Number(lic.amount_paid).toLocaleString('en-IN')}` : '--'}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                            style={{ background: `${PLANS[plan].accent}14`, color: PLANS[plan].accent, border: `1px solid ${PLANS[plan].accent}33` }}>
                        {PLANS[plan].emoji} {PLANS[plan].name}
                      </span>
                      {isTrialActive && (
                        <div className="mt-1.5">
                          {trialExpired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider"
                                  style={{ background: 'rgba(124,45,18,0.10)', color: 'var(--gold)', border: '1px solid rgba(124,45,18,0.28)' }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-700 animate-pulse" />Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider"
                                  style={{ background: 'rgba(168,125,30,0.10)', color: 'var(--gold3)', border: '1px solid var(--gold-ln)' }}
                                  title="Trial time remaining">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              {formatRemaining(remainingMs)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {(() => {
                        const sub = getSubscriptionInfo(lic)
                        if (!lic.subscription_expires_at) return <span className="text-xs italic" style={{ color: 'var(--muted2)' }}>Perpetual</span>
                        const expiryDate = new Date(lic.subscription_expires_at).toLocaleDateString('en-GB')
                        if (sub.status === 'active') {
                          return (
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-medium" style={{ color: 'var(--green)' }}>
                                {expiryDate}
                              </span>
                              <span className="text-[9px] font-bold" style={{ color: 'var(--muted2)' }}>
                                {sub.remaining_days}d left
                              </span>
                            </div>
                          )
                        }
                        if (sub.status === 'grace') {
                          return (
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold" style={{ color: 'var(--gold)' }}>
                                Grace Period
                              </span>
                              <span className="text-[9px] font-bold" style={{ color: 'var(--gold3)' }}>
                                {sub.grace_remaining_days}d remaining
                              </span>
                            </div>
                          )
                        }
                        return (
                          <span className="text-[11px] font-bold" style={{ color: 'var(--red)' }}>
                            Expired
                          </span>
                        )
                      })()}
                    </td>

                    <td className="px-5 py-4">
                      {lic.machine_id ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[11px] px-2 py-1 rounded-md tracking-wider"
                            style={{ background: 'var(--cream3)', color: 'var(--ink3)', border: '1px solid var(--rule)' }}>
                            {lic.machine_id.substring(0, 8)}...
                          </span>
                          {lic.allow_rebind && (
                            <span className="text-[9px] font-bold uppercase tracking-wider"
                              style={{ color: 'var(--gold3)' }}>Rebind on</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs italic" style={{ color: 'var(--muted2)' }}>Not activated</span>
                      )}
                    </td>

                    <td className="px-5 py-4"><StatusBadge status={lic.status} /></td>

                    <td className="px-5 py-4 font-mono text-xs" style={{ color: 'var(--muted2)' }}>
                      {new Date(lic.created_at).toLocaleDateString('en-GB')}
                    </td>

                    <td className="px-5 py-4">
                        <button
                          ref={(el) => { if (el) (el as any).__licId = lic.id; }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openDropdown === lic.id) { setOpenDropdown(null); setDropdownPos(null); return; }
                            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setDropdownPos({ top: r.bottom + 4, left: r.right - 208 });
                            setOpenDropdown(lic.id);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: openDropdown === lic.id ? 'var(--gold-bg)' : 'var(--cream2)', border: '1px solid var(--rule)', color: 'var(--ink3)' }}
                          title="Actions">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                        </button>
                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      </div>

      {/* Actions dropdown — portaled outside table overflow */}
      {openDropdown != null && dropdownPos && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => { setOpenDropdown(null); setDropdownPos(null); }} />
          <div className="fixed w-52 rounded-xl py-1.5 z-[9999] shadow-2xl"
               style={{ background: 'var(--cream3)', border: '1px solid var(--rule)', top: dropdownPos.top, left: dropdownPos.left }}
               onClick={(e) => e.stopPropagation()}>
            {(() => {
              const lic = licenses.find(l => l.id === openDropdown)
              if (!lic) return null
              const plan = normalizePlan(lic.plan_type)
              const trialActive = isTrial(lic)
              const expired = isTrialExpired(lic, nowTick)
              return (
                <>
                  {trialActive ? (
                    expired ? (
                      <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--gold)', opacity: 0.7 }}>Trial Expired</div>
                    ) : (
                      <button onClick={() => { handleTextTerminateTrial(lic.id); setOpenDropdown(null); setDropdownPos(null); }}
                        disabled={loading === lic.id}
                        className="w-full text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-[rgba(185,28,28,0.06)]"
                        style={{ color: 'var(--red)' }}>Terminate Trial</button>
                    )
                  ) : (
                    <button onClick={() => { openTrialModal(lic); setOpenDropdown(null); setDropdownPos(null); }}
                      disabled={loading === lic.id}
                      className="w-full text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-[rgba(168,125,30,0.06)]"
                      style={{ color: 'var(--gold3)' }}>Provision Trial</button>
                  )}
                  <div className="my-1 mx-3" style={{ borderTop: '1px solid var(--rule)' }} />
                  <button onClick={() => { setActiveConnLic(lic); setConnectionLimitInput(String(lic.max_allowed_connections ?? 0)); setIsConnModalOpen(true); setOpenDropdown(null); setDropdownPos(null); }}
                    disabled={loading === lic.id}
                    className="w-full text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-[rgba(168,125,30,0.06)]"
                    style={{ color: 'var(--ink)' }}>Connection Limit ({lic.max_allowed_connections ?? 0})</button>
                  <button onClick={() => { openPlanModal(lic); setOpenDropdown(null); setDropdownPos(null); }}
                    disabled={loading === lic.id}
                    className="w-full text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-[rgba(168,125,30,0.06)]"
                    style={{ color: PLANS[plan].accent }}>Change Plan</button>
                  <button onClick={() => { handleRenewSubscription(lic); setOpenDropdown(null); setDropdownPos(null); }}
                    disabled={loading === lic.id}
                    className="w-full text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-[rgba(21,128,61,0.06)]"
                    style={{ color: 'var(--green)' }}>Renew Subscription</button>
                  <button onClick={() => { handleToggleRebind(lic); setOpenDropdown(null); setDropdownPos(null); }}
                    disabled={loading === lic.id}
                    className="w-full text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-[rgba(168,125,30,0.06)]"
                    style={{ color: lic.allow_rebind ? 'var(--gold3)' : 'var(--ink3)' }}>Rebind {lic.allow_rebind ? '(On)' : '(Off)'}</button>
                  <div className="my-1 mx-3" style={{ borderTop: '1px solid var(--rule)' }} />
                  {lic.status === 'active' ? (
                    <button onClick={() => { handleRevoke(lic.id, lic.business_name); setOpenDropdown(null); setDropdownPos(null); }}
                      className="w-full text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-[rgba(185,28,28,0.06)]"
                      style={{ color: 'var(--red)' }}>Revoke License</button>
                  ) : (
                    <button onClick={() => { handleActivate(lic.id, lic.business_name); setOpenDropdown(null); setDropdownPos(null); }}
                      className="w-full text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-[rgba(21,128,61,0.06)]"
                      style={{ color: 'var(--green)' }}>Activate License</button>
                  )}
                  <div className="my-1 mx-3" style={{ borderTop: '1px solid var(--rule)' }} />
                  <button onClick={() => { setDeleteTargetLic(lic); setIsDeleteModalOpen(true); setOpenDropdown(null); setDropdownPos(null); }}
                    disabled={loading === lic.id}
                    className="w-full text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-[rgba(185,28,28,0.06)]"
                    style={{ color: 'var(--red)' }}>Delete Ledger</button>
                </>
              )
            })()}
          </div>
        </>,
        document.body
      )}

      {isModalOpen && activeLic && createPortal(

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all animate-fade-in">

          <div className="bg-cream3 p-8 rounded-xl border w-full max-w-md relative text-center shadow-2xl animate-scale-up"

            style={{ borderColor: 'var(--rule)', fontFamily: "'DM Sans', sans-serif" }}>

            <div className="absolute top-0 left-0 right-0 h-[4px]"

              style={{ background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', borderRadius: '12px 12px 0 0' }} />

            <h3 className="font-serif text-3xl font-normal mb-2 tracking-tight" style={{ color: 'var(--ink)', fontFamily: '"DM Serif Display", Georgia, serif' }}>

              Provision Trial

            </h3>

            <p className="text-sm mb-7 leading-relaxed" style={{ color: 'var(--muted)' }}>

              Configuring evaluation lifecycle parameters for <br />

              <strong style={{ color: 'var(--ink)' }}>{activeLic.business_name}</strong>

            </p>

            <div className="flex flex-col gap-2 text-left mb-8">

              <label className="text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: 'var(--gold3)' }}>

                Operational Horizon (Days)

              </label>

              <input

                type="text"

                inputMode="numeric"

                pattern="[0-9]*"

                placeholder="e.g., 7"

                value={trialDays}

                onChange={e => {

                  const val = e.target.value;

                  if (val === '' || /^\d+$/.test(val)) setTrialDays(val);

                }}

                className="w-full h-12 px-4 rounded-lg text-lg outline-none font-mono font-semibold transition-all focus:ring-2 focus:ring-yellow-700/20"

                style={{ background: 'var(--cream2)', border: '1px solid var(--rule)', color: 'var(--ink)' }}

              />

            </div>

            <div className="grid grid-cols-2 gap-3">

              <button onClick={() => { setIsModalOpen(false); setActiveLic(null); }}

                className="h-11 text-xs font-bold uppercase tracking-wider rounded-lg border bg-cream hover:bg-cream2 transition-colors"

                style={{ color: 'var(--ink3)', borderColor: 'var(--rule)' }}>

                Cancel

              </button>

              <button onClick={() => handleAssignTrial(activeLic.id)}

                className="h-11 text-xs font-bold uppercase tracking-wider rounded-lg text-white transition-all hover:opacity-90 shadow-lg shadow-black/10"

                style={{ background: 'var(--ink)' }}>

                Confirm

              </button>

            </div>

          </div>

        </div>,

        document.body

      )}



      {/* Luxury-Editorial Connection Ceiling Adjustment Modal Overlay */}

      {isConnModalOpen && activeConnLic && createPortal(

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/25 backdrop-blur-md transition-all duration-300">

          <div className="bg-cream3 rounded-xl border w-full max-w-[420px] relative text-center p-8 overflow-hidden shadow-[0_25px_70px_-15px_rgba(0,0,0,0.12)]"

            style={{ borderColor: 'var(--rule)', fontFamily: "'DM Sans', sans-serif" }}>

            

            <div className="absolute top-0 left-0 right-0 h-[4px]"

              style={{ background: 'linear-gradient(90deg, transparent, var(--ink), transparent)' }} />

            

            <h3 className="font-serif text-3xl font-normal tracking-tight mb-1.5" 

                style={{ color: 'var(--ink)', fontFamily: '"DM Serif Display", Georgia, serif' }}>

              Nexus Nodes

            </h3>

            

            <p className="text-xs font-normal mb-6 tracking-normal px-4 leading-relaxed" style={{ color: 'var(--muted2)' }}>

              Set the maximum hardware allocation boundary allowed <br /> 

              for <span className="font-semibold" style={{ color: 'var(--ink)' }}>{activeConnLic.business_name}</span>.

            </p>



            <div className="mb-6 rounded-lg p-3.5 flex items-center justify-between text-left border" 

                 style={{ background: 'var(--cream2)', borderColor: 'rgba(14,12,9,0.04)' }}>

              <div className="flex flex-col gap-0.5">

                <span className="text-[9px] font-bold uppercase tracking-[1px]" style={{ color: 'var(--muted)' }}>

                  Active Pool

                </span>

                <span className="text-xs font-semibold" style={{ color: 'var(--ink3)' }}>

                  Authorized Stations Ceiling

                </span>

              </div>

              <div className="flex items-baseline gap-1 font-mono">

                <span className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>

                  {activeConnLic.max_allowed_connections ?? 0}

                </span>

                <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--muted2)' }}>

                  PCs

                </span>

              </div>

            </div>



            <div className="flex flex-col gap-2 text-left mb-8">

              <label className="text-[10px] font-bold uppercase tracking-[1.5px] ml-0.5" style={{ color: 'var(--gold3)' }}>

                New Connection Limit Value

              </label>

              <div className="relative">

                <input

                  type="text"

                  inputMode="numeric"

                  pattern="[0-9]*"

                  placeholder="e.g., 4"

                  value={connectionLimitInput}

                  onChange={e => {

                    const val = e.target.value;

                    if (val === '' || /^\d+$/.test(val)) setConnectionLimitInput(val);

                  }}

                  className="w-full h-12 px-4 rounded-lg text-xl font-mono font-medium outline-none transition-all border focus:ring-4 focus:ring-zinc-900/[0.03] focus:border-cream3"

                  style={{ background: 'var(--cream)', borderColor: 'var(--rule)', color: 'var(--ink)' }}

                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>

                  Max Nodes

                </span>

              </div>

            </div>



            <div className="grid grid-cols-2 gap-3">

              <button onClick={() => { setIsConnModalOpen(false); setActiveConnLic(null); }}

                className="h-11 text-xs font-bold uppercase tracking-wider rounded-lg border bg-cream hover:bg-cream2 transition-colors"

                style={{ color: 'var(--ink3)', borderColor: 'var(--rule)' }}>

                Cancel

              </button>

              <button onClick={() => handleCommitConnectionCeiling(activeConnLic.id)}

                className="h-11 text-xs font-bold uppercase tracking-wider rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.98]"

                style={{ background: 'var(--ink)' }}>

                Apply Limit

              </button>

            </div>

          </div>

        </div>,

        document.body

      )}



      {/* Subscription Plan Change Modal */}

      {isPlanModalOpen && activePlanLic && createPortal(

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all animate-fade-in">

          <div className="bg-cream3 rounded-xl border w-full max-w-lg relative text-center p-7 overflow-y-auto max-h-[90vh] shadow-2xl"

            style={{ borderColor: 'var(--rule)', fontFamily: "'DM Sans', sans-serif" }}>

            <div className="absolute top-0 left-0 right-0 h-[4px]"

              style={{ background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', borderRadius: '12px 12px 0 0' }} />

            <h3 className="font-serif text-2xl font-normal mb-1 tracking-tight" style={{ color: 'var(--ink)', fontFamily: '"DM Serif Display", Georgia, serif' }}>

              Change Plan

            </h3>

            <p className="text-xs mb-5" style={{ color: 'var(--muted2)' }}>

              Set subscription tier for <span className="font-semibold" style={{ color: 'var(--ink)' }}>{activePlanLic.business_name}</span>

            </p>



            <div className="grid grid-cols-3 gap-2 mb-4">

              {PLAN_ORDER.map(pid => {

                const p = PLANS[pid]

                const sel = planChoice === pid

                return (

                  <button key={pid} type="button" onClick={() => setPlanChoice(pid)} style={{

                    border: sel ? `2px solid ${p.accent}` : '1px solid var(--rule)',

                    borderRadius: '10px',

                    background: sel ? 'rgba(168,125,30,0.05)' : 'var(--cream)',

                    padding: '12px 8px',

                    cursor: 'pointer',

                    textAlign: 'center',

                    position: 'relative',

                  }}>

                    {sel && <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold" style={{ background: p.accent }}>&#10003;</span>}

                    <div className="text-lg mb-1">{p.emoji}</div>

                    <div className="text-[11px] font-bold text-ink">{p.name}</div>

                    <div className="text-[9px] font-mono text-amber-700 font-semibold mt-0.5">{p.billingNote}</div>

                  </button>

                )

              })}

            </div>



            {/* Features unlocked by the selected tier */}

            <div className="text-left mb-4 rounded-lg p-3 max-h-44 overflow-y-auto"

                 style={{ background: 'var(--cream)', border: '1px solid var(--rule)' }}>

              <div className="text-[10px] font-bold uppercase tracking-[1.5px] mb-2" style={{ color: 'var(--gold3)' }}>

                Features on {PLANS[planChoice].emoji} {PLANS[planChoice].name}

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">

                {getPlanFeatures(planChoice).map(fid => (

                  <div key={fid} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink3)' }}>

                    <span style={{ color: PLANS[planChoice].accent }}>&#10003;</span>

                    {FEATURES[fid]?.label ?? fid}

                  </div>

                ))}

              </div>

            </div>



            <div className="flex flex-col gap-2 text-left mb-5">

              <label className="text-[10px] font-bold uppercase tracking-[1.5px] ml-0.5" style={{ color: 'var(--gold3)' }}>

                Subscription Validity (Days)

              </label>

              <input

                type="text"

                inputMode="numeric"

                pattern="[0-9]*"

                value={planDuration}

                onChange={e => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setPlanDuration(v) }}

                className="w-full h-11 px-4 rounded-lg text-lg outline-none font-mono font-semibold transition-all focus:ring-2 focus:ring-yellow-700/20"

                style={{ background: 'var(--cream2)', border: '1px solid var(--rule)', color: 'var(--ink)' }}

              />

            </div>



            <div className="grid grid-cols-2 gap-3">

              <button onClick={() => { setIsPlanModalOpen(false); setActivePlanLic(null) }}

                className="h-11 text-xs font-bold uppercase tracking-wider rounded-lg border bg-cream hover:bg-cream2 transition-colors"

                style={{ color: 'var(--ink3)', borderColor: 'var(--rule)' }}>

                Cancel

              </button>

              <button onClick={() => handleCommitPlan(activePlanLic.id)}

                className="h-11 text-xs font-bold uppercase tracking-wider rounded-lg text-white transition-all hover:opacity-90 shadow-lg shadow-black/10"

                style={{ background: 'var(--ink)' }}>

                Apply Plan

              </button>

            </div>

          </div>

        </div>,

        document.body

      )}



      {/* Delete Ledger Warning Modal */}

      {isDeleteModalOpen && deleteTargetLic && createPortal(

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md transition-all animate-fade-in">

          <div className="bg-cream3 p-8 rounded-xl border w-full max-w-sm relative text-center shadow-2xl animate-scale-up"

            style={{ borderColor: 'var(--rule)', fontFamily: "'DM Sans', sans-serif" }}>

            <div className="absolute top-0 left-0 right-0 h-[4px]"

              style={{ background: 'linear-gradient(90deg, transparent, var(--red), transparent)', borderRadius: '12px 12px 0 0' }} />

            <div className="text-4xl mb-4"><svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{color:'var(--red)'}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>

            <h3 className="font-serif text-2xl font-normal mb-2" style={{ color: 'var(--ink)', fontFamily: '"DM Serif Display", Georgia, serif' }}>

              Remove Ledger

            </h3>

            <p className="text-xs mb-8 leading-relaxed" style={{ color: 'var(--muted)' }}>

              Are you sure you want to permanently delete <br />

              <strong style={{ color: 'var(--ink)' }} className="text-sm font-bold block mt-1">{deleteTargetLic.business_name}</strong>

              <span className="text-[11px] text-red-700 font-bold block mt-3 bg-red-50/80 py-2 px-3 rounded-md border border-red-100">

                This action is irreversible. All machine authentication bindings will be destroyed.

              </span>

            </p>

            <div className="grid grid-cols-2 gap-3">

              <button onClick={() => { setIsDeleteModalOpen(false); setDeleteTargetLic(null); }}

                className="h-11 text-xs font-bold uppercase tracking-wider rounded-lg border bg-cream hover:bg-cream2 transition-colors"

                style={{ color: 'var(--ink3)', borderColor: 'var(--rule)' }}>

                Cancel

              </button>

              <button onClick={handleConfirmDelete}

                className="h-11 text-xs font-bold uppercase tracking-wider rounded-lg text-white transition-all bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20">

                Erase

              </button>

            </div>

          </div>

        </div>,

        document.body

      )}



      {/* Confirm Modal */}
      {confirmModal.open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md transition-all animate-fade-in">
          <div className="bg-cream3 p-8 rounded-xl border w-full max-w-sm relative text-center shadow-2xl animate-scale-up"
            style={{ borderColor: 'var(--rule)', fontFamily: "'DM Sans', sans-serif" }}>
            <div className="absolute top-0 left-0 right-0 h-[4px]"
              style={{ background: `linear-gradient(90deg, transparent, var(--${confirmModal.accent === 'red' ? 'red' : 'gold'}), transparent)`, borderRadius: '12px 12px 0 0' }} />
            <div className="text-4xl mb-4">
              {confirmModal.accent === 'red' ? (
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{color:'var(--red)'}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              ) : (
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{color:'var(--gold)'}}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              )}
            </div>
            <h3 className="font-serif text-2xl font-normal mb-2" style={{ color: 'var(--ink)', fontFamily: '"DM Serif Display", Georgia, serif' }}>
              {confirmModal.title}
            </h3>
            <p className="text-xs mb-8 leading-relaxed" style={{ color: 'var(--muted)' }}>
              {confirmModal.message}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                className="h-11 text-xs font-bold uppercase tracking-wider rounded-lg border bg-cream hover:bg-cream2 transition-colors"
                style={{ color: 'var(--ink3)', borderColor: 'var(--rule)' }}>
                Cancel
              </button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(prev => ({ ...prev, open: false })); }}
                className={`h-11 text-xs font-bold uppercase tracking-wider rounded-lg text-white transition-all shadow-lg ${
                  confirmModal.accent === 'red'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                    : 'hover:opacity-90'
                }`}
                style={confirmModal.accent === 'gold' ? { background: 'var(--gold)', boxShadow: '0 4px 14px rgba(168,125,30,0.25)' } : {}}>
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* Luxury Telemetry Toast Alert */}

      {toast.show && createPortal(

        <div className="fixed top-6 right-6 z-[10005] flex flex-col gap-2 pointer-events-none animate-fade-in">

          <div className="bg-cream3 px-5 py-4 rounded-lg border shadow-2xl flex items-center gap-4 max-w-sm pointer-events-auto transition-all duration-300 transform"

            style={{

              borderColor: toast.type === 'success' ? 'rgba(21,128,61,0.2)' : 'rgba(185,28,28,0.2)',

              borderLeft: toast.type === 'success' ? '4px solid var(--green)' : '4px solid var(--red)',

              fontFamily: "'DM Sans', sans-serif"

            }}>

            <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"

              style={{ background: toast.type === 'success' ? 'var(--green)' : 'var(--red)' }}>

              {toast.type === 'success' ? 'OK' : '!'}

            </div>

            <div className="flex flex-col gap-0.5">

              <span className="text-[10px] font-bold uppercase tracking-[1.5px]"

                style={{ color: toast.type === 'success' ? 'var(--green)' : 'var(--red)' }}>

                System Telemetry

              </span>

              <p className="text-xs font-semibold m-0 p-0 leading-relaxed" style={{ color: 'var(--ink)' }}>

                {toast.msg}

              </p>

            </div>

          </div>

        </div>,

        document.body

      )}

    </div>

  )

}





