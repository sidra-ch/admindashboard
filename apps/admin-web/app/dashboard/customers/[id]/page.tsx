'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { formatCurrency, formatDate, formatDateTime } from '../../../../lib/formatters';
import {
  ArrowLeft, User, Mail, Phone, CreditCard, Calendar, Shield,
  Car, Clock, DollarSign, Loader2, AlertTriangle, FileText,
} from 'lucide-react';

const V = {
  bg: '#0B1020', surface: '#121A2F', card: '#18233D',
  border: 'rgba(255,255,255,0.08)', primary: '#4DA2FF',
  success: '#00C27A', warning: '#FFB547', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

const card: React.CSSProperties = {
  background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px',
};

const RISK_CFG: Record<string, { color: string; bg: string }> = {
  LOW:    { color: V.success, bg: 'rgba(0,194,122,0.12)' },
  MEDIUM: { color: V.warning, bg: 'rgba(255,181,71,0.12)' },
  HIGH:   { color: V.danger,  bg: 'rgba(255,90,111,0.12)' },
};
const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  ACTIVE:    { color: V.success, bg: 'rgba(0,194,122,0.12)' },
  SUSPENDED: { color: V.danger,  bg: 'rgba(255,90,111,0.12)' },
  INACTIVE:  { color: V.textMuted, bg: 'rgba(255,255,255,0.06)' },
};
const RENTAL_STATUS_CFG: Record<string, { color: string }> = {
  ACTIVE:    { color: V.success },
  COMPLETED: { color: V.primary },
  CANCELLED: { color: V.textMuted },
  OVERDUE:   { color: V.danger },
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(77,162,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: '14px', height: '14px', color: V.primary }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        <p style={{ color: V.text, fontSize: '13px', fontWeight: 500, marginTop: '1px' }}>{value}</p>
      </div>
    </div>
  );
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const customerQuery = useQuery({
    queryKey: ['customer', resolvedParams.id],
    queryFn: () => apiClient<any>(`/customers/${resolvedParams.id}`),
  });

  if (customerQuery.isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '12px' }}>
      <Loader2 style={{ width: '22px', height: '22px', color: V.primary, animation: 'spin 1s linear infinite' }} />
      <span style={{ color: V.textMuted, fontSize: '14px' }}>Loading customer...</span>
    </div>
  );

  if (customerQuery.isError || !customerQuery.data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '12px' }}>
      <AlertTriangle style={{ width: '22px', height: '22px', color: V.danger }} />
      <span style={{ color: V.danger, fontSize: '14px' }}>Unable to load customer.</span>
    </div>
  );

  const c = customerQuery.data;
  const statusCfg = STATUS_CFG[c.status] ?? { color: V.textSec, bg: 'rgba(255,255,255,0.06)' };
  const riskCfg   = RISK_CFG[c.riskLevel]  ?? { color: V.textSec, bg: 'rgba(255,255,255,0.06)' };
  const initials  = `${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <Link href="/dashboard/customers">
          <button style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: V.textSec }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
          </button>
        </Link>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #4DA2FF 0%, #0078FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: V.text, fontSize: '20px', fontWeight: 800 }}>{c.firstName} {c.lastName}</h1>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: statusCfg.bg, color: statusCfg.color }}>{c.status}</span>
            <span style={{ padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: riskCfg.bg, color: riskCfg.color }}>Risk: {c.riskLevel}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '16px', alignItems: 'start' }} className="xl:!grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">

        {/* Left — profile info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ ...card, padding: '20px' }}>
            <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Contact Information</p>
            <InfoRow icon={Mail}  label="Email"   value={c.email ?? '—'} />
            <InfoRow icon={Phone} label="Phone"   value={c.phone ?? '—'} />
            <InfoRow icon={User}  label="Address" value={c.address ?? '—'} />
          </div>

          <div style={{ ...card, padding: '20px' }}>
            <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>License Details</p>
            <InfoRow icon={CreditCard} label="License Number" value={c.licenseNumber ?? '—'} />
            <InfoRow icon={Calendar}   label="Expiry Date"    value={c.licenseExpiry ? formatDate(c.licenseExpiry) : 'Not set'} />
            <InfoRow icon={Shield}     label="License State"  value={c.licenseState ?? '—'} />
          </div>
        </div>

        {/* Right — recent rentals */}
        <div style={card}>
          <div style={{ padding: '16px 18px', borderBottom: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText style={{ width: '14px', height: '14px', color: V.primary }} />
            <p style={{ color: V.text, fontSize: '13px', fontWeight: 700 }}>Recent Rentals</p>
            <span style={{ marginLeft: 'auto', background: 'rgba(77,162,255,0.12)', color: V.primary, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>{(c.rentals ?? []).length}</span>
          </div>
          {(c.rentals ?? []).length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Car style={{ width: '28px', height: '28px', color: V.textMuted, margin: '0 auto 8px' }} />
              <p style={{ color: V.textMuted, fontSize: '12px' }}>No rentals yet</p>
            </div>
          )}
          {(c.rentals ?? []).map((rental: any) => {
            const sc = RENTAL_STATUS_CFG[rental.status] ?? { color: V.textSec };
            return (
              <Link key={rental.id} href={`/dashboard/rentals/${rental.id}`}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid rgba(255,255,255,0.04)`, cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <p style={{ color: V.text, fontSize: '13px', fontWeight: 600 }}>{rental.car?.make} {rental.car?.model}</p>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: sc.color }}>{rental.status}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock style={{ width: '11px', height: '11px', color: V.textMuted }} />
                      <span style={{ color: V.textMuted, fontSize: '11px' }}>{formatDateTime(rental.pickupAt)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <DollarSign style={{ width: '11px', height: '11px', color: V.textMuted }} />
                      <span style={{ color: V.textMuted, fontSize: '11px' }}>{formatCurrency(rental.balanceDueCents)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
