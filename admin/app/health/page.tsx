'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';

import Sidebar from '@/components/Sidebar';



type Event = {

  ts: string;

  event_type: string;

  severity: string;

  score: number;

  detail: string;

  action_taken: string;

};



type HealthData = {

  events: Event[];

  thresholds: Record<string, number>;

  suspended: boolean;

  summary: string;

  received_at: string;

};



// Interface for the client mapping

interface ClientOption {

  id: string;

  name: string;

}



const SEV_STYLES: Record<string, React.CSSProperties> = {

  CRITICAL: { background: 'var(--red-bg, rgba(185,28,28,0.06))', color: 'var(--red)', border: '1px solid rgba(185,28,28,0.15)' },

  HIGH:     { background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-ln)' },

  MEDIUM:   { background: 'var(--cream)', color: 'var(--ink)', border: '1px solid var(--rule)' },

  LOW:      { background: 'rgba(21,128,61,0.06)', color: 'var(--green)', border: '1px solid rgba(21,128,61,0.15)' },

};



const ACTION_COLORS: Record<string, string> = {

  SUSPENDED: 'var(--red)',

  DETECTED:  'var(--gold)',

  HEALED:    'var(--green)',

  LOGGED:    'var(--muted)',

};



function KPI({ label, value, sub, color }: {

  label: string; value: string | number; sub?: string; color?: string;

}) {

  return (

    <div className="bg-cream2 rounded-xl p-4 md:p-6" style={{ border: '1px solid var(--rule)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>

      <p className="text-[9px] md:text-[10px] font-semibold tracking-widest uppercase mb-2 md:mb-3" style={{ color: 'var(--muted)' }}>{label}</p>

      <p className="font-mono text-2xl md:text-3xl font-medium" style={{ color: color || 'var(--ink)' }}>{value}</p>

      {sub && <p className="text-[10px] md:text-xs mt-1 md:mt-2" style={{ color: 'var(--muted2)' }}>{sub}</p>}

    </div>

  );

}



export default function HealthPage() {

  const [clients, setClients] = useState<ClientOption[]>([]);

  const [clientId, setClientId] = useState<string>('');

  const [data, setData] = useState<HealthData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string>('');

  const [refresh, setRefresh] = useState('');



  // Derived state to find the current business name based on selected ID

  const selectedClient = clients.find(c => c.id === clientId);

  const currentDisplayName = selectedClient ? selectedClient.name : clientId;



  async function loadClients() {

    setLoading(true);

    try {

      const res = await fetch('/api/bastion/proxy', {

        method: 'POST',

        body: JSON.stringify({ path: '/api/bastion/events' }),

      });

      const json = await res.json();

      

      console.log("[DEBUG] API returned clients:", JSON.stringify(json.clients));



      if (json.ok && Array.isArray(json.clients)) {

        // Map the API response into objects of { id, name }

        const processed: ClientOption[] = json.clients.map((c: any) => ({

           id: typeof c === 'object' ? c.id : c, 

           name: typeof c === 'object' ? (c.name || "Unnamed Shop") : c

        }));

        

        setClients(processed);

        if (processed.length > 0) {

          setClientId(processed[0].id);

        } else {

          setLoading(false);

        }

      } else {

        setClients([]);

        setLoading(false);

      }

    } catch (e: any) {

      console.error(e);

      setError('Could not load client list: ' + e.message);

      setLoading(false);

    }

  }



  async function loadData(id: string) {

    if (!id) { setLoading(false); return; }

    setLoading(true);

    setError('');

    try {

      const res = await fetch('/api/bastion/proxy', {

        method: 'POST',

        body: JSON.stringify({ path: `/api/bastion/events?client_id=${id}` }),

      });

      const json = await res.json();

      if (!json.ok) {

        setError(json.error || 'Failed to load');

        setData(null);

      } else {

        setData(json.data);

      }

      setRefresh(new Date().toLocaleTimeString('en-IN'));

    } catch (e: any) {

      setError('Network error: ' + e.message);

      setData(null);

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => { loadClients(); }, []);

  useEffect(() => { if (clientId) loadData(clientId); }, [clientId]);



  const totalEvents = data?.events?.length ?? 0;

  const autoHealed = data?.events?.filter(e => e.action_taken === 'HEALED').length ?? 0;

  const highThreats = data?.events?.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL').length ?? 0;



  return (

    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--cream)', color: 'var(--ink)' }}>

      <Sidebar />

      <main className="flex-1 overflow-y-auto">

        <div className="sticky top-0 z-10 bg-cream px-4 md:px-8 h-[60px] flex items-center justify-between" style={{ borderBottom: '1px solid var(--rule)' }}>

          <h1 className="font-serif text-lg md:text-xl">

            System <em style={{ color: 'var(--gold)' }}>Health</em>

          </h1>

          <div className="flex items-center gap-3">

            {clients.length > 0 && (

              <select

                value={clientId}

                onChange={(e) => setClientId(e.target.value)}

                className="text-xs border rounded-lg px-3 py-1.5"

                style={{ borderColor: 'var(--rule)' }}

              >

                {clients.map(c => (

                  <option key={c.id} value={c.id}>{c.name}</option>

                ))}

              </select>

            )}

          </div>

        </div>



        {loading ? (

          <div className="flex items-center justify-center h-full min-h-[60vh]">

            <div className="text-xs font-mono tracking-[0.3em] uppercase animate-pulse" style={{ color: 'var(--gold)' }}>

              Syncing BASTION Logs...

            </div>

          </div>

        ) : error ? (

          <div className="flex items-center justify-center h-full min-h-[60vh] text-sm" style={{ color: 'var(--red)' }}>

            {error}

          </div>

        ) : !clients.length ? (

          <div className="flex items-center justify-center h-full min-h-[60vh] text-sm text-center px-6" style={{ color: 'var(--muted)' }}>

            No clients have reported data yet.<br />

            Make sure AURUM_HEALTH_URL / AURUM_ADMIN_SECRET / AURUM_CLIENT_ID are set on the client PC.

          </div>

        ) : !data ? (

          <div className="flex items-center justify-center h-full min-h-[60vh] text-sm" style={{ color: 'var(--muted)' }}>

            No data received yet from {clientId}. It will appear once the client app is online.

          </div>

        ) : (

          <div className="max-w-5xl mx-auto py-6 md:py-10 px-4 sm:px-6 md:px-10">



            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 md:mb-8 gap-4">

              <div>

                <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--muted)' }}>Live Status &mdash; {currentDisplayName}</p>

                <h2 className="text-xl md:text-2xl font-serif">Operational Overview</h2>

                <p className="text-[10px] md:text-xs mt-1 font-mono" style={{ color: 'var(--muted2)' }}>

                  Last sync: {refresh} &middot; Client reported: {new Date(data.received_at).toLocaleString('en-IN')}

                </p>

              </div>

              <div className="flex gap-2 w-full sm:w-auto">

                <button

                  onClick={() => loadData(clientId)}

                  className="h-9 px-5 text-[10px] uppercase tracking-widest font-semibold rounded-lg bg-cream2 flex-1 sm:flex-none"

                  style={{ border: '1px solid var(--rule)' }}

                >

                  Refresh

                </button>

                <button

                  onClick={async () => {

                    const res = await fetch('/api/bastion/export-link', {

                      method: 'POST',

                      body: JSON.stringify({ client_id: clientId }),

                    });

                    const { url } = await res.json();

                    window.open(url, '_blank');

                  }}

                  className="h-9 px-5 text-[10px] uppercase tracking-widest font-semibold rounded-lg flex-1 sm:flex-none"

                  style={{ background: 'var(--ink)', color: 'var(--cream)' }}

                >

                  Export CSV

                </button>

              </div>

            </div>



            {data.suspended && (

              <div className="rounded-xl p-5 md:p-6 mb-6 md:mb-8" style={{ background: 'var(--red-bg, rgba(185,28,28,0.06))', border: '1px solid rgba(185,28,28,0.15)' }}>

                <div className="flex items-center gap-3 mb-2">

                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />

                  <p className="font-semibold text-xs md:text-sm tracking-wide uppercase" style={{ color: 'var(--red)' }}>BASTION Suspension Active</p>

                </div>

                <p className="text-[11px] md:text-xs" style={{ color: 'var(--red)' }}>

                  Client application is locked. Navigate to the <Link href="/unlock" className="underline font-bold">Unlock Generator</Link> to issue a BASTION Admin Key.

                </p>

              </div>

            )}



            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">

              <KPI label="Total Events" value={totalEvents} sub="Most recent 20" />

              <KPI label="Auto-Healed" value={autoHealed} sub="Resolved without input" color="var(--green)" />

              <KPI label="High Threats" value={highThreats} sub="Requires admin review" color={highThreats > 0 ? 'var(--gold)' : 'var(--green)'} />

            </div>



            <div className="bg-cream2 rounded-xl p-6 md:p-8 mb-6 md:mb-8" style={{ border: '1px solid var(--rule)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>

              <h3 className="font-serif text-lg mb-4">AI Intelligence <em style={{ color: 'var(--gold)' }}>Brief</em></h3>

              <p className="text-xs md:text-sm leading-relaxed p-4 md:p-5 rounded-lg" style={{ background: 'var(--cream2)', border: '1px solid var(--rule)' }}>

                {data.summary || 'No summary available yet.'}

              </p>

            </div>



            <div className="bg-cream2 rounded-xl mb-6 md:mb-8 overflow-hidden" style={{ border: '1px solid var(--rule)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>

              <div className="p-6" style={{ borderBottom: '1px solid var(--rule)' }}>

                <h3 className="font-serif text-lg">Audit <em style={{ color: 'var(--gold)' }}>Ledger</em></h3>

              </div>

              <div className="overflow-x-auto w-full">

                <table className="w-full text-left border-collapse whitespace-nowrap">

                  <thead>

                    <tr style={{ background: 'var(--cream)' }}>

                      <th className="py-3 px-4 md:px-6 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Timestamp</th>

                      <th className="py-3 px-4 md:px-6 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Event Type</th>

                      <th className="py-3 px-4 md:px-6 text-[10px] font-semibold uppercase tracking-widest text-center" style={{ color: 'var(--muted)' }}>Severity</th>

                      <th className="py-3 px-4 md:px-6 text-[10px] font-semibold uppercase tracking-widest text-center" style={{ color: 'var(--muted)' }}>Score</th>

                      <th className="py-3 px-4 md:px-6 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Detail</th>

                      <th className="py-3 px-4 md:px-6 text-[10px] font-semibold uppercase tracking-widest text-right" style={{ color: 'var(--muted)' }}>Action</th>

                    </tr>

                  </thead>

                  <tbody>

                    {data.events.length === 0 ? (

                      <tr><td colSpan={6} className="py-8 text-center text-xs" style={{ color: 'var(--muted2)' }}>No events recorded.</td></tr>

                    ) : data.events.map((ev, i) => (

                      <tr key={i} style={{ borderBottom: i === data.events.length - 1 ? 'none' : '1px solid var(--rule)' }}>

                        <td className="py-4 px-4 md:px-6 font-mono text-[11px]" style={{ color: 'var(--muted2)' }}>{ev.ts?.slice(0, 16)}</td>

                        <td className="py-4 px-4 md:px-6 text-xs font-medium">{ev.event_type?.replace(/_/g, ' ')}</td>

                        <td className="py-4 px-4 md:px-6 text-center">

                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest" style={SEV_STYLES[ev.severity] || SEV_STYLES.MEDIUM}>{ev.severity}</span>

                        </td>

                        <td className="py-4 px-4 md:px-6 text-center font-mono text-xs font-bold" style={{ color: ev.score >= 75 ? 'var(--red)' : ev.score >= 40 ? 'var(--gold)' : 'var(--green)' }}>{ev.score}</td>

                        <td className="py-4 px-4 md:px-6 text-[11px] max-w-[200px] truncate" style={{ color: 'var(--muted)' }}>{ev.detail}</td>

                        <td className="py-4 px-4 md:px-6 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: ACTION_COLORS[ev.action_taken] || 'var(--muted)' }}>{ev.action_taken}</td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>



            <div className="bg-cream2 rounded-xl p-6 md:p-8" style={{ border: '1px solid var(--rule)' }}>

              <h3 className="font-serif text-lg mb-2">Learned <em style={{ color: 'var(--gold)' }}>Thresholds</em></h3>

              <p className="text-[11px] md:text-xs mb-6" style={{ color: 'var(--muted)' }}>Parameters automatically tuned by BASTION AI based on rolling 30-day usage patterns.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">

                {Object.entries(data.thresholds || {}).map(([k, v]) => (

                  <div key={k} className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{ background: 'var(--cream2)', border: '1px solid var(--rule)' }}>

                    <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'var(--muted)' }}>{k.replace(/_/g, ' ')}</span>

                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--gold)' }}>{v}</span>

                  </div>

                ))}

              </div>

              <div className="mt-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px dashed var(--rule)' }}>

                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted2)' }}>Calibration: Live</p>

                <Link href="/unlock" className="w-full sm:w-auto">

                  <button className="h-9 w-full sm:w-auto px-6 text-[10px] uppercase tracking-widest font-bold rounded-lg" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>

                    Issue Override Key

                  </button>

                </Link>

              </div>

            </div>

          </div>

        )}

      </main>

    </div>

  );

}



