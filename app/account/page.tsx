'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  Copy,
  Crown,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiJson } from '@/lib/api-client';

interface Me {
  name: string;
  business: string;
  email: string;
  phone: string;
  plan_interest: string;
  email_verified: boolean;
  created_at: string;
}

interface OwnedLicense {
  key: string;
  plan_type: string;
  software_type: string;
  status: string;
  subscription_expires_at: string;
}

type Tab = 'overview' | 'keys' | 'profile';

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'keys', label: 'License keys', icon: KeyRound },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

function daysLeft(iso: string): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / 86400000);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function expiryTone(left: number | null): string {
  if (left === null) return 'text-foreground/50';
  if (left < 0) return 'text-red-600';
  if (left <= 30) return 'text-red-600';
  if (left <= 90) return 'text-amber-600';
  return 'text-green-700';
}

function expiryLabel(left: number | null): string {
  if (left === null) return 'No expiry set';
  if (left < 0) return `Expired ${Math.abs(left)}d ago`;
  if (left === 0) return 'Expires today';
  return `${left} days left`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint,
  delay,
}: {
  icon: typeof Crown;
  label: string;
  value: string;
  sub: string;
  tint: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className="relative overflow-hidden rounded-[24px] border border-border bg-card p-5 shadow-sm"
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: tint }} />
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon size={17} />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-foreground/45">{label}</p>
      </div>
      <p className="font-clash mt-3 text-[26px] font-bold leading-none tracking-tight">{value}</p>
      <p className="mt-1.5 text-xs text-foreground/55">{sub}</p>
    </motion.div>
  );
}

