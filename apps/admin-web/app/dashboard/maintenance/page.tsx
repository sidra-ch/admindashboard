'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  Wrench, Plus, Clock, CheckCircle2, AlertTriangle, Car,
  Calendar, DollarSign, Search, ChevronRight, RefreshCw, Activity,
  Timer, CheckSquare, XCircle,
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

type MaintenanceRecord = {
  id: string; type: string; status: string; description?: string;
  scheduledDate: string; completedDate?: string | null; costCents?: number | null;
  car: { id: string; brand?: string; make?: string; model: string; registrationNumber: string };
  branch?: { name: string };
  technician?: string;
};

type MaintenanceResponse = { items: MaintenanceRecord[] };

const STATUS: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  SCHEDULED:   { label: 'Scheduled',   color: '#4DA2FF', bg: 'rgba(77,162,255,0.10)',  border: 'rgba(77,162,255,0.22)',  icon: Clock         },
  IN_PROGRESS: { label: 'In Progress', color: '#FFB547', bg: 'rgba(255,181,71,0.10)',  border: 'rgba(255,181,71,0.22)',  icon: Timer         },
  COMPLETED:   { label: 'Completed',   color: '#00C27A', bg: 'rgba(0,194,122,0.10)',   border: 'rgba(0,194,122,0.22)',   icon: CheckCircle2  },
  CANCELLED:   { label: 'Cancelled',   color: '#6E7A99', bg: 'rgba(110,122,153,0.10)', border: 'rgba(110,122,153,0.18)', icon: XCircle       },
};
const getSt = (s: string) => STATUS[s] ?? STATUS.SCHEDULED;

const TYPE_LABELS: Record<string, string> = {
  ROUTINE_SERVICE:  'Routine Service', TYRE_REPLACEMENT: 'Tyres',
  BRAKE_SERVICE:    'Brakes',          ENGINE_REPAIR:    'Engine',
  BODY_REPAIR:      'Body',            ELECTRICAL:       'Electrical',
  OTHER:            'Other',
};

const TYPE_ICONS: Record<string, string> = {
  ROUTINE_SERVICE: '🔧', TYRE_REPLACEMENT: '🔵', BRAKE_SERVICE: '🔴',
  ENGINE_REPAIR: '⚙️', BODY_REPAIR: '🚗', ELECTRICAL: '⚡', OTHER: '🛠️',
};

