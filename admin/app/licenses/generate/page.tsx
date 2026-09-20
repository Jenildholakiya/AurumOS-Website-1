'use client'

import { useState, useRef, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import Sidebar from '@/components/Sidebar'

import { PLANS, PLAN_ORDER, type PlanId } from '@/lib/plans'



type SoftwareType = 'wholesale' | 'retail'

type PlanChoice = PlanId



const PLAN_META: Record<PlanId, { sub: string }> = {

  lite:       { sub: '\u20B915,000 + \u20B93,000/yr' },

  pro:        { sub: '\u20B935,000 + \u20B97,000/yr' },

  enterprise: { sub: '\u20B975,000 + \u20B915,000/yr' },

}



export default function GeneratePage() {

  const router = useRouter()

  const [softwareType, setSoftwareType] = useState<SoftwareType>('wholesale')

  const [planChoice, setPlanChoice] = useState<PlanChoice>('pro')



  const [form, setForm] = useState({

    business_name: '', owner_name: '', city: '',

    phone: '', amount_paid: '5000', notes: '',

  })

  

  const [result, setResult] = useState<{

    key: string;

    id: number;

    software_type: string;

    plan_type: string;

    duration_days: number;

  } | null>(null)

  

  const [loading, setLoading] = useState(false)

  const [error,   setError]   = useState('')

  const [copied,  setCopied]  = useState(false)

  const [identityFile, setIdentityFile] = useState<File | null>(null)

  const [addressFile, setAddressFile]   = useState<File | null>(null)

  const [identityPreview, setIdentityPreview] = useState<string>('')

  const [addressPreview, setAddressPreview]   = useState<string>('')

  const [uploadingDoc, setUploadingDoc] = useState(false)



  const ownerRef  = useRef<HTMLInputElement>(null)

  const cityRef   = useRef<HTMLInputElement>(null)

  const phoneRef  = useRef<HTMLInputElement>(null)

  const amountRef = useRef<HTMLInputElement>(null)

  const notesRef  = useRef<HTMLTextAreaElement>(null)

  const submitRef = useRef<HTMLButtonElement>(null)

  const identityInputRef = useRef<HTMLInputElement>(null)

  const addressInputRef  = useRef<HTMLInputElement>(null)

  const identityCameraRef = useRef<HTMLInputElement>(null)

  const addressCameraRef  = useRef<HTMLInputElement>(null)



  // FIX: Initialize global structural visibility flag at the absolute top of the scope
  const isWholesale = softwareType === 'wholesale'



  function set(field: string, value: string) {

    setForm(prev => ({ ...prev, [field]: value }))

  }



  function handlePlanChange(choice: PlanChoice) {

    setPlanChoice(choice)

    // Pre-fill the amount with the tier's one-time price (admin can override).

    set('amount_paid', String(PLANS[choice].price))

  }



  const handleEnter = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLElement>) => {

    if (e.key === 'Enter') {

      if (e.shiftKey && e.currentTarget.tagName.toLowerCase() === 'textarea') return

      e.preventDefault()

      nextRef.current?.focus()

    }

  }



  function handleFileSelect(

    e: React.ChangeEvent<HTMLInputElement>,

    type: 'identity' | 'address'

  ) {

    const file = e.target.files?.[0]

    if (!file) return



    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

    if (!allowed.includes(file.type)) {

      setError('Only JPG, PNG, WebP, and PDF files are allowed.')

      return

    }

    if (file.size > 5 * 1024 * 1024) {

      setError('File size must be under 5MB.')

      return

    }



    setError('')



    if (type === 'identity') {

      setIdentityFile(file)

      if (file.type !== 'application/pdf') {

        setIdentityPreview(URL.createObjectURL(file))

      } else {

        setIdentityPreview('')

      }

    } else {

      setAddressFile(file)

      if (file.type !== 'application/pdf') {

        setAddressPreview(URL.createObjectURL(file))

      } else {

        setAddressPreview('')

      }

    }

  }



  function removeFile(type: 'identity' | 'address') {

    if (type === 'identity') {

      setIdentityFile(null)

      setIdentityPreview('')

      if (identityInputRef.current) identityInputRef.current.value = ''

      if (identityCameraRef.current) identityCameraRef.current.value = ''

    } else {

      setAddressFile(null)

      setAddressPreview('')

      if (addressInputRef.current) addressInputRef.current.value = ''

      if (addressCameraRef.current) addressCameraRef.current.value = ''

    }

  }



  function mintCustomFormattedKey(prefix: 'AU' | 'AR'): string {

    // Removed confusing characters:

    // O, I, 0, 1

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';



    const segment = () =>

        Array.from({ length: 4 }, () =>

            chars[Math.floor(Math.random() * chars.length)]

        ).join('');



    return `${prefix}-${segment()}-${segment()}-${segment()}-${segment()}`;

}



  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault()

    if (!form.business_name.trim() || !form.owner_name.trim()) {

      setError('Business name and owner name are required.')

      return

    }

    if (!identityFile || !addressFile) {

      setError('Both identity proof and address proof documents are required.')

      return

    }

    setLoading(true)

    setError('')



    const plan_type = planChoice

    const duration_days = 365



    const prefixSymbol = softwareType === 'retail' ? 'AR' : 'AU'

    const customGeneratedKey = mintCustomFormattedKey(prefixSymbol)



    try {

      // Upload documents first

      setUploadingDoc(true)

      const uploadDoc = async (file: File, docType: string) => {

        const fd = new FormData()

        fd.append('file', file)

        fd.append('docType', docType)

        fd.append('licenseKey', customGeneratedKey)

        const res = await fetch('/api/upload', { method: 'POST', body: fd })

        const data = await res.json()

        if (!res.ok) throw new Error(data?.error || 'Document upload failed')

        return data

      }



      const [identityResult, addressResult] = await Promise.all([

        uploadDoc(identityFile, 'identity'),

        uploadDoc(addressFile, 'address'),

      ])

      setUploadingDoc(false)



      const res = await fetch('/api/licenses', {

        method:  'POST',

        headers: { 'Content-Type': 'application/json' },

        body:    JSON.stringify({

          ...form,

          software_type: softwareType,

          plan_type,

          duration_days,

          key: customGeneratedKey,

          amount_paid: form.amount_paid ? parseFloat(form.amount_paid) : null,

          identity_proof_url: identityResult.url,

          address_proof_url: addressResult.url,

          identity_proof_type: identityFile.type,

          address_proof_type: addressFile.type,

        }),

      })

      

      const text = await res.text()

      if (!text) throw new Error(`Server error (${res.status}) - empty response`)

      

      let data: any

      try { data = JSON.parse(text) } catch { throw new Error(`Invalid JSON (${res.status}): ${text.slice(0,120)}`) }

      

      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)

      

      setResult({ 

        key: data.key || customGeneratedKey, 

        id: data.id, 

        software_type: softwareType,

        plan_type: data.plan_type || plan_type,

        duration_days: data.duration_days || duration_days

      })

    } catch (err: any) {

      setError(err.message || 'Something went wrong.')

    } finally {

      setLoading(false)

      setUploadingDoc(false)

    }

  }



  async function copyKey() {

    if (!result) return

    await navigator.clipboard.writeText(result.key)

    setCopied(true)

    setTimeout(() => setCopied(false), 2000)

  }



  const inputStyle = {

    background:   'var(--cream)',

    border:       '1px solid var(--rule)',

    color:        'var(--ink)',

    borderRadius: '8px',

    height:       '44px',

    padding:      '0 14px',

    fontFamily:   'var(--sans)',

    fontSize:     '0.875rem',

    width:        '100%',

    outline:      'none',

    boxShadow:    '0 1px 2px rgba(14,12,9,0.04)',

  }



  const labelStyle = {

    fontSize:      '0.65rem',

    fontWeight:    700,

    textTransform: 'uppercase' as const,

    letterSpacing: '1.1px',

    color:         'var(--muted)',

    marginBottom:  '7px',

    display:       'block',

  }



  // Result Matrix Screen Template
  if (result) {

    const isResultWholesale = result.software_type === 'wholesale'



    return (

      <div className="flex h-screen overflow-hidden">

        <Sidebar />

        <main className="flex-1 overflow-y-auto flex items-center justify-center p-4 md:p-8"

              style={{ background: 'var(--cream)' }}>

          <div className="w-full max-w-md fade-up">

            <div className="bg-cream2 rounded-xl overflow-hidden"

                 style={{ border: '1px solid var(--rule)', boxShadow: '0 8px 32px rgba(14,12,9,0.1)' }}>

              <div className="h-0.5 gold-shimmer" />

              <div className="p-6 md:p-8 text-center">

                <div className="text-4xl mb-4">&#10003;</div>

                <h2 className="font-serif text-2xl mb-2" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>

                  License <em style={{ color: 'var(--gold3)' }}>Generated!</em>

                </h2>



                <div className="flex justify-center items-center gap-2 mb-4">

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 border border-amber-200">

                    {isResultWholesale ? 'Wholesale' : 'Retail'}

                  </span>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"

                        style={{ background: PLANS[(result.plan_type as PlanId)]?.accent ?? 'var(--ink)', color: 'var(--cream)' }}>

                    {PLANS[(result.plan_type as PlanId)]?.emoji} {PLANS[(result.plan_type as PlanId)]?.name ?? result.plan_type}

                  </span>

                </div>



                <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>

                  Share this key with your client.

                </p>



                <div className="rounded-lg p-4 mb-4"

                     style={{ background: 'var(--cream)', border: '1px solid var(--gold-ln)' }}>

                  <div className="text-xs font-medium uppercase mb-2"

                       style={{ color: 'var(--muted2)', letterSpacing: '1px' }}>

                    {isResultWholesale ? 'AurumOS Wholesale' : 'AurumOS Retail'} License Key

                  </div>

                  <div className="font-mono text-xl font-bold break-all"

                       style={{ color: 'var(--gold3)', letterSpacing: '1px' }}>

                    {result.key}

                  </div>

                  <div className="text-[11px] mt-2 text-[var(--muted)]">

                    Format Verification Sync Confirmed across database channels.

                  </div>

                </div>



                <button onClick={copyKey}

                        className="w-full py-3 rounded-lg text-sm font-semibold mb-3 transition-all"

                        style={{

                          background: copied ? 'rgba(21,128,61,0.06)' : 'var(--ink)',

                          color:      copied ? 'var(--green)' : 'var(--cream)',

                        }}>

                  {copied ? 'Copied!' : 'Copy License Key'}

                </button>



                <div className="flex flex-col sm:flex-row gap-2">

                  <button onClick={() => {

                    setResult(null)

                    setPlanChoice('pro')

                    setForm({ business_name:'', owner_name:'', city:'', phone:'', amount_paid: String(PLANS.pro.price), notes:'' })

                    setIdentityFile(null)

                    setAddressFile(null)

                    setIdentityPreview('')

                    setAddressPreview('')

                  }}

                          className="flex-1 py-2.5 rounded-lg text-sm font-medium border"

                          style={{ background: 'var(--cream)', color: 'var(--ink3)', borderColor: 'var(--rule)' }}>

                    Generate Another

                  </button>

                  <button onClick={() => router.push('/licenses')}

                          className="flex-1 py-2.5 rounded-lg text-sm font-medium border"

                          style={{ background: 'var(--cream)', color: 'var(--ink3)', borderColor: 'var(--rule)' }}>

                    View All

                  </button>

                </div>

              </div>

            </div>

          </div>

        </main>

      </div>

    )

  }



  // Form Input Screen Template
  return (

    <div className="flex h-screen overflow-hidden">

      <Sidebar />

      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--cream)' }}>

        <div className="sticky top-0 z-10 bg-cream px-4 md:px-8 h-[60px] flex items-center"

             style={{ borderBottom: '1px solid var(--rule)' }}>

          <h1 className="font-serif text-lg md:text-xl" style={{ color: 'var(--ink)', letterSpacing: '-0.3px' }}>

            Generate <em style={{ color: 'var(--gold3)' }}>License Key</em>

          </h1>

        </div>



        <div className="p-4 md:p-8 max-w-6xl mx-auto">

          <div className="rounded-xl overflow-hidden fade-up"

               style={{ background: 'var(--cream2)', border: '1px solid var(--rule)', boxShadow: '0 1px 3px rgba(14,12,9,0.06)' }}>

            

            <div className="h-[3px]" style={{ background: isWholesale ? 'linear-gradient(90deg, var(--gold), var(--gold2))' : 'linear-gradient(90deg, var(--blue), var(--blue))' }} />



            <form onSubmit={handleSubmit} className="p-6 md:p-8">

              {/* ── Top: details + documents ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">

                {/* ── Left column: business details ── */}
                <div className="space-y-4">
              <div>

                <label style={labelStyle}>Business Name *</label>

                <input value={form.business_name} onChange={e => set('business_name', e.target.value)}

                       placeholder="e.g. Dholakiya Jewellers" style={inputStyle}

                       className="transition-all focus:!border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20"

                       onKeyDown={e => handleEnter(e, ownerRef)} autoFocus />

              </div>



              <div>

                <label style={labelStyle}>Owner Name *</label>

                <input ref={ownerRef} value={form.owner_name} onChange={e => set('owner_name', e.target.value)}

                       placeholder="e.g. Jenil Dholakiya" style={inputStyle}

                       className="transition-all focus:!border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20"

                       onKeyDown={e => handleEnter(e, cityRef)} />

              </div>



              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label style={labelStyle}>City</label>

                  <input ref={cityRef} value={form.city} onChange={e => set('city', e.target.value)}

                         placeholder="e.g. Rajkot" style={inputStyle}

                         className="transition-all focus:!border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20"

                         onKeyDown={e => handleEnter(e, phoneRef)} />

                </div>

                <div>

                  <label style={labelStyle}>Phone</label>

                  <input ref={phoneRef} value={form.phone} onChange={e => set('phone', e.target.value)}

                         placeholder="9876543210" style={inputStyle}

                         className="transition-all focus:!border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20"

                         onKeyDown={e => handleEnter(e, amountRef)} />

                </div>

              </div>



              <div>

                <label style={labelStyle}>Amount Paid</label>

                <input ref={amountRef} value={form.amount_paid} onChange={e => set('amount_paid', e.target.value)}

                       type="number" placeholder="e.g. 5000"

                       style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}

                       className="transition-all focus:!border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20"

                       onKeyDown={e => handleEnter(e, notesRef)} />

              </div>



              <div>

                <label style={labelStyle}>Notes (optional)</label>

                <textarea ref={notesRef} value={form.notes} onChange={e => set('notes', e.target.value)}

                          placeholder="Any additional notes?" rows={4}

                          style={{ ...inputStyle, height: '112px', padding: '12px 14px', resize: 'none' }}

                          className="transition-all focus:!border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20" />

              </div>

              <div className="pt-1">

                <label style={labelStyle}>Software Type</label>

                <div className="grid grid-cols-2 gap-3">

                  <button type="button" onClick={() => setSoftwareType('wholesale')} style={{

                    border:       isWholesale ? '1.5px solid var(--gold2)' : '1px solid var(--rule)',

                    borderRadius: '10px',

                    background:   isWholesale ? 'rgba(168,125,30,0.06)' : 'var(--cream)',

                    padding:      '14px',

                    cursor:       'pointer',

                    textAlign:    'left',

                    position:     'relative',

                    boxShadow:    isWholesale ? '0 1px 4px rgba(168,125,30,0.15)' : '0 1px 2px rgba(14,12,9,0.04)',

                  }}>

                    {isWholesale && <span className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--gold)', color: '#fff' }}>&#10003;</span>}

                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-ln)' }}>
                      <svg width="18" height="18" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>

                    <div className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>Wholesale</div>

                  </button>



                  <button type="button" onClick={() => setSoftwareType('retail')} style={{

                    border:       !isWholesale ? '1.5px solid var(--blue)' : '1px solid var(--rule)',

                    borderRadius: '10px',

                    background:   !isWholesale ? 'rgba(59,130,246,0.07)' : 'var(--cream)',

                    padding:      '14px',

                    cursor:       'pointer',

                    textAlign:    'left',

                    position:     'relative',

                    boxShadow:    !isWholesale ? '0 1px 4px rgba(59,130,246,0.15)' : '0 1px 2px rgba(14,12,9,0.04)',

                  }}>

                    {!isWholesale && <span className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--blue)', color: '#fff' }}>&#10003;</span>}

                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
                      <svg width="18" height="18" fill="none" stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    </div>

                    <div className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>Retail</div>

                  </button>

                </div>

              </div>
                </div>

                {/* ── Right column: KYC documents ── */}
                <div>
              <div className="space-y-4">

                <div>
                <label style={labelStyle}>Client Documents <span style={{ color: 'var(--red)' }}>*</span></label>

                <p className="text-[12px] mt-1" style={{ color: 'var(--muted2)' }}>

                  Upload identity proof and address proof for KYC verification.

                </p>
                </div>



                {/* Identity Proof */}

                <div

                  style={{

                    border: identityFile ? '1.5px solid var(--gold2)' : '1px dashed var(--muted2)',

                    borderRadius: '12px',

                    background: 'var(--cream)',

                    padding: identityFile ? '14px' : '26px 20px',

                    transition: 'all 0.2s',

                    boxShadow: '0 1px 2px rgba(14,12,9,0.03)',

                  }}

                >

                  <input

                    ref={identityInputRef}

                    type="file"

                    accept=".jpg,.jpeg,.png,.webp,.pdf"

                    className="hidden"

                    onChange={e => handleFileSelect(e, 'identity')}

                  />

                  <input

                    ref={identityCameraRef}

                    type="file"

                    accept="image/*"

                    capture="environment"

                    className="hidden"

                    onChange={e => handleFileSelect(e, 'identity')}

                  />

                  {identityFile ? (

                    <div className="flex items-center gap-3">

                      {identityPreview ? (

                        <img src={identityPreview} alt="Identity" className="w-12 h-12 object-cover rounded-lg border border-[#e5ddc8]" />

                      ) : (

                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'var(--gold-bg)' }}>

                          <svg width="20" height="20" fill="none" stroke="var(--gold)" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>

                        </div>

                      )}

                      <div className="flex-1 text-left min-w-0">

                        <div className="text-xs font-semibold truncate" style={{ color: 'var(--ink)' }}>{identityFile.name}</div>

                        <div className="text-[10px]" style={{ color: 'var(--muted2)' }}>{(identityFile.size / 1024).toFixed(1)} KB · Ready</div>

                      </div>

                      <button type="button" onClick={() => removeFile('identity')} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: 'var(--red)' }}>Remove</button>

                    </div>

                  ) : (

                    <div className="text-center">

                      <div className="w-11 h-11 mx-auto mb-2.5 rounded-[10px] flex items-center justify-center" style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-ln)' }}>

                        <svg width="19" height="19" fill="none" stroke="var(--gold)" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>

                      </div>

                      <div className="text-[13px] font-bold mb-1" style={{ color: 'var(--ink)' }}>Identity Proof *</div>

                      <div className="text-[11px] mb-4" style={{ color: 'var(--muted2)' }}>Aadhar, PAN, Passport, or Driving License</div>

                      <div className="flex gap-2 justify-center flex-wrap">

                        <button type="button" onClick={() => identityInputRef.current?.click()}

                          className="px-3.5 py-2 rounded-lg text-[12px] font-bold transition-all hover:brightness-95 active:scale-[0.98]"

                          style={{ background: 'var(--gold-bg)', color: 'var(--gold3)', border: '1px solid var(--gold-ln)' }}>

                          <span className="flex items-center gap-1.5">

                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>

                            Browse File

                          </span>

                        </button>

                        <button type="button" onClick={() => identityCameraRef.current?.click()}

                          className="px-3.5 py-2 rounded-lg text-[12px] font-bold transition-all hover:brightness-95 active:scale-[0.98]"

                          style={{ background: 'var(--gold-bg)', color: 'var(--gold3)', border: '1px solid var(--gold-ln)' }}>

                          <span className="flex items-center gap-1.5">

                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>

                            Click Photo

                          </span>

                        </button>

                      </div>

                    </div>

                  )}

                </div>



                {/* Address Proof */}

                <div

                  style={{

                    border: addressFile ? '1.5px solid var(--blue)' : '1px dashed var(--muted2)',

                    borderRadius: '12px',

                    background: 'var(--cream)',

                    padding: addressFile ? '14px' : '26px 20px',

                    transition: 'all 0.2s',

                    boxShadow: '0 1px 2px rgba(14,12,9,0.03)',

                  }}

                >

                  <input

                    ref={addressInputRef}

                    type="file"

                    accept=".jpg,.jpeg,.png,.webp,.pdf"

                    className="hidden"

                    onChange={e => handleFileSelect(e, 'address')}

                  />

                  <input

                    ref={addressCameraRef}

                    type="file"

                    accept="image/*"

                    capture="environment"

                    className="hidden"

                    onChange={e => handleFileSelect(e, 'address')}

                  />

                  {addressFile ? (

                    <div className="flex items-center gap-3">

                      {addressPreview ? (

                        <img src={addressPreview} alt="Address" className="w-12 h-12 object-cover rounded-lg border border-blue-100" />

                      ) : (

                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.08)' }}>

                          <svg width="20" height="20" fill="none" stroke="var(--blue)" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>

                        </div>

                      )}

                      <div className="flex-1 text-left min-w-0">

                        <div className="text-xs font-semibold truncate" style={{ color: 'var(--ink)' }}>{addressFile.name}</div>

                        <div className="text-[10px]" style={{ color: 'var(--muted2)' }}>{(addressFile.size / 1024).toFixed(1)} KB · Ready</div>

                      </div>

                      <button type="button" onClick={() => removeFile('address')} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: 'var(--red)' }}>Remove</button>

                    </div>

                  ) : (

                    <div className="text-center">

                      <div className="w-11 h-11 mx-auto mb-2.5 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.20)' }}>

                        <svg width="19" height="19" fill="none" stroke="var(--blue)" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>

                      </div>

                      <div className="text-[13px] font-bold mb-1" style={{ color: 'var(--ink)' }}>Address Proof *</div>

                      <div className="text-[11px] mb-4" style={{ color: 'var(--muted2)' }}>Utility Bill, Rent Agreement, or Property Tax Receipt</div>

                      <div className="flex gap-2 justify-center flex-wrap">

                        <button type="button" onClick={() => addressInputRef.current?.click()}

                          className="px-3.5 py-2 rounded-lg text-[12px] font-bold transition-all hover:brightness-95 active:scale-[0.98]"

                          style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--blue)', border: '1px solid rgba(59,130,246,0.20)' }}>

                          <span className="flex items-center gap-1.5">

                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>

                            Browse File

                          </span>

                        </button>

                        <button type="button" onClick={() => addressCameraRef.current?.click()}

                          className="px-3.5 py-2 rounded-lg text-[12px] font-bold transition-all hover:brightness-95 active:scale-[0.98]"

                          style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--blue)', border: '1px solid rgba(59,130,246,0.20)' }}>

                          <span className="flex items-center gap-1.5">

                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>

                            Click Photo

                          </span>

                        </button>

                      </div>

                    </div>

                  )}

                </div>

              </div>
              </div>
              </div>{/* ── end top grid ── */}



              {/* ── Bottom: plan + generate CTA ── */}
              {error && (

                <div className="text-xs font-semibold px-3.5 py-2.5 rounded-lg mt-6 flex items-center gap-2" style={{ color: 'var(--red)', background: 'rgba(185,28,28,0.06)', border: '1px solid rgba(185,28,28,0.15)' }}>

                  <span>⚠</span> {error}

                </div>

              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mt-6 lg:mt-8 items-end">

                <div>

                <label style={labelStyle}>Subscription Plan</label>

                <div className="grid grid-cols-3 gap-3">

                  {PLAN_ORDER.map((pid) => {

                    const p = PLANS[pid]

                    const selected = planChoice === pid

                    return (

                      <button key={pid} type="button" onClick={() => handlePlanChange(pid)} style={{

                        border:       selected ? '1.5px solid var(--ink)' : '1px solid var(--rule)',

                        borderRadius: '10px',

                        background:   'var(--cream)',

                        padding:      '14px 8px 12px',

                        cursor:       'pointer',

                        textAlign:    'center',

                        position:     'relative',

                        boxShadow:    selected ? '0 2px 8px rgba(14,12,9,0.10)' : '0 1px 2px rgba(14,12,9,0.04)',

                        transition:   'all 0.15s',

                      }}>

                        {selected && <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--ink3)', color: '#fff' }}>&#10003;</span>}

                        <div className="text-lg mb-1 leading-none">{p.emoji}</div>

                        <div className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>{p.name}</div>

                        <div className="text-[10px] font-mono font-semibold mt-1.5 leading-tight" style={{ color: 'var(--ink3)' }}>{p.billingNote}</div>

                      </button>

                    )

                  })}

                </div>

                </div>



              <div>
              <button ref={submitRef} type="submit" disabled={loading}

                      className="w-full rounded-[10px] text-sm font-bold transition-all shadow-md hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center h-[48px]"

                      style={{ background: loading ? 'var(--muted2)' : (isWholesale ? 'var(--gold)' : 'var(--blue)'), color: 'var(--cream)' }}>

                {loading ? (uploadingDoc ? 'Uploading…' : 'Minting…') : `Generate ${isWholesale ? 'Wholesale' : 'Retail'} Key`}

              </button>

              </div>
              </div>

            </form>

          </div>

        </div>

      </main>

    </div>

  )

}



