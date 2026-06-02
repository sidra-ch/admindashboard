'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Car, Users, DollarSign, Activity,
  Wrench, AlertTriangle, CheckCircle, Clock, ArrowRight, Zap,
  BarChart3, MapPin, RefreshCw, ChevronRight, Sparkles, Brain,
  Shield, Target, Layers, FileWarning, RotateCcw, Plus,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { apiClient } from '../../lib/api-client';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import Link from 'next/link';

// ── Color System ─────────────────────────────────────────────────────────────
const V = {
  bg: '#0B1020', surface: '#121A2F', card: '#18233D',
  border: 'rgba(255,255,255,0.08)', primary: '#4DA2FF', secondary: '#00D1FF',
  success: '#00C27A', warning: '#FFB547', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

// ── API types ─────────────────────────────────────────────────────────────────
type DashboardOverview = {
  kpis: {
    totalCars: number; availableCars: number; rentedCars: number;
    carsInMaintenance: number; carsReturningToday: number;
    overdueRentals: number; pendingPayments: number;
    monthlyRevenueCents: number; maintenanceCostThisMonthCents: number;
  };
  charts: {
    rentalsTrend: Array<{ month: string; rentals: number }>;
    revenueTrend: Array<{ month: string; revenueCents: number }>;
    utilization: Array<{ label: string; value: number }>;
  };
  tables: {
    activeRentals: Array<{
      id: string; customerName: string; carName: string;
      registrationNumber: string; branchName: string;
      expectedReturnAt: string; status: string; balanceDueCents: number;
    }>;
    overdueList: Array<{
      id: string; customerName: string; carName: string;
      registrationNumber: string; expectedReturnAt: string; lateFeeAmountCents: number;
    }>;
    latestPayments: Array<{
      id: string; amountCents: number; status: string; method: string;
      customerName: string; createdAt: string;
    }>;
    documentExpiries: Array<{
      id: string; registrationNumber: string; brand: string;
      model: string; insuranceExpiry: string | null;
    }>;
  };
};

// ── Shared card style ─────────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: '#18233D',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '18px',
  ...extra,
});

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonBlock({ w, h }: { w?: string; h?: string }) {
  return (
    <div style={{ width: w ?? '100%', height: h ?? '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
      <div className="shimmer-card" style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, sub, icon: Icon, color, glow, trend, delay = 0, wide = false,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; glow: string;
  trend?: 'up' | 'down' | 'neutral'; delay?: number; wide?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, scale: 1.02, transition: { duration: 0.2 } }}
      style={{ ...card(), padding: '22px', position: 'relative', overflow: 'hidden', gridColumn: wide ? 'span 2' : undefined }}
    >
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: V.textMuted, fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>{title}</p>
          <p style={{ color: V.text, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
          {sub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px' }}>
              {trend === 'up' && <TrendingUp style={{ width: '12px', height: '12px', color: V.success }} />}
              {trend === 'down' && <TrendingDown style={{ width: '12px', height: '12px', color: V.danger }} />}
              <p style={{ color: trend === 'up' ? V.success : trend === 'down' ? V.danger : V.textMuted, fontSize: '11.5px', fontWeight: 500 }}>{sub}</p>
            </div>
          )}
        </div>
        <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: `${glow.replace('0.15', '0.18')}`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 8px 24px ${glow}` }}>
          <Icon style={{ width: '20px', height: '20px', color }} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionLabel({ label, live, action, href }: { label: string; live?: boolean; action?: string; href?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <p style={{ color: V.textSec, fontSize: '12px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</p>
        {live && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(0,194,122,0.10)', border: '1px solid rgba(0,194,122,0.20)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: V.success }} className="animate-live-blink" />
            <span style={{ color: V.success, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
          </span>
        )}
      </div>
      {action && href && (
        <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: V.primary, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
          {action} <ArrowRight style={{ width: '12px', height: '12px' }} />
        </Link>
      )}
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#121A2F', border: '1px solid rgba(77,162,255,0.25)', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}>
      <p style={{ color: V.textSec, fontSize: '11px', marginBottom: '4px' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || V.primary, fontSize: '13px', fontWeight: 600 }}>
          {p.name === 'revenue' ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ── AI Insight card ───────────────────────────────────────────────────────────
function AiInsight({ text, type, delay }: { text: string; type: 'info' | 'warn' | 'success'; delay?: number }) {
  const colors = { info: V.primary, warn: V.warning, success: V.success };
  const bgs = { info: 'rgba(77,162,255,0.08)', warn: 'rgba(255,181,71,0.08)', success: 'rgba(0,194,122,0.08)' };
  const borders = { info: 'rgba(77,162,255,0.18)', warn: 'rgba(255,181,71,0.18)', success: 'rgba(0,194,122,0.18)' };
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay ?? 0, duration: 0.35 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '14px', background: bgs[type], border: `1px solid ${borders[type]}` }}
    >
      <Sparkles style={{ width: '14px', height: '14px', color: colors[type], flexShrink: 0, marginTop: '2px' }} />
      <p style={{ color: V.textSec, fontSize: '12.5px', lineHeight: 1.5 }}>{text}</p>
    </motion.div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function DashboardOverviewPanel() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiClient<DashboardOverview>('/dashboard/overview'),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ ...card({ padding: '22px' }) }}>
              <SkeletonBlock h="12px" w="60%" />
              <div style={{ marginTop: '12px' }}><SkeletonBlock h="32px" w="50%" /></div>
              <div style={{ marginTop: '10px' }}><SkeletonBlock h="12px" w="70%" /></div>
            </div>
          ))}
        </div>
        <div style={{ ...card({ padding: '24px', height: '260px' }) }}><SkeletonBlock h="100%" /></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ ...card({ padding: '32px', textAlign: 'center' }) }}>
        <AlertTriangle style={{ width: '32px', height: '32px', color: V.danger, margin: '0 auto 12px' }} />
        <p style={{ color: V.text, fontWeight: 600, marginBottom: '6px' }}>Unable to load dashboard</p>
        <p style={{ color: V.textMuted, fontSize: '13px', marginBottom: '16px' }}>{error instanceof Error ? error.message : 'Connection error'}</p>
        <button onClick={() => refetch()} style={{ padding: '8px 20px', borderRadius: '10px', background: V.primary, border: 'none', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw style={{ width: '14px', height: '14px' }} /> Retry
        </button>
      </div>
    );
  }

  const { kpis, charts, tables } = data;
  const fleetUtilPct = kpis.totalCars > 0 ? Math.round((kpis.rentedCars / kpis.totalCars) * 100) : 0;
  const revenueData = charts.revenueTrend.map(d => ({ ...d, revenue: d.revenueCents / 100 }));
  const rentalsData = charts.rentalsTrend;

  // Derive AI insights
  const insights = [
    fleetUtilPct >= 80 ? { text: `Fleet utilization at ${fleetUtilPct}% — peak demand detected. Consider activating reserve vehicles.`, type: 'warn' as const }
      : fleetUtilPct < 50 ? { text: `Fleet utilization is ${fleetUtilPct}% — below target. Recommend targeted promotions.`, type: 'info' as const }
      : { text: `Fleet utilization is healthy at ${fleetUtilPct}%. Operating in optimal range.`, type: 'success' as const },
    kpis.overdueRentals > 0
      ? { text: `${kpis.overdueRentals} rental${kpis.overdueRentals > 1 ? 's are' : ' is'} overdue. Automated reminders sent. Manual follow-up recommended.`, type: 'warn' as const }
      : { text: 'All active rentals are within scheduled return windows. Excellent compliance rate.', type: 'success' as const },
    kpis.pendingPayments > 0
      ? { text: `${kpis.pendingPayments} payments pending collection. Total exposure: ${formatCurrency(kpis.pendingPayments * 15000)}.`, type: 'info' as const }
      : { text: 'All payments settled. Payment compliance at 100% this cycle.', type: 'success' as const },
    tables.documentExpiries.length > 0
      ? { text: `${tables.documentExpiries.length} vehicle${tables.documentExpiries.length > 1 ? 's' : ''} with expiring documents. Schedule renewals immediately.`, type: 'warn' as const }
      : { text: 'All vehicle registrations and insurance documents are current and compliant.', type: 'success' as const },
  ];

  const utilizationPieData = [
    { name: 'Rented', value: kpis.rentedCars, color: V.primary },
    { name: 'Available', value: kpis.availableCars, color: V.success },
    { name: 'Maintenance', value: kpis.carsInMaintenance, color: V.warning },
    { name: 'Other', value: Math.max(0, kpis.totalCars - kpis.rentedCars - kpis.availableCars - kpis.carsInMaintenance), color: V.textMuted },
  ].filter(d => d.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          ...card(),
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(77,162,255,0.12) 0%, rgba(18,26,47,0.95) 60%, rgba(0,209,255,0.06) 100%)',
          border: '1px solid rgba(77,162,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap',
          overflow: 'hidden', position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: '-60px', right: '15%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,209,255,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(0,194,122,0.12)', border: '1px solid rgba(0,194,122,0.22)' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: V.success }} className="animate-live-blink" />
              <span style={{ color: V.success, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live Operations</span>
            </span>
            <span style={{ color: V.textMuted, fontSize: '11px' }}>Velocity Fleet OS · Enterprise Command Centre</span>
          </div>
          <h2 style={{ color: V.text, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Fleet Intelligence Dashboard
          </h2>
          <p style={{ color: V.textSec, fontSize: '13px' }}>
            {kpis.totalCars} vehicles · {kpis.rentedCars} active rentals · {formatCurrency(kpis.monthlyRevenueCents)} MTD revenue
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          <Link href="/dashboard/fleet/cars/new" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', background: V.primary, border: 'none', color: 'white', fontWeight: 600, fontSize: '13px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(77,162,255,0.30)' }}>
            <Plus style={{ width: '14px', height: '14px' }} /> Add Vehicle
          </Link>
          <Link href="/dashboard/operations" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: V.text, fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <Activity style={{ width: '14px', height: '14px' }} /> Operations
          </Link>
        </div>
      </motion.div>

      {/* ── Row 1: Primary KPIs ───────────────────────────────────────────── */}
      <section>
        <SectionLabel label="Operations Overview" live />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
          <KpiCard title="Monthly Revenue" value={formatCurrency(kpis.monthlyRevenueCents)} sub={`${kpis.pendingPayments} pending`} icon={DollarSign} color={V.success} glow="rgba(0,194,122,0.15)" trend="up" delay={0} />
          <KpiCard title="Fleet Utilization" value={`${fleetUtilPct}%`} sub={`${kpis.rentedCars} of ${kpis.totalCars} vehicles`} icon={Target} color={V.primary} glow="rgba(77,162,255,0.15)" trend={fleetUtilPct >= 60 ? 'up' : 'down'} delay={0.06} />
          <KpiCard title="Active Rentals" value={kpis.rentedCars} sub={`${kpis.carsReturningToday} returning today`} icon={Car} color={V.secondary} glow="rgba(0,209,255,0.12)" trend="up" delay={0.12} />
          <KpiCard title="Overdue Returns" value={kpis.overdueRentals} sub={kpis.overdueRentals === 0 ? 'All clear' : 'Action required'} icon={AlertTriangle} color={kpis.overdueRentals === 0 ? V.success : V.danger} glow={kpis.overdueRentals === 0 ? "rgba(0,194,122,0.12)" : "rgba(255,90,111,0.15)"} trend={kpis.overdueRentals === 0 ? 'up' : 'down'} delay={0.18} />
          <KpiCard title="Available Cars" value={kpis.availableCars} sub={`${kpis.totalCars} total in fleet`} icon={CheckCircle} color={V.success} glow="rgba(0,194,122,0.12)" trend="up" delay={0.24} />
          <KpiCard title="In Maintenance" value={kpis.carsInMaintenance} sub={formatCurrency(kpis.maintenanceCostThisMonthCents) + ' this month'} icon={Wrench} color={V.warning} glow="rgba(255,181,71,0.12)" trend="neutral" delay={0.30} />
          <KpiCard title="Pending Payments" value={kpis.pendingPayments} sub={kpis.pendingPayments === 0 ? 'All settled' : 'Awaiting collection'} icon={Shield} color="#A78BFA" glow="rgba(167,139,250,0.12)" trend={kpis.pendingPayments > 5 ? 'down' : 'neutral'} delay={0.36} />
          <KpiCard title="Returns Today" value={kpis.carsReturningToday} sub={`${kpis.overdueRentals} already overdue`} icon={RotateCcw} color="#F472B6" glow="rgba(244,114,182,0.12)" trend={kpis.carsReturningToday > 0 ? 'up' : 'neutral'} delay={0.42} />
        </div>
      </section>

      {/* ── Row 2: Revenue chart + Fleet pie ─────────────────────────────── */}
      <section>
        <SectionLabel label="Revenue Analytics" action="Full Report" href="/dashboard/payments/revenue" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: '14px' }}>
          {/* Revenue area chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={card({ padding: '24px' })}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <p style={{ color: V.text, fontSize: '15px', fontWeight: 700 }}>Revenue Trend</p>
                <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '3px' }}>Last 12 months</p>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(0,194,122,0.10)', border: '1px solid rgba(0,194,122,0.18)', color: V.success, fontSize: '12px', fontWeight: 600 }}>
                <TrendingUp style={{ width: '12px', height: '12px' }} /> +18.4%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={V.primary} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={V.primary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: V.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: V.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke={V.primary} strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: V.primary, stroke: '#18233D', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Fleet utilization pie */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={card({ padding: '24px' })}>
            <p style={{ color: V.text, fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Fleet Distribution</p>
            <p style={{ color: V.textMuted, fontSize: '12px', marginBottom: '16px' }}>{kpis.totalCars} total vehicles</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={utilizationPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {utilizationPieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {utilizationPieData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: d.color, flexShrink: 0 }} />
                    <span style={{ color: V.textSec, fontSize: '12px' }}>{d.name}</span>
                  </div>
                  <span style={{ color: V.text, fontSize: '12px', fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Row 3: Rentals trend + Active ops ────────────────────────────── */}
      <section>
        <SectionLabel label="Live Operations" live action="View All" href="/dashboard/rentals/active" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '14px' }}>
          {/* Rentals bar chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={card({ padding: '24px' })}>
            <p style={{ color: V.text, fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Rental Volume</p>
            <p style={{ color: V.textMuted, fontSize: '12px', marginBottom: '16px' }}>Monthly bookings</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={rentalsData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: V.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: V.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rentals" fill={V.secondary} radius={[5, 5, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Active rentals table */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={card({ padding: '24px' })}>
            <p style={{ color: V.text, fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Active Rentals</p>
            <p style={{ color: V.textMuted, fontSize: '12px', marginBottom: '16px' }}>{tables.activeRentals.length} rentals in progress</p>
            {tables.activeRentals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: V.textMuted, fontSize: '13px' }}>
                <Car style={{ width: '32px', height: '32px', margin: '0 auto 10px', opacity: 0.4 }} />
                <p>No active rentals</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                {tables.activeRentals.map((rental, i) => (
                  <motion.div key={rental.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.15s ease', cursor: 'pointer' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: V.text, fontSize: '13px', fontWeight: 600 }}>{rental.customerName}</p>
                      <p style={{ color: V.textMuted, fontSize: '11.5px', marginTop: '2px' }}>{rental.carName} · {rental.registrationNumber} · {rental.branchName}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <span style={{ color: V.textMuted, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock style={{ width: '11px', height: '11px' }} />
                        {formatDateTime(rental.expectedReturnAt)}
                      </span>
                      <span style={{ padding: '3px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 600, background: rental.status === 'OVERDUE' ? 'rgba(255,90,111,0.12)' : 'rgba(0,194,122,0.10)', color: rental.status === 'OVERDUE' ? V.danger : V.success, border: `1px solid ${rental.status === 'OVERDUE' ? 'rgba(255,90,111,0.22)' : 'rgba(0,194,122,0.18)'}` }}>
                        {rental.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Row 4: AI Insights + Document Expiries + Payments ────────────── */}
      <section>
        <SectionLabel label="AI Intelligence & Alerts" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '14px' }}>
          {/* AI Insights */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={card({ padding: '24px' })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #4DA2FF, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain style={{ width: '16px', height: '16px', color: 'white' }} />
              </div>
              <div>
                <p style={{ color: V.text, fontSize: '15px', fontWeight: 700 }}>AI Recommendations</p>
                <p style={{ color: V.textMuted, fontSize: '12px' }}>Powered by Velocity Intelligence Engine</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {insights.map((ins, i) => <AiInsight key={i} text={ins.text} type={ins.type} delay={i * 0.08} />)}
            </div>
          </motion.div>

          {/* Right column: Document expiries + recent payments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Document Expiries */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={card({ padding: '20px', flex: 1 })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <FileWarning style={{ width: '16px', height: '16px', color: V.warning }} />
                <p style={{ color: V.text, fontSize: '14px', fontWeight: 700 }}>Document Expiries</p>
                {tables.documentExpiries.length > 0 && (
                  <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: 'rgba(255,181,71,0.12)', color: V.warning, border: '1px solid rgba(255,181,71,0.22)' }}>
                    {tables.documentExpiries.length}
                  </span>
                )}
              </div>
              {tables.documentExpiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle style={{ width: '24px', height: '24px', color: V.success, margin: '0 auto 8px' }} />
                  <p style={{ color: V.textMuted, fontSize: '12px' }}>All documents current</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tables.documentExpiries.slice(0, 4).map(d => {
                    const daysLeft = d.insuranceExpiry
                      ? Math.ceil((new Date(d.insuranceExpiry).getTime() - Date.now()) / 86_400_000)
                      : null;
                    const urgent = daysLeft !== null && daysLeft <= 14;
                    return (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: urgent ? 'rgba(255,90,111,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${urgent ? 'rgba(255,90,111,0.18)' : 'rgba(255,255,255,0.06)'}` }}>
                        <div>
                          <p style={{ color: V.text, fontSize: '12px', fontWeight: 600 }}>{d.brand} {d.model}</p>
                          <p style={{ color: V.textMuted, fontSize: '10.5px' }}>{d.registrationNumber}</p>
                        </div>
                        {daysLeft !== null && (
                          <span style={{ color: urgent ? V.danger : V.textMuted, fontSize: '11px', fontWeight: 600 }}>
                            {daysLeft > 0 ? `${daysLeft}d` : 'Expired'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Recent Payments */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={card({ padding: '20px', flex: 1 })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <DollarSign style={{ width: '16px', height: '16px', color: V.success }} />
                <p style={{ color: V.text, fontSize: '14px', fontWeight: 700 }}>Recent Payments</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tables.latestPayments.slice(0, 4).map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: V.textSec, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.customerName}</p>
                      <p style={{ color: V.textMuted, fontSize: '10.5px' }}>{p.method}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ color: p.status === 'PAID' ? V.success : V.warning, fontSize: '12.5px', fontWeight: 700 }}>{formatCurrency(p.amountCents)}</p>
                      <p style={{ color: V.textMuted, fontSize: '10px' }}>{p.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <section>
        <SectionLabel label="Quick Actions" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Add Vehicle', icon: Car, href: '/dashboard/fleet/cars/new', color: V.primary, glow: 'rgba(77,162,255,0.15)' },
            { label: 'Fleet Overview', icon: Layers, href: '/dashboard/fleet/cars', color: V.secondary, glow: 'rgba(0,209,255,0.12)' },
            { label: 'View Reports', icon: BarChart3, href: '/dashboard/reports', color: '#A78BFA', glow: 'rgba(167,139,250,0.12)' },
            { label: 'Live Tracking', icon: MapPin, href: '/dashboard/tracking/live-map', color: V.success, glow: 'rgba(0,194,122,0.12)' },
            { label: 'Maintenance', icon: Wrench, href: '/dashboard/maintenance', color: V.warning, glow: 'rgba(255,181,71,0.12)' },
            { label: 'Notifications', icon: Zap, href: '/dashboard/notifications', color: V.danger, glow: 'rgba(255,90,111,0.12)' },
          ].map(({ label, icon: Icon, href, color, glow }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2, scale: 1.03 }}>
              <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '14px', background: '#18233D', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', transition: 'all 0.18s ease', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '60px', height: '60px', borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
                <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${glow.replace('0.15', '0.18').replace('0.12', '0.15')}`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: '16px', height: '16px', color }} />
                </span>
                <span style={{ color: V.text, fontSize: '13px', fontWeight: 600 }}>{label}</span>
                <ChevronRight style={{ width: '14px', height: '14px', color: V.textMuted, marginLeft: 'auto', flexShrink: 0 }} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}
