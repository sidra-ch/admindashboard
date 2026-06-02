'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiClient } from '../../../../lib/api-client';
import { formatCurrency } from '../../../../lib/formatters';
import {
  DollarSign, TrendingUp, Clock, AlertTriangle, CreditCard, Banknote,
  Smartphone, RefreshCw, CheckCircle, ArrowUpRight, PieChart, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart as RPie, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const V = {
  bg: '#0B1020', surface: '#121A2F', card: '#18233D',
  border: 'rgba(255,255,255,0.08)', primary: '#4DA2FF', secondary: '#00D1FF',
  success: '#00C27A', warning: '#FFB547', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px', ...extra,
});

type RevenueSummary = {
  monthToDateRevenueCents: number;
  pendingRevenueCents: number;
  overdueRevenueCents: number;
  byMethod: Array<{ method: string; amountCents: number }>;
  recentPayments?: Array<{ id: string; amountCents: number; status: string; method: string; customerName?: string; createdAt: string }>;
};

const METHOD_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  CASH:         { label: 'Cash',         icon: Banknote,    color: '#00C27A' },
  CARD:         { label: 'Card',         icon: CreditCard,  color: '#4DA2FF' },
  BANK_TRANSFER:{ label: 'Bank Transfer',icon: ArrowUpRight,color: '#A78BFA' },
  MOBILE:       { label: 'Mobile',       icon: Smartphone,  color: '#00D1FF' },
};

const PIE_COLORS = ['#4DA2FF', '#00C27A', '#A78BFA', '#00D1FF', '#FFB547', '#F472B6'];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#121A2F', border: '1px solid rgba(77,162,255,0.22)', borderRadius: '10px', padding: '8px 14px' }}>
      <p style={{ color: V.primary, fontSize: '13px', fontWeight: 700 }}>{formatCurrency(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

export default function RevenuePage() {
  const { data: rev, isLoading, refetch } = useQuery({
    queryKey: ['payments-revenue'],
    queryFn: () => apiClient<RevenueSummary>('/payments/revenue-summary'),
  });

  const pieData = rev?.byMethod?.filter(m => m.amountCents > 0).map(m => ({
    name: METHOD_CONFIG[m.method]?.label ?? m.method,
    value: m.amountCents / 100,
    amountCents: m.amountCents,
  })) ?? [];

  const barData = rev?.byMethod?.map(m => ({
    method: METHOD_CONFIG[m.method]?.label ?? m.method,
    amount: m.amountCents / 100,
  })) ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ ...card(), padding: '22px 26px', background: 'linear-gradient(135deg, rgba(0,194,122,0.10) 0%, rgba(24,35,61,0.98) 70%)', border: '1px solid rgba(0,194,122,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #00C27A, #4DA2FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,194,122,0.28)' }}>
            <DollarSign style={{ width: '18px', height: '18px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ color: V.text, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Revenue & Finance</h1>
            <p style={{ color: V.textMuted, fontSize: '12px' }}>Payment collections & financial overview</p>
          </div>
        </div>
        <button onClick={() => refetch()} style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <RefreshCw style={{ width: '14px', height: '14px', color: V.textSec }} />
        </button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-[14px]">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ ...card({ height: '110px' }) }} className="shimmer-card" />)}
        </div>
      ) : !rev ? null : (
        <>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
            {[
              { label: 'Month-to-Date', value: formatCurrency(rev.monthToDateRevenueCents), icon: TrendingUp, color: V.success, glow: 'rgba(0,194,122,0.15)', sub: 'Total collected this month', trend: 'up' as const },
              { label: 'Pending', value: formatCurrency(rev.pendingRevenueCents), icon: Clock, color: V.warning, glow: 'rgba(255,181,71,0.12)', sub: 'Awaiting collection', trend: 'neutral' as const },
              { label: 'Overdue', value: formatCurrency(rev.overdueRevenueCents), icon: AlertTriangle, color: rev.overdueRevenueCents > 0 ? V.danger : V.success, glow: rev.overdueRevenueCents > 0 ? 'rgba(255,90,111,0.12)' : 'rgba(0,194,122,0.10)', sub: rev.overdueRevenueCents > 0 ? 'Action required' : 'All clear', trend: rev.overdueRevenueCents > 0 ? 'down' as const : 'up' as const },
            ].map(({ label, value, icon: Icon, color, glow, sub, trend }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ ...card({ padding: '22px', position: 'relative', overflow: 'hidden' }) }}>
                <div style={{ position: 'absolute', top: '-25px', right: '-25px', width: '90px', height: '90px', borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</p>
                    <p style={{ color: V.text, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
                    <p style={{ color: trend === 'up' ? V.success : trend === 'down' ? V.danger : V.textMuted, fontSize: '11.5px', marginTop: '8px', fontWeight: 500 }}>{sub}</p>
                  </div>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: glow, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: '18px', height: '18px', color }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-[14px]">
            {/* Bar chart: by method */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={card({ padding: '24px' })}>
              <p style={{ color: V.text, fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Revenue by Method</p>
              <p style={{ color: V.textMuted, fontSize: '12px', marginBottom: '20px' }}>Breakdown by payment channel</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="method" tick={{ fill: V.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: V.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {barData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} opacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Pie chart: method distribution */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={card({ padding: '24px' })}>
              <p style={{ color: V.text, fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Payment Distribution</p>
              <p style={{ color: V.textMuted, fontSize: '12px', marginBottom: '12px' }}>Share by channel</p>
              {pieData.length > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height={150}>
                      <RPie>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                          {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} stroke="transparent" />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RPie>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {pieData.map((d, idx) => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: PIE_COLORS[idx % PIE_COLORS.length], flexShrink: 0 }} />
                          <span style={{ color: V.textSec, fontSize: '12px' }}>{d.name}</span>
                        </div>
                        <span style={{ color: V.text, fontSize: '12px', fontWeight: 600 }}>{formatCurrency(d.amountCents)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: V.textMuted, fontSize: '13px' }}>No payment data</div>
              )}
            </motion.div>
          </div>

          {/* Payment method breakdown cards */}
          <div>
            <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>By Payment Method</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {rev.byMethod.map((m, i) => {
                const cfg = METHOD_CONFIG[m.method] ?? { label: m.method, icon: DollarSign, color: V.primary };
                const Icon = cfg.icon;
                return (
                  <motion.div key={m.method} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    style={{ ...card({ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }) }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: `${cfg.color}18`, border: `1px solid ${cfg.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: '16px', height: '16px', color: cfg.color }} />
                    </div>
                    <div>
                      <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{cfg.label}</p>
                      <p style={{ color: V.text, fontSize: '17px', fontWeight: 700 }}>{formatCurrency(m.amountCents)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
