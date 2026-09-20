import { redirect } from 'next/navigation'

import { getSession } from '@/lib/auth'

import { getAllLicenses } from '@/lib/license'

import type { License } from '@/lib/license'

import Sidebar from '@/components/Sidebar'

import LicenseTable from './LicenseTable'



export default async function LicensesPage() {

  const ok = await getSession()

  if (!ok) redirect('/login')



  // Explicit type annotation completely clears the implicit 'any[]' error

  let licenses: License[] = [] 

  

  try {

    const data = await getAllLicenses()

    if (Array.isArray(data)) {

      licenses = data

    }

  } catch (err) {

    console.error('[SERVER] Failed to load license matrices:', err)

  }



  return (

    <div className="flex h-screen overflow-hidden">

      <Sidebar />

      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--cream)' }}>



        {/* Header */}

        <div className="sticky top-0 z-10 bg-cream px-4 md:px-8 h-[60px] flex items-center justify-between"

             style={{ borderBottom: '1px solid var(--rule)' }}>

          <h1 className="font-serif text-xl" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>

            All <em style={{ color: 'var(--gold3)' }}>Licenses</em>

          </h1>

          

          <div className="flex items-center gap-2 md:gap-3">

            <span className="hidden sm:inline-block text-xs font-mono px-2.5 py-1 rounded"

                  style={{ background: 'var(--gold-bg)', color: 'var(--gold3)', border: '1px solid var(--gold-ln)' }}>

              {licenses.length} total

            </span>

            <a href="/licenses/generate"

               className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-semibold transition-all whitespace-nowrap"

               style={{ background: 'var(--ink)', color: 'var(--cream)' }}>

              + Generate

            </a>

          </div>

        </div>



        {/* Main Content Area */}

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full fade-up">

          <div className="overflow-x-auto w-full pb-4">

            <LicenseTable licenses={licenses} />

          </div>

        </div>

        

      </main>

    </div>

  )

}


