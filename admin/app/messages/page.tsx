import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getAllLicenses } from '@/lib/license'
import { getRecentMessages } from '@/lib/messages'
import Sidebar from '@/components/Sidebar'
import MessageComposer from './MessageComposer'

export default async function MessagesPage() {
  const ok = await getSession()
  if (!ok) redirect('/login')

  let clients: { key: string; business_name: string; owner_name: string; city: string | null; status: string }[] = []
  try {
    const all = await getAllLicenses()
    clients = all
      .filter(l => l.status === 'active')
      .map(l => ({
        key: l.key,
        business_name: l.business_name,
        owner_name: l.owner_name,
        city: l.city,
        status: l.status,
      }))
  } catch (err) {
    console.error('[SERVER] Failed to load clients for messages:', err)
  }

  let history: any[] = []
  try {
    history = await getRecentMessages(30)
  } catch (err) {
    console.error('[SERVER] Failed to load message history:', err)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--cream)' }}>
        <div className="sticky top-0 z-10 bg-cream/80 backdrop-blur-md px-4 md:px-8 h-[60px] flex items-center justify-between"
             style={{ borderBottom: '1px solid var(--rule)' }}>
          <h1 className="font-serif text-xl" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>
            Urgent <em style={{ color: 'var(--gold3)' }}>Messages</em>
          </h1>
          <span className="hidden sm:inline-block text-xs font-mono px-2.5 py-1 rounded"
                style={{ background: 'var(--gold-bg)', color: 'var(--gold3)', border: '1px solid var(--gold-ln)' }}>
            {clients.length} active clients
          </span>
        </div>

        <MessageComposer clients={clients} initialHistory={history} />
      </main>
    </div>
  )
}
