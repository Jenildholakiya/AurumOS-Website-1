import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getAllLicenses } from '@/lib/license'
import { getRecentPcAddons } from '@/lib/pc'
import Sidebar from '@/components/Sidebar'
import PcManager from './PcManager'

export default async function PcConnectionsPage() {
  const ok = await getSession()
  if (!ok) redirect('/login')

  let licenses: any[] = []
  let history: any[] = []
  try {
    const data = await getAllLicenses()
    if (Array.isArray(data)) licenses = data
  } catch (err) {
    console.error('[SERVER] Failed to load licenses for PC page:', err)
  }
  try {
    history = await getRecentPcAddons(20)
  } catch (err) {
    console.error('[SERVER] Failed to load PC history:', err)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--cream)' }}>
        <div
          className="sticky top-0 z-10 bg-cream px-4 md:px-8 h-[60px] flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--rule)' }}
        >
          <h1 className="font-serif text-xl" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>
            PC <em style={{ color: 'var(--gold3)' }}>Connections</em>
          </h1>
          <span
            className="hidden sm:inline-block text-xs font-serif px-2.5 py-1 rounded"
            style={{ background: 'var(--gold-bg)', color: 'var(--gold3)', border: '1px solid var(--gold-ln)' }}
          >
            Pro base 1 PC · +extras → total
          </span>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full fade-up">
          <PcManager initialLicenses={licenses} initialHistory={history} />
        </div>
      </main>
    </div>
  )
}
