'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiClient } from '../../../lib/api-client';
import { formatCurrency } from '../../../lib/formatters';
import {
  BarChart3, TrendingUp, Car, Users, DollarSign, Wrench,
  Download, RefreshCw, Calendar, ArrowUpRight, Target, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
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

type DashboardOverview = {
  kpis: {
    totalCars: number; availableCars: number; rentedCars: number;
    carsInMaintenance: number; overdueRentals: number; pendingPayments: number;
    monthlyRevenueCents: number; maintenanceCostThisMonthCents: number;
  };
  charts: {
    rentalsTrend: Array<{ month: string; rentals: number }>;
    revenueTrend: Array<{ month: string; revenueCents: number }>;
  };
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#121A2F', border: '1px solid rgba(77,162,255,0.22)', borderRadius: '10px', padding: '8px 14px' }}>
      <p style={{ color: V.textMuted, fontSize: '10.5px', marginBottom: '4px' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? V.primary, fontSize: '13px', fontWeight: 700 }}>
          {p.name === 'revenue' ? formatCurrency(p.value * 100) : p.value}
        </p>
      ))}
    </div>
  );
}

const PIE_COLORS = ['#4DA2FF', '#00C27A', '#FFB547', '#FF5A6F', '#A78BFA', '#00D1FF'];

export default function ReportsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiClient<DashboardOverview>('/dashboard/overview'),
  });

  const revenueData = data?.charts.revenueTrend.map(d => ({
    month: d.month,
    revenue: d.revenueCents / 100,
  })) ?? [];

  const fleetPie = data ? [
    { name: 'Available', value: data.kpis.availableCars, color: V.success },
    { name: 'Rented', value: data.kpis.rentedCars, color: V.primary },
    { name: 'Maintenance', value: data.kpis.carsInMaintenance, color: V.warning },
  ].filter(d => d.value > 0) : [];

  const totalRevenue = (data?.charts.revenueTrend ?? []).reduce((s, d) => s + d.revenueCents, 0);
  const avgMonthly = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ ...card(), padding: '22px 26px', background: 'linear-gradient(135deg, rgba(167,139,250,0.10) 0%, rgba(24,35,61,0.98) 70%)', border: '1px solid rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #A78BFA, #4DA2FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(167,139,250,0.28)' }}>
            <BarChart3 style={{ width: '18px', height: '18px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ color: V.text, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Reports & Analytics</h1>
            <p style={{ color: V.textMuted, fontSize: '12px' }}>Business intelligence & performance metrics</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => refetch()} style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw style={{ width: '14px', height: '14px', color: V.textSec }} />
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '11px', background: '#A78BFA', color: 'white', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(167,139,250,0.28)' }}>
            <Download style={{ width: '14px', height: '14px' }} /> Export Report
          </button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-[14px]">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ ...card({ height: '110px' }) }} className="shimmer-card" />)}
        </div>
      ) : !data ? null : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
            {[
              { label: 'Total MTD Revenue', value: formatCurrency(data.kpis.monthlyRevenueCents), icon: DollarSign, color: V.success, glow: 'rgba(0,194,122,0.12)', sub: 'This month' },
              { label: 'Avg Monthly Revenue', value: formatCurrency(avgMonthly), icon: TrendingUp, color: '#A78BFA', glow: 'rgba(167,139,250,0.12)', sub: `Over ${revenueData.length} months` },
              { label: 'Fleet Utilization', value: `${data.kpis.totalCars > 0 ? Math.round((data.kpis.rentedCars / data.kpis.totalCars) * 100) : 0}%`, icon: Target, color: V.primary, glow: 'rgba(77,162,255,0.12)', sub: `${data.kpis.rentedCars}/${data.kpis.totalCars} vehicles` },
              { label: 'Maintenance Cost', value: formatCurrency(data.kpis.maintenanceCostThisMonthCents), icon: Wrench, color: V.warning, glow: 'rgba(255,181,71,0.12)', sub: 'This month' },
            ].map(({ label, value, icon: Icon, color, glow, sub }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ ...card({ padding: '22px', position: 'relative', overflow: 'hidden' }) }}>
                <div style={{ position: 'absolute', top: '-25px', right: '-25px', width: '90px', height: '90px', borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</p>
                    <p style={{ color: V.text, fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
                    <p style={{ color: V.textMuted, fontSize: '11.5px', marginTop: '8px' }}>{sub}</p>
                  </div>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: glow, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: '17px', height: '17px', color }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Revenue trend */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={card({ padding: '24px' })}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <p style={{ color: V.text, fontSize: '15px', fontWeight: 700 }}>Revenue Trend (12 Months)</p>
                <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '3px' }}>Monthly collections over last year</p>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(0,194,122,0.10)', border: '1px solid rgba(0,194,122,0.18)', color: V.success, fontSize: '12px', fontWeight: 600 }}>
                <ArrowUpRight style={{ width: '12px', height: '12px' }} /> Growing
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: V.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: V.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#A78BFA" strokeWidth={2} fill="url(#rGrad)" dot={false} activeDot={{ r: 5, fill: '#A78BFA', stroke: '#18233D', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Rentals volume + Fleet pie */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-[14px]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={card({ padding: '24px' })}>
              <p style={{ color: V.text, fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Rental Volume</p>
              <p style={{ color: V.textMuted, fontSize: '12px', marginBottom: '20px' }}>Monthly bookings completed</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.charts.rentalsTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: V.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: V.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rentals" fill={V.primary} radius={[5, 5, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={card({ padding: '24px' })}>
              <p style={{ color: V.text, fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Fleet Status Split</p>
              <p style={{ color: V.textMuted, fontSize: '12px', marginBottom: '12px' }}>{data.kpis.totalCars} total vehicles</p>
              {fleetPie.length > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={fleetPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                          {fleetPie.map((d, idx) => <Cell key={idx} fill={d.color} stroke="transparent" />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {fleetPie.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: d.color, flexShrink: 0 }} />
                          <span style={{ color: V.textSec, fontSize: '12px' }}>{d.name}</span>
                        </div>
                        <span style={{ color: V.text, fontSize: '12px', fontWeight: 600 }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
