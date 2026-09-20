'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface BastionKeyVariant {
  label: string;
  key: string;
  length: number;
}

interface BastionDateResult {
  date: string;
  isToday: boolean;
  keys: BastionKeyVariant[];
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded transition-all font-semibold"
      style={{
        border: '1px solid var(--gold-ln)',
        color: copied ? 'var(--cream)' : 'var(--gold3)',
        background: copied ? 'var(--gold3)' : 'transparent',
      }}
    >
      {copied ? 'COPIED' : 'COPY'}
    </button>
  );
}

export default function UnlockPage() {
  const [lockCode, setLockCode] = useState('');
  const [nonce, setNonce] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<BastionDateResult[] | null>(null);

  async function generateKeys() {
    const lc = lockCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    if (lc.length !== 8) { setError('Lock code must be exactly 8 characters'); return; }
    setError('');
    setResults(null);
    setLoading(true);
    try {
      const res = await fetch('/api/bastion-keygen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lock_code: lc, nonce }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResults(data.dates);
    } catch (e: any) {
      setError(e.message || 'Key generation failed');
    }
    setLoading(false);
  }

  const labelStyle = {
    fontSize:      '0.6rem',
    fontWeight:    600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.9px',
    color:         'var(--muted)',
    marginBottom:  '8px',
    display:       'block',
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--cream, var(--cream))', color: 'var(--ink, var(--ink))' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-cream px-8 h-[60px] flex items-center"
             style={{ borderBottom: '1px solid var(--rule, var(--rule))' }}>
          <h1 className="font-serif text-xl" style={{ letterSpacing: '-0.3px' }}>
            Unlock <em style={{ color: 'var(--red)' }}>Key Generator</em>
          </h1>
        </div>

        <div className="max-w-3xl mx-auto py-10 px-6 sm:px-10">

          <div className="mb-8 fade-up">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Generates <strong style={{ color: 'var(--ink)' }}>BASTION date-based</strong> unlock keys.
              Enter the 8-character lock code from the client's BASTION lock screen.
            </p>
          </div>

          {/* Generator */}
          <div className="bg-cream2 rounded-xl overflow-hidden fade-up mb-8"
               style={{ border: '1px solid var(--rule, var(--rule))', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div className="h-0.5" style={{ background: 'linear-gradient(90deg, var(--red), var(--red))' }} />
            <div className="p-8">
              <label style={labelStyle}>Client Lock Code <span style={{ color: 'var(--red, var(--red))' }}>*</span></label>
              <input
                type="text"
                maxLength={8}
                value={lockCode}
                placeholder="FA20DBA9"
                onChange={e => setLockCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && generateKeys()}
                className="w-full h-12 rounded-lg px-4 font-mono text-xl tracking-[0.3em] text-center transition-all"
                style={{ background: 'var(--cream, var(--cream))', border: '1px solid var(--rule, var(--rule))', color: 'var(--ink, var(--ink))', outline: 'none' }}
                onFocus={e => { e.target.style.borderColor = 'var(--gold2)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--rule)'; e.target.style.boxShadow = 'none' }}
                autoFocus
              />

              <div className="flex items-end gap-4 mt-5">
                <div className="w-28">
                  <label style={labelStyle}>Nonce</label>
                  <input
                    type="number"
                    value={nonce}
                    onChange={e => setNonce(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full h-12 rounded-lg px-3 font-mono text-lg text-center"
                    style={{ background: 'var(--cream, var(--cream))', border: '1px solid var(--rule, var(--rule))', color: 'var(--ink, var(--ink))', outline: 'none' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--gold2)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.12)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--rule)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
                <div className="flex-1" />
              </div>

              {error && (
                <div className="text-xs font-medium px-3 py-2 rounded-md mt-3"
                     style={{ background: 'rgba(185,28,28,0.06)', color: 'var(--red, var(--red))', border: '1px solid rgba(185,28,28,0.15)' }}>
                  {error}
                </div>
              )}

              <button
                onClick={generateKeys}
                disabled={loading || lockCode.trim().length !== 8}
                className="w-full mt-5 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all uppercase"
                style={{
                  background: loading ? 'var(--ink3, var(--ink3))' : 'var(--red)',
                  color: 'var(--cream)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: lockCode.trim().length !== 8 ? 0.5 : 1,
                  boxShadow: '0 2px 8px rgba(220,38,38,0.2)',
                }}
              >
                {loading ? 'Generating...' : 'Generate BASTION Keys'}
              </button>
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4 mb-8 fade-up">
              <h3 className="font-serif text-lg" style={{ color: 'var(--red)' }}>Generated Keys</h3>

              {results.map(dateResult => (
                <div
                  key={dateResult.date}
                  className="bg-cream2 rounded-xl p-5 transition-all"
                  style={{
                    border: dateResult.isToday
                      ? '2px solid var(--red)'
                      : '1px solid var(--rule, var(--rule))',
                    boxShadow: dateResult.isToday
                      ? '0 4px 16px rgba(220,38,38,0.12)'
                      : '0 1px 4px rgba(14,12,9,0.05)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-mono text-sm font-semibold" style={{ color: 'var(--ink, var(--ink))' }}>
                      {dateResult.date}
                    </span>
                    {dateResult.isToday && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(185,28,28,0.06)', color: 'var(--red)' }}>
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {dateResult.keys.map(k => (
                      <div key={k.label} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg"
                           style={{ background: 'var(--cream, var(--cream))' }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[10px] font-semibold uppercase whitespace-nowrap"
                                style={{ color: 'var(--muted)', letterSpacing: '0.5px', width: '130px', flexShrink: 0 }}>
                            {k.label}
                          </span>
                          <span className="font-mono text-sm font-bold truncate"
                                style={{ color: 'var(--ink, var(--ink))', letterSpacing: '1px' }}>
                            {k.key}
                          </span>
                          <span className="text-[10px] font-medium whitespace-nowrap"
                                style={{ color: 'var(--muted2, var(--muted2))' }}>
                            {k.length} chars
                          </span>
                        </div>
                        <CopyButton value={k.key} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="text-[11px] px-1" style={{ color: 'var(--muted)' }}>
                Client tries BASTION keys first, then REGULAR. Dates tried from -3 to +3 days around today.
                Primary key is BASTION (no nonce) for today.
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="rounded-xl p-6 text-xs leading-relaxed mt-6"
               style={{ border: '1px dashed var(--rule, var(--rule))', color: 'var(--muted2, var(--muted2))' }}>
            <p className="uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--muted)' }}>How It Works</p>
            <p>BASTION key = SHA256(lock_code + salt + date)[:16] ?? date-sensitive, changes daily.</p>
            <p>REGULAR key = SHA256(lock_code + salt + date)[:12] ?? fallback for login locks.</p>
            <p>Nonce appends an integer to the hash input for key rotation scenarios.</p>
          </div>
        </div>
      </main>
    </div>
  );
}




