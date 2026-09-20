import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import OnlineSales from '@/components/OnlineSales'

export default async function DashboardPage() {
  const ok = await getSession()
  if (!ok) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--cream)' }}>

        <div className="sticky top-0 z-10 bg-cream/80 backdrop-blur-md px-4 md:px-8 h-[60px] flex items-center justify-between"
             style={{ borderBottom: '1px solid var(--rule)' }}>
          <h1 className="font-serif text-xl" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>
            Dashboard
          </h1>
          <Link href="/licenses/generate"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'var(--ink)', color: 'var(--cream)', boxShadow: '0 2px 8px rgba(14,12,9,0.15)' }}>
            <span className="text-base leading-none">+</span> Generate Key
          </Link>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">

          <div className="mb-8">
            <h2 className="font-serif text-2xl md:text-3xl fade-up" style={{ color: 'var(--ink)', letterSpacing: '-0.5px' }}>
              License <em style={{ color: 'var(--gold3)' }}>Sales</em>
            </h2>
            <p className="text-sm mt-1.5 fade-up" style={{ color: 'var(--muted)', animationDelay: '0.05s' }}>
              Online purchases and manual keys — everything in one place.
            </p>
          </div>

          <OnlineSales />

        </div>
      </main>
    </div>
  )
}
