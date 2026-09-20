'use client'
import { useRouter } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

function LoginForm() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [pw, setPw] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'password' | 'twofa' | 'setup'>('password')
  const [preToken, setPreToken] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [manualKey, setManualKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [lockSec, setLockSec] = useState(0)
  const [focused, setFocused] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    document.documentElement.classList.add('dark')
    setMounted(true)
  }, [])

  useEffect(() => {
    if (lockSec <= 0) return
    const t = setTimeout(() => setLockSec(s => Math.max(0, s - 1)), 1000)
    return () => clearTimeout(t)
  }, [lockSec])

  async function parseError(res: Response, fallback: string) {
    const data = await res.json().catch(() => ({} as any))
    if (res.status === 429) {
      const s = Number((data as any)?.retryAfter || 60)
      setLockSec(s)
      return (data as any)?.error || `Too many attempts. Try again in ${s}s.`
    }
    if (typeof (data as any)?.attemptsLeft === 'number' && (data as any).attemptsLeft <= 2 && res.status === 401) {
      return `${(data as any)?.error || fallback} (${(data as any).attemptsLeft} left before lockout)`
    }
    return (data as any)?.error || fallback
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (lockSec > 0) return
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })

      if (!res.ok) {
        setErrorMsg(await parseError(res, 'Incorrect password. Try again.'))
        setStatus('error')
        return
      }

      const data = await res.json().catch(() => ({} as any))
      if (data?.requiresSetup && data?.preToken) {
        setPreToken(String(data.preToken))
        setQrDataUrl(String(data.qrDataUrl || ''))
        setManualKey(String(data.manualKey || ''))
        setStep('setup')
        setStatus('idle')
        setPw('')
        return
      }
      if (data?.requires2fa && data?.preToken) {
        setPreToken(String(data.preToken))
        setStep('twofa')
        setStatus('idle')
        setPw('')
        return
      }

      setStatus('success')
      goDashboard()
    } catch {
      setErrorMsg('Something went wrong. Try again.')
      setStatus('error')
    }
  }

  // Tracks the last auto-submitted code so the same 6 digits never
  // re-submit (wrong code must be edited first — also protects the
  // rate-limit bucket from loops).
  const autoTriedRef = useRef('')

  function goDashboard() {
    // SPA navigation — no full-page reload through the proxy.
    setTimeout(() => {
      router.replace('/dashboard')
      router.refresh()
    }, 350)
  }

  // Shared TOTP submit core: used by manual Verify buttons AND auto-submit.
  async function submitCode(clean: string, setup: boolean) {
    if (lockSec > 0 || status === 'loading' || status === 'success') return
    if (clean.length !== 6) {
      setErrorMsg(setup
        ? 'Scan the QR, then enter the 6-digit code to confirm.'
        : 'Enter the 6-digit code from your authenticator app.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preToken, code: clean, ...(setup ? { setup: true } : {}) }),
      })

      if (!res.ok) {
        const msg = await parseError(res, 'Invalid code. Try again.')
        setErrorMsg(msg)
        setStatus('error')
        // pre-token expired -> back to password step
        if (res.status === 401 && msg.includes('expired')) {
          setStep('password')
          setPreToken('')
        }
        return
      }

      setStatus('success')
      goDashboard()
    } catch {
      setErrorMsg('Something went wrong. Try again.')
      setStatus('error')
    }
  }

  function handleSetupVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void submitCode(code.replace(/\D/g, '').slice(0, 6), true)
  }

  function handleTwoFa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void submitCode(code.replace(/\D/g, '').slice(0, 6), false)
  }

  function onCodeChange(v: string) {
    setCode(v.replace(/\D/g, '').slice(0, 6))
    autoTriedRef.current = ''
    // Editing clears a previous error so auto-submit can fire again.
    if (status === 'error') {
      setStatus('idle')
      setErrorMsg('')
    }
  }

  // Auto-enter: the moment 6 digits are present (typed, pasted, or SMS
  // autofilled), verify immediately — no Verify click needed.
  useEffect(() => {
    const clean = code.replace(/\D/g, '').slice(0, 6)
    if (clean.length !== 6) return
    if (step !== 'twofa' && step !== 'setup') return
    if (status !== 'idle' || lockSec > 0) return
    const tag = `${step}:${clean}`
    if (autoTriedRef.current === tag) return
    autoTriedRef.current = tag
    void submitCode(clean, step === 'setup')
  }, [code, step, status, lockSec])

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const isError = status === 'error'

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
         style={{ background: '#0e0c09' }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
             style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
             style={{ background: 'linear-gradient(90deg, transparent, var(--gold-ln), transparent)' }} />
      </div>

      {/* Grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-20"
           style={{
             backgroundImage: `repeating-linear-gradient(
               -45deg, transparent, transparent 39px,
               rgba(168,125,30,0.05) 39px, rgba(168,125,30,0.05) 40px
             )`
           }} />

      <div className={`w-full max-w-[380px] relative transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 relative"
               style={{ background: 'linear-gradient(135deg, #1a1814 0%, #2d2a22 100%)', border: '1px solid var(--gold-ln)' }}>
            <span className="font-serif text-2xl italic font-normal"
                  style={{ color: 'var(--gold2)' }}>Au</span>
            <div className="absolute -inset-px rounded-2xl opacity-40"
                 style={{ background: 'linear-gradient(135deg, var(--gold) 0%, transparent 50%)' }} />
          </div>
          <h1 className="font-serif text-3xl tracking-tight"
              style={{ color: '#f5f3ee' }}>
            Aurum<em style={{ color: 'var(--gold2)' }}>OS</em>
          </h1>
          <p className="text-[11px] mt-2 uppercase tracking-[0.2em] font-medium"
             style={{ color: 'var(--muted2)' }}>
            Admin Portal
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl overflow-hidden relative"
             style={{ background: '#1a1814', border: '1px solid rgba(245,243,238,0.06)', boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 1px rgba(168,125,30,0.2)' }}>

          <div className="h-[2px] gold-shimmer" />

          <div className="p-8">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] mb-6"
                style={{ color: isSuccess ? 'var(--green)' : 'var(--muted)' }}>
              {isSuccess ? 'Authenticated' : step === 'setup' ? 'Set up authenticator' : step === 'twofa' ? 'Two-factor verification' : 'Enter credentials'}
            </h2>

            {lockSec > 0 && (
              <div className="text-xs font-medium px-4 py-3 rounded-xl mb-5"
                   style={{ background: 'rgba(248,113,113,0.08)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.15)' }}>
                Locked for {lockSec}s due to too many attempts.
              </div>
            )}

            {step === 'password' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] mb-2"
                       style={{ color: 'var(--muted2)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    disabled={isLoading || isSuccess}
                    className="w-full h-12 px-4 rounded-xl text-sm font-mono outline-none transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: '#222019',
                      border: `1px solid ${isError ? 'var(--red)' : focused ? 'var(--gold)' : 'rgba(245,243,238,0.08)'}`,
                      color: '#f5f3ee',
                      fontFamily: 'var(--font-mono)',
                      boxShadow: focused && !isError ? '0 0 0 3px rgba(201,162,39,0.1), inset 0 1px 2px rgba(0,0,0,0.3)' : 'inset 0 1px 2px rgba(0,0,0,0.3)',
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{color:'var(--muted2)'}}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                </div>
              </div>

              {isError && errorMsg && (
                <div className="flex items-center gap-2 text-xs font-medium px-4 py-3 rounded-xl"
                     style={{ background: 'rgba(248,113,113,0.06)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.12)' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {errorMsg}
                </div>
              )}

              {isSuccess && (
                <div className="flex items-center gap-2 text-xs font-medium px-4 py-3 rounded-xl"
                     style={{ background: 'rgba(74,222,128,0.06)', color: 'var(--green)', border: '1px solid rgba(74,222,128,0.12)' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Access granted. Redirecting...
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isSuccess || lockSec > 0}
                className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2.5"
                style={{
                  background: isSuccess
                    ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)'
                    : 'linear-gradient(135deg, var(--gold) 0%, var(--gold3) 100%)',
                  color: '#0e0c09',
                  boxShadow: isSuccess
                    ? '0 4px 20px rgba(21,128,61,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
                    : '0 4px 20px rgba(168,125,30,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}>

                {!isLoading && !isSuccess && 'Sign In'}

                {isLoading && (
                  <>
                    <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Authenticating...
                  </>
                )}

                {isSuccess && (
                  <>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Verified
                  </>
                )}
              </button>
            </form>
            ) : step === 'twofa' ? (
            <form onSubmit={handleTwoFa} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] mb-2"
                       style={{ color: 'var(--muted2)' }}>
                  Authenticator code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  required
                  autoFocus
                  value={code}
                  onChange={e => onCodeChange(e.target.value)}
                  disabled={isLoading || isSuccess}
                  maxLength={6}
                  className="w-full h-12 px-4 rounded-xl text-center text-lg tracking-[0.4em] font-mono outline-none transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: '#222019',
                    border: `1px solid ${isError ? 'var(--red)' : focused ? 'var(--gold)' : 'rgba(245,243,238,0.08)'}`,
                    color: '#f5f3ee',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <p className="text-[11px] mt-2" style={{ color: 'var(--muted2)' }}>
                  Open Google / Microsoft Authenticator and enter the 6-digit code — it verifies automatically.
                </p>
              </div>

              {isError && errorMsg && (
                <div className="flex items-center gap-2 text-xs font-medium px-4 py-3 rounded-xl"
                     style={{ background: 'rgba(248,113,113,0.06)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.12)' }}>
                  {errorMsg}
                </div>
              )}

              {isSuccess && (
                <div className="flex items-center gap-2 text-xs font-medium px-4 py-3 rounded-xl"
                     style={{ background: 'rgba(74,222,128,0.06)', color: 'var(--green)', border: '1px solid rgba(74,222,128,0.12)' }}>
                  Access granted. Redirecting...
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isSuccess || lockSec > 0}
                className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2.5"
                style={{
                  background: isSuccess
                    ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)'
                    : 'linear-gradient(135deg, var(--gold) 0%, var(--gold3) 100%)',
                  color: '#0e0c09',
                }}>
                {!isLoading && !isSuccess && 'Verify'}
                {isLoading && 'Verifying...'}
                {isSuccess && 'Verified'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('password'); setPreToken(''); setCode(''); setStatus('idle'); setErrorMsg('') }}
                className="w-full text-[11px] uppercase tracking-[0.15em] py-2"
                style={{ color: 'var(--muted2)' }}>
                ← Back to password
              </button>
            </form>
            ) : (
            <form onSubmit={handleSetupVerify} className="space-y-5">
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted2)' }}>
                First-time setup — scan once with Google / Microsoft Authenticator, then enter the code below. This screen never shows again.
              </p>
              {qrDataUrl ? (
                <div className="flex justify-center rounded-xl p-3" style={{ background: '#fff' }}>
                  <img src={qrDataUrl} alt="Authenticator setup QR" width={200} height={200} />
                </div>
              ) : (
                <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>
                  QR unavailable — enter this key manually in your authenticator app.
                </p>
              )}
              {manualKey && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(manualKey)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    } catch { /* clipboard unavailable */ }
                  }}
                  className="w-full px-4 py-3 rounded-xl text-center font-mono text-sm tracking-[0.2em] transition-all"
                  style={{ background: '#222019', border: '1px dashed rgba(245,243,238,0.2)', color: '#f5f3ee' }}
                  title="Click to copy">
                  {manualKey}
                  <span className="block text-[10px] tracking-[0.15em] uppercase mt-1" style={{ color: 'var(--muted2)' }}>
                    {copied ? 'Copied!' : 'Tap to copy manual key'}
                  </span>
                </button>
              )}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] mb-2"
                       style={{ color: 'var(--muted2)' }}>
                  Confirm 6-digit code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  required
                  autoFocus
                  value={code}
                  onChange={e => onCodeChange(e.target.value)}
                  disabled={isLoading || isSuccess}
                  maxLength={6}
                  className="w-full h-12 px-4 rounded-xl text-center text-lg tracking-[0.4em] font-mono outline-none transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: '#222019',
                    border: `1px solid ${isError ? 'var(--red)' : focused ? 'var(--gold)' : 'rgba(245,243,238,0.08)'}`,
                    color: '#f5f3ee',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>

              {isError && errorMsg && (
                <div className="flex items-center gap-2 text-xs font-medium px-4 py-3 rounded-xl"
                     style={{ background: 'rgba(248,113,113,0.06)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.12)' }}>
                  {errorMsg}
                </div>
              )}

              {isSuccess && (
                <div className="flex items-center gap-2 text-xs font-medium px-4 py-3 rounded-xl"
                     style={{ background: 'rgba(74,222,128,0.06)', color: 'var(--green)', border: '1px solid rgba(74,222,128,0.12)' }}>
                  Authenticator linked. Redirecting...
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isSuccess || lockSec > 0}
                className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2.5"
                style={{
                  background: isSuccess
                    ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)'
                    : 'linear-gradient(135deg, var(--gold) 0%, var(--gold3) 100%)',
                  color: '#0e0c09',
                }}>
                {!isLoading && !isSuccess && 'Verify & Enable'}
                {isLoading && 'Verifying...'}
                {isSuccess && 'Enabled'}
              </button>
            </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.25em]"
             style={{ color: 'var(--muted2)' }}>
            AurumOS &middot; Jewelry ERP
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--gold)', opacity: 0.4 }} />
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--gold)', opacity: 0.6 }} />
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--gold)', opacity: 0.4 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e0c09' }}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--gold)' }} />
          <div className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted2)' }}>Loading</div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
