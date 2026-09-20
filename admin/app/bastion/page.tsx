'use client';

import { useState, useEffect } from 'react';

import toast, { Toaster } from 'react-hot-toast';

import Sidebar from '@/components/Sidebar';



const FEATURES = [
    { id: 'db_watchdog_enabled', label: 'DB Watchdog', desc: 'Monitors database row counts for unauthorized external edits.', icon: 'DW', critical: true },
    { id: 'session_guard_enabled', label: 'Session Guard', desc: 'Protects against session hijacking and registry tampering.', icon: 'SG', critical: true },
    { id: 'file_integrity_enabled', label: 'File Integrity Guard', desc: 'Detects code/config modification, deletion, or new file drops.', icon: 'FG', critical: true },
    { id: 'anti_debugger_enabled', label: 'Anti-Debugger', desc: 'Detects memory debuggers attached to process.', icon: 'AD', critical: true },
    { id: 'honeypot_enabled', label: 'Honeypot Guard', desc: 'Traps SQL injection attempts via decoy database table.', icon: 'HP', critical: true },
    { id: 'auto_healer_enabled', label: 'Auto-Healer', desc: 'Automatically fixes DB integrity, backups, WAL files, and logs.', icon: 'AH', critical: false },
    { id: 'pattern_learner_enabled', label: 'Pattern Learner (Z-Score AI)', desc: 'Analyzes 30-day usage patterns to dynamically refine threat thresholds.', icon: 'PL', critical: false },
    { id: 'alert_sender_enabled', label: 'Alert Sender', desc: 'Queues and sends critical security alerts via email.', icon: 'AS', critical: false },
];