export default function MaintenancePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => apiClient<MaintenanceResponse>('/maintenance?limit=100'),
    select: r => r.items,
  });

  const records = data ?? [];

  const stats = useMemo(() => ({
    total: records.length,
    scheduled: records.filter(r => r.status === 'SCHEDULED').length,
    inProgress: records.filter(r => r.status === 'IN_PROGRESS').length,
    completed: records.filter(r => r.status === 'COMPLETED').length,
    totalCost: records.reduce((s, r) => s + (r.costCents ?? 0), 0),
  }), [records]);

  const filtered = useMemo(() => records.filter(r => {
    const text = `${r.car.brand ?? r.car.make ?? ''} ${r.car.model} ${r.car.registrationNumber} ${TYPE_LABELS[r.type] ?? r.type}`.toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  }), [records, search, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ ...card(), padding: '22px 26px', background: 'linear-gradient(135deg, rgba(255,181,71,0.10) 0%, rgba(24,35,61,0.98) 70%)', border: '1px solid rgba(255,181,71,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #FFB547, #FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(255,181,71,0.28)' }}>
            <Wrench style={{ width: '18px', height: '18px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ color: V.text, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Maintenance Center</h1>
            <p style={{ color: V.textMuted, fontSize: '12px' }}>{records.length} maintenance records</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => refetch()} style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw style={{ width: '14px', height: '14px', color: V.textSec }} />
          </button>
          <Link href="/dashboard/maintenance/new" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '11px', background: V.warning, color: '#0B1020', fontWeight: 700, fontSize: '13px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(255,181,71,0.28)' }}>
            <Plus style={{ width: '14px', height: '14px' }} /> Schedule Service
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total', value: stats.total, icon: Wrench, color: V.warning, glow: 'rgba(255,181,71,0.12)' },
          { label: 'Scheduled', value: stats.scheduled, icon: Clock, color: V.primary, glow: 'rgba(77,162,255,0.12)' },
          { label: 'In Progress', value: stats.inProgress, icon: Timer, color: V.secondary, glow: 'rgba(0,209,255,0.12)' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: V.success, glow: 'rgba(0,194,122,0.12)' },
          { label: 'Total Cost', value: formatCurrency(stats.totalCost), icon: DollarSign, color: '#A78BFA', glow: 'rgba(167,139,250,0.12)' },
        ].map(({ label, value, icon: Icon, color, glow }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ ...card({ padding: '16px 18px', position: 'relative', overflow: 'hidden' }) }}>
            <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '60px', height: '60px', borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: glow, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <Icon style={{ width: '15px', height: '15px', color }} />
            </div>
            <p style={{ color: V.textMuted, fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</p>
            <p style={{ color: V.text, fontSize: typeof value === 'number' ? '24px' : '16px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: '4px' }}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: V.textMuted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicle, type..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '12px', background: V.card, border: `1px solid ${V.border}`, color: V.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => {
            const active = statusFilter === s;
            const cfg = s !== 'ALL' ? getSt(s) : null;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? (cfg?.border ?? V.primary + '40') : V.border}`, background: active ? (cfg?.bg ?? 'rgba(77,162,255,0.10)') : 'transparent', color: active ? (cfg?.color ?? V.primary) : V.textMuted, transition: 'all 0.15s' }}>
                {s === 'ALL' ? 'All' : getSt(s).label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Records list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ ...card({ height: '80px' }) }} className="shimmer-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card({ padding: '60px', textAlign: 'center' }) }}>
          <Wrench style={{ width: '48px', height: '48px', color: V.textMuted, margin: '0 auto 16px', opacity: 0.5 }} />
          <p style={{ color: V.text, fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No records found</p>
          <p style={{ color: V.textMuted, fontSize: '13px', marginBottom: '20px' }}>No maintenance records match your filters</p>
          <Link href="/dashboard/maintenance/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '11px', background: V.warning, color: '#0B1020', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>
            <Plus style={{ width: '14px', height: '14px' }} /> Schedule First Service
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((record, i) => {
            const st = getSt(record.status);
            const StatusIcon = st.icon;
            return (
              <motion.div key={record.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} whileHover={{ y: -1, transition: { duration: 0.15 } }}>
                <Link href={`/dashboard/maintenance/${record.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{ ...card({ padding: '16px 20px' }), display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                    {/* Type icon */}
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: st.bg, border: `1px solid ${st.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>
                      {TYPE_ICONS[record.type] ?? '🛠️'}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <p style={{ color: V.text, fontSize: '13.5px', fontWeight: 700 }}>{TYPE_LABELS[record.type] ?? record.type}</p>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '2px 9px', borderRadius: '7px', background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontSize: '10.5px', fontWeight: 700 }}>
                          <StatusIcon style={{ width: '10px', height: '10px' }} /> {st.label}
                        </span>
                      </div>
                      <p style={{ color: V.textMuted, fontSize: '11.5px' }}>
                        {record.car.brand ?? record.car.make ?? ''} {record.car.model} · {record.car.registrationNumber}
                        {record.branch ? ` · ${record.branch.name}` : ''}
                        {record.technician ? ` · ${record.technician}` : ''}
                      </p>
                      {record.description && (
                        <p style={{ color: V.textMuted, fontSize: '11px', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.description}</p>
                      )}
                    </div>
                    {/* Date & cost */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: V.textSec, fontSize: '12px', justifyContent: 'flex-end' }}>
                        <Calendar style={{ width: '11px', height: '11px' }} />
                        {formatDate(record.scheduledDate)}
                      </div>
                      {record.costCents != null && record.costCents > 0 && (
                        <p style={{ color: V.warning, fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>{formatCurrency(record.costCents)}</p>
                      )}
                    </div>
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
