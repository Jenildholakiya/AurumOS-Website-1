import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { PLANS, PLAN_ORDER, FEATURES, getPlanFeatures, requiredPlanFor } from '@/lib/plans'

export default async function PlansPage() {
  const ok = await getSession()
  if (!ok) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--cream)' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-cream px-4 md:px-8 h-[60px] flex items-center justify-between"
             style={{ borderBottom: '1px solid var(--rule)' }}>
          <h1 className="font-serif text-xl" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>
            Subscription <em style={{ color: 'var(--gold3)' }}>Plans</em>
          </h1>
          <a href="/licenses/generate"
             className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-semibold transition-all whitespace-nowrap"
             style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
            New License
          </a>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full fade-up">
          <div className="mb-6">
            <h2 className="font-serif text-2xl" style={{ color: 'var(--ink)', letterSpacing: '-0.4px' }}>
              Choose the right tier
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Each plan inherits everything from the tier below it. Assign a plan when generating a license.
            </p>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {PLAN_ORDER.map(pid => {
              const p = PLANS[pid]
              return (
                <div key={pid} className="bg-cream2 rounded-xl overflow-hidden flex flex-col"
                     style={{ border: `1px solid ${p.accent}55`, boxShadow: '0 8px 30px rgba(14,12,9,0.05)' }}>
                  <div className="h-1" style={{ background: p.accent }} />
                  <div className="p-6">
                    <div className="text-3xl mb-2">{p.emoji}</div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-serif text-2xl" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>{p.name}</h3>
                    </div>
                    <div className="mt-3">
                      <div className="font-mono text-lg font-bold" style={{ color: p.accent }}>&#x20B9;{p.price.toLocaleString('en-IN')}</div>
                      <div className="text-xs" style={{ color: 'var(--muted2)' }}>+ &#x20B9;{p.yearly.toLocaleString('en-IN')}/yr</div>
                    </div>

                    <div className="mt-5 mb-3 text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: 'var(--gold3)' }}>
                      What's included
                    </div>
                    <ul className="space-y-1.5">
                      {getPlanFeatures(pid).map(fid => (
                        <li key={fid} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--ink3)' }}>
                          <span className="mt-0.5" style={{ color: p.accent }}>&#10003;</span>
                          <span>{FEATURES[fid]?.label ?? fid}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Full feature matrix */}
          <div className="bg-cream2 rounded-xl overflow-hidden"
               style={{ border: '1px solid var(--rule)', boxShadow: '0 1px 3px rgba(14,12,9,0.07)' }}>
            <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--rule)', background: 'var(--cream)' }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink2)', letterSpacing: '1px' }}>
                Feature Matrix
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--rule)', background: 'var(--cream)' }}>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: 'var(--muted)' }}>Feature</th>
                    {PLAN_ORDER.map(pid => (
                      <th key={pid} className="text-center px-5 py-3 text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: 'var(--muted)' }}>
                        {PLANS[pid].emoji} {PLANS[pid].name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(FEATURES).map(f => {
                    const minTier = requiredPlanFor(f.id) // tier where it's first introduced
                    const minRank = minTier ? PLAN_ORDER.indexOf(minTier) : 0
                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid rgba(14,12,9,0.04)' }}>
                        <td className="px-5 py-3">
                          <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{f.label}</div>
                          <div className="text-[11px]" style={{ color: 'var(--muted2)' }}>{f.description}</div>
                        </td>
                        {PLAN_ORDER.map((pid, i) => {
                          const included = i >= minRank
                          const accent = PLANS[pid].accent
                          return (
                            <td key={pid} className="px-5 py-3 text-center">
                              {included
                                ? <span style={{ color: accent }}>??</span>
                                : <span style={{ color: 'var(--muted2)' }}>??</span>}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}




