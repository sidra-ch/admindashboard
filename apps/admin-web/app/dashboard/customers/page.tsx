'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiClient } from '../../../lib/api-client';
import {
  Users, Search, Plus, ShieldCheck, ShieldAlert, Shield,
  Mail, ChevronRight, UserCheck, AlertTriangle, Star, RefreshCw,
  Phone, CreditCard, Activity,
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

type CustomerItem = {
  id: string; firstName: string; lastName: string;
  email: string | null; phone?: string | null; licenseNumber: string;
  status: string; riskLevel: string;
  totalRentals?: number; totalSpentCents?: number;
};

type CustomersResponse = { items: CustomerItem[] };

const RISK: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  LOW:    { color: '#00C27A', bg: 'rgba(0,194,122,0.10)',  border: 'rgba(0,194,122,0.20)',  icon: ShieldCheck, label: 'Low Risk'    },
  MEDIUM: { color: '#FFB547', bg: 'rgba(255,181,71,0.10)', border: 'rgba(255,181,71,0.20)', icon: Shield,      label: 'Medium Risk' },
  HIGH:   { color: '#FF5A6F', bg: 'rgba(255,90,111,0.10)', border: 'rgba(255,90,111,0.20)', icon: ShieldAlert, label: 'High Risk'   },
};
const getRisk = (r: string) => RISK[r] ?? RISK.LOW;

const STATUS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  ACTIVE:   { color: '#00C27A', bg: 'rgba(0,194,122,0.10)',  border: 'rgba(0,194,122,0.20)',  label: 'Active'   },
  INACTIVE: { color: '#6E7A99', bg: 'rgba(110,122,153,0.10)',border: 'rgba(110,122,153,0.18)',label: 'Inactive' },
  BLOCKED:  { color: '#FF5A6F', bg: 'rgba(255,90,111,0.10)', border: 'rgba(255,90,111,0.20)', label: 'Blocked'  },
};
const getStatus = (s: string) => STATUS[s] ?? STATUS.ACTIVE;

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

const AVATAR_COLORS = ['#4DA2FF', '#00C27A', '#A78BFA', '#F472B6', '#FFB547', '#00D1FF'];

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiClient<CustomersResponse>('/customers?limit=100'),
    select: r => r.items,
  });

  const customers = data ?? [];

  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter(c => c.status === 'ACTIVE').length,
    highRisk: customers.filter(c => c.riskLevel === 'HIGH').length,
    blocked: customers.filter(c => c.status === 'BLOCKED').length,
  }), [customers]);

  const filtered = useMemo(() => customers.filter(c => {
    const name = `${c.firstName} ${c.lastName} ${c.email ?? ''} ${c.licenseNumber}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchRisk = riskFilter === 'ALL' || c.riskLevel === riskFilter;
    return matchSearch && matchRisk;
  }), [customers, search, riskFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ ...card(), padding: '22px 26px', background: 'linear-gradient(135deg, rgba(244,114,182,0.10) 0%, rgba(24,35,61,0.98) 70%)', border: '1px solid rgba(244,114,182,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #F472B6, #FF5A6F)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(244,114,182,0.28)' }}>
            <Users style={{ width: '18px', height: '18px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ color: V.text, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Customer CRM</h1>
            <p style={{ color: V.textMuted, fontSize: '12px' }}>{customers.length} registered customers</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => refetch()} style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw style={{ width: '14px', height: '14px', color: V.textSec }} />
          </button>
          <Link href="/dashboard/customers/new" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '11px', background: '#F472B6', color: 'white', fontWeight: 700, fontSize: '13px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(244,114,182,0.28)' }}>
            <Plus style={{ width: '14px', height: '14px' }} /> Add Customer
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total', value: stats.total, icon: Users, color: '#F472B6', glow: 'rgba(244,114,182,0.12)' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: V.success, glow: 'rgba(0,194,122,0.12)' },
          { label: 'High Risk', value: stats.highRisk, icon: ShieldAlert, color: V.danger, glow: 'rgba(255,90,111,0.12)' },
          { label: 'Blocked', value: stats.blocked, icon: AlertTriangle, color: V.warning, glow: 'rgba(255,181,71,0.12)' },
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
                <p style={{ color: V.text, fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: V.textMuted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, license..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '12px', background: V.card, border: `1px solid ${V.border}`, color: V.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map(r => {
            const active = riskFilter === r;
            const cfg = r !== 'ALL' ? getRisk(r) : null;
            return (
              <button key={r} onClick={() => setRiskFilter(r)}
                style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? (cfg?.border ?? V.primary + '40') : V.border}`, background: active ? (cfg?.bg ?? 'rgba(77,162,255,0.10)') : 'transparent', color: active ? (cfg?.color ?? V.primary) : V.textMuted, transition: 'all 0.15s' }}>
                {r === 'ALL' ? 'All Customers' : getRisk(r).label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ ...card({ height: '140px' }) }} className="shimmer-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card({ padding: '60px', textAlign: 'center' }) }}>
          <Users style={{ width: '48px', height: '48px', color: V.textMuted, margin: '0 auto 16px', opacity: 0.5 }} />
          <p style={{ color: V.text, fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No customers found</p>
          <p style={{ color: V.textMuted, fontSize: '13px' }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filtered.map((customer, i) => {
            const risk = getRisk(customer.riskLevel);
            const status = getStatus(customer.status);
            const RiskIcon = risk.icon;
            const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <motion.div key={customer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                <Link href={`/dashboard/customers/${customer.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{ ...card(), padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: `radial-gradient(circle, ${avatarColor}10 0%, transparent 70%)`, pointerEvents: 'none' }} />

                    {/* Avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `linear-gradient(135deg, ${avatarColor}30, ${avatarColor}10)`, border: `1px solid ${avatarColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '15px', color: avatarColor }}>
                        {initials(customer.firstName, customer.lastName)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: V.text, fontSize: '14px', fontWeight: 700 }}>{customer.firstName} {customer.lastName}</p>
                        {customer.email && (
                          <p style={{ color: V.textMuted, fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <CreditCard style={{ width: '12px', height: '12px', color: V.textMuted, flexShrink: 0 }} />
                        <span style={{ color: V.textSec, fontSize: '11.5px' }}>License: {customer.licenseNumber}</span>
                      </div>
                      {customer.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <Phone style={{ width: '12px', height: '12px', color: V.textMuted, flexShrink: 0 }} />
                          <span style={{ color: V.textSec, fontSize: '11.5px' }}>{customer.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '7px', background: risk.bg, border: `1px solid ${risk.border}`, color: risk.color, fontSize: '10.5px', fontWeight: 700 }}>
                          <RiskIcon style={{ width: '10px', height: '10px' }} /> {risk.label}
                        </span>
                        <span style={{ padding: '3px 9px', borderRadius: '7px', background: status.bg, border: `1px solid ${status.border}`, color: status.color, fontSize: '10.5px', fontWeight: 700 }}>
                          {status.label}
                        </span>
                      </div>
                      <ChevronRight style={{ width: '14px', height: '14px', color: V.textMuted, flexShrink: 0 }} />
                    </div>
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
