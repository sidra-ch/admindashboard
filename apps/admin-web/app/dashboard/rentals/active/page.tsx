'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiClient } from '../../../../lib/api-client';
import { formatCurrency, formatDateTime } from '../../../../lib/formatters';
import {
  Car, Search, Clock, AlertTriangle, CheckCircle2, DollarSign,
  RefreshCw, Calendar, User, MapPin, ArrowRight, Plus, Activity,
  ChevronRight, Filter, Zap, RotateCcw,
} from 'lucide-react';

const V = {
  bg: '#0B1020', surface: '#121A2F', card: '#18233D',
  border: 'rgba(255,255,255,0.08)', primary: '#4DA2FF', secondary: '#00D1FF',
  success: '#00C27A', warning: '#FFB547', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px', ...extra,
});

type Rental = {
  id: string; status: string;
  pickupAt: string; expectedReturnAt: string; actualReturnAt?: string | null;
  totalCents?: number; balanceDueCents: number;
  customer: { id?: string; firstName: string; lastName: string; phone?: string };
  car: { id?: string; make?: string; brand?: string; model: string; registrationNumber: string };
  branch?: { name: string };
};

type RentalsResponse = { items: Rental[]; total?: number };

const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE:     { label: 'Active',      color: '#4DA2FF', bg: 'rgba(77,162,255,0.10)',  border: 'rgba(77,162,255,0.22)'  },
  OVERDUE:    { label: 'Overdue',     color: '#FF5A6F', bg: 'rgba(255,90,111,0.10)',  border: 'rgba(255,90,111,0.22)'  },
  RESERVED:   { label: 'Reserved',   color: '#00D1FF', bg: 'rgba(0,209,255,0.10)',   border: 'rgba(0,209,255,0.22)'   },
  RETURNING:  { label: 'Returning',  color: '#FFB547', bg: 'rgba(255,181,71,0.10)',  border: 'rgba(255,181,71,0.22)'  },
  COMPLETED:  { label: 'Completed',  color: '#00C27A', bg: 'rgba(0,194,122,0.10)',   border: 'rgba(0,194,122,0.22)'   },
};

function getSt(s: string) { return STATUS[s] ?? STATUS.ACTIVE; }