export default function BastionSettings() {

    const [settings, setSettings] = useState<Record<string, boolean>>({});

    const [loading, setLoading] = useState(true);

    const [toggling, setToggling] = useState<string | null>(null);

    const [lastSync, setLastSync] = useState('');



    useEffect(() => {

        loadSettings();

    }, []);



    async function loadSettings() {

        setLoading(true);

        try {

            const res = await fetch('/api/bastion-settings', {

                method: 'GET',

                headers: { 'Accept': 'application/json' },

                cache: 'no-store',

            });



            // Check if response is actually JSON

            const contentType = res.headers.get('content-type') || '';

            if (!contentType.includes('application/json')) {

                throw new Error('API returned non-JSON response. Route may not exist.');

            }



            const json = await res.json();



            if (json.status === 'ok' && json.data) {

                const map: Record<string, boolean> = {};

                for (const feat of FEATURES) {

                    map[feat.id] = json.data[feat.id] ?? true;

                }

                setSettings(map);

                setLastSync(new Date().toLocaleTimeString());

            } else {

                throw new Error(json.message || 'Failed to load');

            }

        } catch (err: any) {

            console.error('Load error:', err);

            toast.error(`Load failed: ${err.message}`);

            // Default all ON on error

            const defaults: Record<string, boolean> = {};

            for (const feat of FEATURES) defaults[feat.id] = true;

            setSettings(defaults);

        } finally {

            setLoading(false);

        }

    }



    async function toggleFeature(feat: typeof FEATURES[0]) {

        const newValue = !settings[feat.id];



        



        setToggling(feat.id);

        setSettings(prev => ({ ...prev, [feat.id]: newValue }));



        try {

            const res = await fetch('/api/bastion-settings', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ feature_id: feat.id, value: newValue }),

            });



            const contentType = res.headers.get('content-type') || '';

            if (!contentType.includes('application/json')) {

                throw new Error('API returned non-JSON. Check route file exists at app/api/bastion-settings/route.ts');

            }



            const json = await res.json();



            if (json.status === 'ok') {

                toast.success(`${feat.label} ${newValue ? 'ENABLED' : 'DISABLED'}`, {

                    icon: newValue ? '[ON]' : '[OFF]',

                });

                setLastSync(new Date().toLocaleTimeString());

            } else {

                throw new Error(json.message || 'Update failed');

            }

        } catch (err: any) {

            setSettings(prev => ({ ...prev, [feat.id]: !newValue }));

            toast.error(err.message);

        } finally {

            setToggling(null);

        }

    }



    // Loading state

    if (loading) {

        return (

            <div className="flex h-screen bg-[var(--cream)]">

                <Sidebar />

                <main className="flex-1 flex items-center justify-center">

                    <div className="text-center">

                        <div className="animate-spin w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full mx-auto mb-3" />

                        <p className="text-sm text-[var(--muted)]">Loading Bastion settings...</p>

                    </div>

                </main>

            </div>

        );

    }



    const enabledCount = Object.values(settings).filter(Boolean).length;



    return (

        <div className="flex h-screen bg-[var(--cream)]">

            <Toaster position="bottom-right" />

            <Sidebar />

            <main className="flex-1 p-10 overflow-y-auto">

                {/* Header */}

                <div className="mb-6">

                    <h1 className="font-serif text-2xl mb-1">

                        Bastion AI <span style={{ color: 'var(--gold)' }}>Security Console</span>

                    </h1>

                    <p className="text-xs text-[var(--muted)]">

                        Manage real-time security features. Changes sync to all desktop clients within 30 seconds.

                    </p>

                </div>



                {/* Status */}

                <div className="max-w-xl mb-4 flex items-center gap-3">

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream2 border border-[var(--rule)] text-xs">

                        <span className={`w-2 h-2 rounded-full ${

                            enabledCount === FEATURES.length ? 'bg-green-500' :

                            enabledCount > FEATURES.length / 2 ? 'bg-yellow-500' : 'bg-red-500'

                        }`} />

                        <span className="font-semibold text-[var(--ink3)]">{enabledCount}/{FEATURES.length} active</span>

                    </div>

                    {lastSync && <span className="text-[10px] text-[var(--muted2)]">Last sync: {lastSync}</span>}

                    <button onClick={loadSettings} className="ml-auto text-xs font-semibold" style={{ color: 'var(--gold)' }}>

                        Refresh

                    </button>

                </div>



                {/* Feature List */}

                <div className="max-w-xl bg-cream2 rounded-xl border border-[var(--rule)] shadow-sm overflow-hidden">

                    {FEATURES.map((feat, idx) => (

                        <div

                            key={feat.id}

                            className={`flex items-center justify-between px-5 py-4 ${

                                idx < FEATURES.length - 1 ? 'border-b border-[var(--rule)]' : ''

                            } ${toggling === feat.id ? 'opacity-60' : ''}`}

                        >

                            <div className="flex items-start gap-3 flex-1">

                                <span className="text-lg mt-0.5">{feat.icon}</span>

                                <div>

                                    <div className="flex items-center gap-2">

                                        <p className="font-semibold text-sm text-[var(--ink)]">{feat.label}</p>

                                        {feat.critical && (

                                            <span className="text-[9px] font-bold tracking-wider text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">

                                                CRITICAL

                                            </span>

                                        )}

                                    </div>

                                    <p className="text-[11px] text-[var(--muted)] mt-0.5 max-w-xs">{feat.desc}</p>

                                </div>

                            </div>



                            <button

                                onClick={() => toggleFeature(feat)}

                                disabled={toggling !== null}

                                className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-4 cursor-pointer disabled:cursor-wait"

                                style={{ background: settings[feat.id] ? 'var(--green)' : 'var(--muted2)' }}

                            >

                                <div

                                    className="absolute top-1 w-4 h-4 bg-cream2 rounded-full shadow transition-transform duration-200"

                                    style={{ transform: settings[feat.id] ? 'translateX(24px)' : 'translateX(4px)' }}

                                />

                            </button>

                        </div>

                    ))}

                </div>



                <p className="max-w-xl text-[10px] text-[var(--muted2)] mt-4 leading-relaxed">

                    Desktop clients poll Supabase every 30 seconds. Disabled features stop their thread on next cycle.

                </p>

            </main>

        </div>

    );

}