function KeyRow({
  license,
  copied,
  onCopy,
  index,
}: {
  license: OwnedLicense;
  copied: boolean;
  onCopy: () => void;
  index: number;
}) {
  const left = daysLeft(license.subscription_expires_at);
  const active = license.status === 'active' && (left === null || left >= 0);
  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.35 }}
      className="rounded-[20px] border border-border bg-background p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-primary/10 px-2.5 py-1.5 font-mono text-[13px] font-bold tracking-wider text-primary break-all">
          {license.key}
        </code>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold text-foreground/60 transition-colors hover:border-primary/40 hover:text-primary"
        >
          {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <span
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
            active ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600'
          }`}
        >
          <span className={`size-1.5 rounded-full ${active ? 'bg-green-600' : 'bg-red-500'}`} />
          {active ? 'Active' : license.status}
        </span>
      </div>
      <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-foreground/60">
        <span className="font-bold capitalize text-foreground/80">{license.plan_type}</span>
        <span className="capitalize">{license.software_type}</span>
        <span className={`inline-flex items-center gap-1.5 font-semibold ${expiryTone(left)}`}>
          <CalendarClock size={13} />
          {fmtDate(license.subscription_expires_at)} · {expiryLabel(left)}
        </span>
      </div>
    </motion.li>
  );
}

function Skeleton() {
  return (
    <main className="min-h-screen px-6 py-10 md:py-14">
      <div className="mx-auto max-w-6xl lg:flex lg:gap-6">
        <div className="hidden w-60 shrink-0 lg:block">
          <div className="animate-pulse rounded-[24px] border border-border bg-card p-4">
            <div className="h-10 rounded-xl bg-foreground/10" />
            <div className="mt-2 h-10 rounded-xl bg-foreground/10" />
            <div className="mt-2 h-10 rounded-xl bg-foreground/10" />
          </div>
        </div>
        <div className="flex-1 space-y-5">
          <div className="animate-pulse rounded-[28px] border border-border bg-card p-8">
            <div className="h-8 w-2/3 rounded-lg bg-foreground/10" />
            <div className="mt-3 h-4 w-1/2 rounded bg-foreground/10" />
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-[24px] border border-border bg-card p-5">
                <div className="h-4 w-1/2 rounded bg-foreground/10" />
                <div className="mt-3 h-7 w-2/3 rounded bg-foreground/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [licenses, setLicenses] = useState<OwnedLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { res, data } = await apiJson('/api/auth/me');
        if (!res.ok || !data.ok) {
          router.replace('/login?next=/account');
          return;
        }
        const lic = await fetch('/api/auth/licenses').then((r) => r.json()).catch(() => null);
        if (!cancelled) {
          setMe(data.user);
          setLicenses(lic?.licenses ?? []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) router.replace('/login?next=/account');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    router.replace('/login');
    router.refresh();
  }, [router]);

  const copyKey = useCallback(async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  const stats = useMemo(() => {
    const active = licenses.filter((l) => {
      const left = daysLeft(l.subscription_expires_at);
      return l.status === 'active' && (left === null || left >= 0);
    });
    const expiries = licenses
      .map((l) => daysLeft(l.subscription_expires_at))
      .filter((n): n is number => n !== null && n >= 0)
      .sort((a, b) => a - b);
    return { activeCount: active.length, nearestExpiry: expiries[0] ?? null };
  }, [licenses]);

  if (loading) return <Skeleton />;

  const sidebar = (
    <div className="rounded-[24px] border border-border bg-card p-3 shadow-sm">
      <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[2px] text-foreground/40">
        Console
      </p>
      {TABS.map((t) => {
        const active = tab === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative mb-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition-all ${
              active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
            }`}
          >
            <Icon size={17} />
            {t.label}
            {t.id === 'keys' && licenses.length > 0 && (
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  active ? 'bg-white/20' : 'bg-primary/10 text-primary'
                }`}
              >
                {licenses.length}
              </span>
            )}
          </button>
        );
      })}
      <div className="mt-2 border-t border-border pt-2">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-foreground/60 transition-all hover:bg-red-500/10 hover:text-red-600"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 md:py-14">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="pointer-events-none absolute top-[-160px] left-1/2 size-[560px] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]"
      />

      <div className="relative mx-auto max-w-6xl lg:flex lg:items-start lg:gap-6">
        {/* Sidebar — desktop */}
        <aside className="hidden w-60 shrink-0 lg:sticky lg:top-24 lg:block">{sidebar}</aside>

        <div className="min-w-0 flex-1">
          {/* Mobile tabs */}
          <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold transition-all ${
                    active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'border border-border bg-card text-foreground/60'
                  }`}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[28px] border border-border bg-card p-7 shadow-xl md:p-9"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/15 blur-[80px]" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[2px] text-primary">
                  {tab === 'overview' ? 'Command center' : tab === 'keys' ? 'License keys' : 'Profile'}
                </p>
                <h1 className="font-clash text-3xl font-bold tracking-tight md:text-4xl">
                  Welcome back, {me?.name?.split(' ')[0] ?? 'there'}
                </h1>
                <p className="mt-1.5 text-sm text-foreground/55">
                  {me?.business} · {me?.email}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                  me?.email_verified ? 'bg-green-500/10 text-green-700' : 'bg-amber-500/10 text-amber-700'
                }`}
              >
                {me?.email_verified ? <BadgeCheck size={14} /> : <ShieldCheck size={14} />}
                {me?.email_verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </motion.div>

          {tab === 'overview' && (
            <div className="mt-5">
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatCard
                  icon={KeyRound}
                  label="Active keys"
                  value={String(stats.activeCount)}
                  sub={`${licenses.length} total key${licenses.length === 1 ? '' : 's'}`}
                  tint="linear-gradient(90deg, var(--primary), transparent)"
                  delay={0.05}
                />
                <StatCard
                  icon={Crown}
                  label="Plan interest"
                  value={me?.plan_interest ? me.plan_interest.charAt(0).toUpperCase() + me.plan_interest.slice(1) : '—'}
                  sub="chosen at signup"
                  tint="linear-gradient(90deg, #c9a227, transparent)"
                  delay={0.1}
                />
                <StatCard
                  icon={CalendarClock}
                  label="Renews in"
                  value={stats.nearestExpiry === null ? '—' : `${stats.nearestExpiry}d`}
                  sub={stats.nearestExpiry === null ? 'no active subscription' : 'nearest key expiry'}
                  tint="linear-gradient(90deg, #15803d, transparent)"
                  delay={0.15}
                />
                <StatCard
                  icon={ShieldCheck}
                  label="Account"
                  value={me?.email_verified ? 'Secure' : 'Pending'}
                  sub={me?.email_verified ? 'email verified' : 'verify your email'}
                  tint="linear-gradient(90deg, #b3395a, transparent)"
                  delay={0.2}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-5 rounded-[24px] border border-border bg-card p-6 shadow-sm md:p-7"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-clash text-xl font-bold tracking-tight">Recent keys</h2>
                  <button onClick={() => setTab('keys')} className="text-xs font-bold text-primary hover:underline">
                    View all →
                  </button>
                </div>
                {licenses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                    <KeyRound size={26} className="mx-auto mb-3 text-primary" />
                    <p className="mb-4 text-sm text-foreground/60">No keys yet — checkout mints one instantly after payment.</p>
                    <Button asChild className="rounded-2xl font-bold">
                      <Link href="/pricing">See plans</Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {licenses.slice(0, 3).map((l, i) => (
                      <KeyRow key={l.key} license={l} index={i} copied={copiedKey === l.key} onCopy={() => void copyKey(l.key)} />
                    ))}
                  </ul>
                )}
              </motion.div>
            </div>
          )}

          {tab === 'keys' && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-[24px] border border-border bg-card p-6 shadow-sm md:p-7"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-clash text-xl font-bold tracking-tight">My license keys</h2>
                  <p className="mt-1 text-[13px] text-foreground/55">Keys purchased with {me?.email}.</p>
                </div>
                <Button asChild className="rounded-2xl font-bold">
                  <Link href="/pricing">Get another key</Link>
                </Button>
              </div>
              {licenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <KeyRound size={26} className="mx-auto mb-3 text-primary" />
                  <p className="mb-4 text-sm text-foreground/60">No keys yet — checkout mints one instantly after payment.</p>
                  <Button asChild className="rounded-2xl font-bold">
                    <Link href="/pricing">See plans</Link>
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {licenses.map((l, i) => (
                    <KeyRow key={l.key} license={l} index={i} copied={copiedKey === l.key} onCopy={() => void copyKey(l.key)} />
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          {tab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-[24px] border border-border bg-card p-6 shadow-sm md:p-7"
            >
              <h2 className="font-clash mb-6 text-xl font-bold tracking-tight">Business profile</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { icon: UserRound, label: 'Full name', value: me?.name ?? '—' },
                  { icon: Building2, label: 'Business', value: me?.business ?? '—' },
                  { icon: Mail, label: 'Email', value: me?.email ?? '—' },
                  { icon: Phone, label: 'Phone', value: me?.phone ?? '—' },
                  { icon: Crown, label: 'Plan interest', value: me?.plan_interest ? me.plan_interest.charAt(0).toUpperCase() + me.plan_interest.slice(1) : '—' },
                  { icon: CalendarClock, label: 'Member since', value: me?.created_at ? fmtDate(me.created_at) : '—' },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-foreground/45">{f.label}</p>
                        <p className="mt-0.5 truncate text-sm font-semibold" title={f.value}>{f.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" onClick={logout} className="rounded-2xl font-bold">
                  <LogOut size={16} className="mr-2" /> Sign out
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