function daysLeft(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

export default function ActiveRentalsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rentals-active'],
    queryFn: () => apiClient<RentalsResponse>('/rentals/active?page=1&pageSize=50'),
  });

  const rentals = data?.items ?? [];

  const stats = useMemo(() => ({
    total: rentals.length,
    overdue: rentals.filter(r => r.status === 'OVERDUE' || (r.status === 'ACTIVE' && daysLeft(r.expectedReturnAt) < 0)).length,
    returningToday: rentals.filter(r => { const d = daysLeft(r.expectedReturnAt); return d >= 0 && d <= 1; }).length,
    revenue: rentals.reduce((acc, r) => acc + (r.balanceDueCents ?? 0), 0),
  }), [rentals]);

  const filtered = useMemo(() => rentals.filter(r => {
    const name = `${r.customer.firstName} ${r.customer.lastName}`.toLowerCase();
    const carStr = `${r.car.make ?? r.car.brand ?? ''} ${r.car.model} ${r.car.registrationNumber}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || carStr.includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || r.status === filter;
    return matchSearch && matchFilter;
  }), [rentals, search, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ ...card(), padding: '22px 26px', background: 'linear-gradient(135deg, rgba(0,209,255,0.10) 0%, rgba(24,35,61,0.98) 70%)', border: '1px solid rgba(0,209,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #00D1FF, #4DA2FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,209,255,0.28)' }}>
            <Activity style={{ width: '18px', height: '18px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ color: V.text, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Active Rentals</h1>
            <p style={{ color: V.textMuted, fontSize: '12px' }}>{rentals.length} rentals in progress</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => refetch()} style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw style={{ width: '14px', height: '14px', color: V.textSec }} />
          </button>
          <Link href="/dashboard/rentals/bookings/new" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '11px', background: V.secondary, color: '#0B1020', fontWeight: 700, fontSize: '13px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,209,255,0.28)' }}>
            <Plus style={{ width: '14px', height: '14px' }} /> New Booking
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-[14px]">
        {[
          { label: 'Active', value: stats.total, icon: Car, color: V.primary, glow: 'rgba(77,162,255,0.12)' },
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: stats.overdue > 0 ? V.danger : V.success, glow: stats.overdue > 0 ? 'rgba(255,90,111,0.12)' : 'rgba(0,194,122,0.10)' },
          { label: 'Due Today', value: stats.returningToday, icon: RotateCcw, color: V.warning, glow: 'rgba(255,181,71,0.12)' },
          { label: 'Balance Due', value: formatCurrency(stats.revenue), icon: DollarSign, color: V.success, glow: 'rgba(0,194,122,0.12)' },
        ].map(({ label, value, icon: Icon, color, glow }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ ...card({ padding: '18px 20px', position: 'relative', overflow: 'hidden' }) }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '70px', height: '70px', borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: glow, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: '16px', height: '16px', color }} />
              </div>
              <div>
                <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ color: V.text, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: V.textMuted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, vehicle, plate..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '12px', background: V.card, border: `1px solid ${V.border}`, color: V.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'ACTIVE', 'OVERDUE', 'RESERVED', 'RETURNING'].map(s => {
            const active = filter === s;
            const cfg = s !== 'ALL' ? getSt(s) : null;
            return (
              <button key={s} onClick={() => setFilter(s)}
                style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? (cfg?.border ?? V.primary + '40') : V.border}`, background: active ? (cfg?.bg ?? 'rgba(77,162,255,0.10)') : 'transparent', color: active ? (cfg?.color ?? V.primary) : V.textMuted, transition: 'all 0.15s' }}>
                {s === 'ALL' ? 'All' : getSt(s).label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ ...card({ height: '80px', padding: '0' }) }} className="shimmer-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card({ padding: '60px', textAlign: 'center' }) }}>
          <Car style={{ width: '48px', height: '48px', color: V.textMuted, margin: '0 auto 16px', opacity: 0.5 }} />
          <p style={{ color: V.text, fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No rentals found</p>
          <p style={{ color: V.textMuted, fontSize: '13px' }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((rental, i) => {
            const st = getSt(rental.status);
            const dl = daysLeft(rental.expectedReturnAt);
            const overdue = dl < 0;
            const dueSoon = dl >= 0 && dl <= 1;
            return (
              <motion.div key={rental.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                whileHover={{ y: -1, transition: { duration: 0.15 } }}>
                <Link href={`/dashboard/rentals/${rental.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{ ...card({ padding: '16px 20px' }), display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'border-color 0.15s', borderColor: overdue ? 'rgba(255,90,111,0.20)' : dueSoon ? 'rgba(255,181,71,0.20)' : V.border }}>
                    {/* Avatar */}
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `linear-gradient(135deg, ${st.color}25, ${st.color}10)`, border: `1px solid ${st.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User style={{ width: '17px', height: '17px', color: st.color }} />
                    </div>

                    {/* Customer + vehicle */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: V.text, fontSize: '14px', fontWeight: 600 }}>{rental.customer.firstName} {rental.customer.lastName}</p>
                      <p style={{ color: V.textMuted, fontSize: '11.5px', marginTop: '2px' }}>
                        {rental.car.make ?? rental.car.brand ?? ''} {rental.car.model} · {rental.car.registrationNumber}
                        {rental.branch ? ` · ${rental.branch.name}` : ''}
                      </p>
                    </div>

                    {/* Return date */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: overdue ? V.danger : dueSoon ? V.warning : V.textSec, fontSize: '12px', fontWeight: 600 }}>
                        {overdue ? <AlertTriangle style={{ width: '12px', height: '12px' }} /> : <Clock style={{ width: '12px', height: '12px' }} />}
                        {overdue ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Due today' : dl === 1 ? 'Due tomorrow' : `${dl}d left`}
                      </div>
                      <p style={{ color: V.textMuted, fontSize: '10.5px', marginTop: '2px' }}>{formatDateTime(rental.expectedReturnAt)}</p>
                    </div>

                    {/* Balance */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ color: rental.balanceDueCents > 0 ? V.warning : V.success, fontSize: '14px', fontWeight: 700 }}>
                        {formatCurrency(rental.balanceDueCents)}
                      </p>
                      <p style={{ color: V.textMuted, fontSize: '10px', marginTop: '2px' }}>balance due</p>
                    </div>

                    {/* Status badge */}
                    <span style={{ padding: '4px 12px', borderRadius: '8px', background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      {st.label}
                    </span>

                    <ChevronRight style={{ width: '15px', height: '15px', color: V.textMuted, flexShrink: 0 }} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
