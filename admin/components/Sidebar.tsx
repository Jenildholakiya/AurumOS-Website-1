'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'
import { useTheme } from '@/lib/theme'

const NAV = [
  { href: '/dashboard',         label: 'Dashboard',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z' },
  { href: '/licenses',         label: 'Licenses',     icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z', match: ['/licenses'] },
  { href: '/licenses/generate', label: 'Generate Key', icon: 'M12 4v16m8-8H4' },
  { href: '/pc-connections', label: 'PC Connections', icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m-6 0V6.75m6 10.5V6.75m-9 3.75h12M5.25 6.75h13.5A1.5 1.5 0 0120.25 8.25v7.5' },
  { href: '/plans',            label: 'Plans',        icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { href: '/unlock',           label: 'Unlock Keys',  icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
  { href: '/messages',          label: 'Messages',     icon: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z' },
  { href: '/health',           label: 'Health',       icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { href: '/bastion',          label: 'Bastion',      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
]

function NavIcon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke={active ? 'var(--gold)' : 'currentColor'}
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export default function Sidebar() {
  const path   = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggle } = useTheme()

  useEffect(() => { setIsOpen(false) }, [path])

  async function handleLogout() {
    await logoutAction()
  }

  function isNavActive(item: typeof NAV[number]) {
    if (item.href === '/dashboard') return path === '/dashboard'
    if (item.match) return item.match.some(m => path === m || (path.startsWith(m + '/') && !path.startsWith('/licenses/generate')))
    return path.startsWith(item.href)
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden backdrop-blur-sm"
             style={{ background: 'rgba(14,12,9,0.4)' }}
             onClick={() => setIsOpen(false)} />
      )}

      <button onClick={() => setIsOpen(true)}
              className={`md:hidden fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform ${isOpen ? 'scale-0' : 'scale-100'}`}
              style={{ background: 'var(--ink)', color: 'var(--gold2)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>

      <aside className={`
          fixed inset-y-0 left-0 z-50 w-[232px] h-screen flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
        style={{ background: 'var(--cream2)', borderRight: '1px solid var(--rule)' }}>

        <div className="absolute inset-y-0 right-0 w-px hidden md:block"
             style={{ background: 'linear-gradient(180deg, transparent, rgba(168,125,30,0.2) 30%, rgba(168,125,30,0.2) 70%, transparent)' }} />

        {/* Logo */}
        <div className="h-[60px] flex items-center justify-between px-5 flex-shrink-0"
             style={{ borderBottom: '1px solid var(--rule)' }}>
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                 style={{ background: '#0e0c09' }}>
              <span className="font-serif text-sm italic" style={{ color: '#c9a227' }}>Au</span>
            </div>
            <div className="font-serif text-base leading-none" style={{ color: 'var(--ink)', letterSpacing: '-0.2px' }}>
              Aurum<em style={{ color: 'var(--gold3)' }}>OS</em>
            </div>
          </Link>

          <button onClick={() => setIsOpen(false)}
                  className="md:hidden w-7 h-7 flex items-center justify-center rounded-md text-xs"
                  style={{ color: 'var(--muted)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="space-y-1">
            {NAV.map(item => {
              const active = isNavActive(item)
              return (
                <Link key={item.href} href={item.href}
                      className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 group"
                      style={{
                        color:      active ? 'var(--ink)' : 'var(--ink3)',
                        background: active ? 'var(--gold-bg)' : 'transparent',
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(168,125,30,0.05)'
                          ;(e.currentTarget as HTMLElement).style.color = 'var(--ink)'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = 'transparent'
                          ;(e.currentTarget as HTMLElement).style.color = 'var(--ink3)'
                        }
                      }}>
                  {active && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                         style={{ background: 'var(--gold2)' }} />
                  )}
                  <NavIcon d={item.icon} active={active} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Theme toggle */}
        <div className="px-3 pb-2 flex-shrink-0">
          <button onClick={toggle}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200"
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; (e.currentTarget as HTMLElement).style.background = 'var(--gold-bg)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* Footer */}
        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--rule)' }}>
          <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200"
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--red)'; (e.currentTarget as HTMLElement).style.background = 'rgba(185,28,28,0.04)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
