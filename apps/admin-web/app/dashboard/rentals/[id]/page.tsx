'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { formatCurrency, formatDateTime } from '../../../../lib/formatters';
import {
  ArrowLeft, User, Car, Calendar, Clock, DollarSign,
  Loader2, AlertTriangle, ReceiptText, RefreshCw, ChevronRight, CreditCard,
} from 'lucide-react';

const V = {
  card: '#18233D', border: 'rgba(255,255,255,0.08)',
  primary: '#4DA2FF', success: '#00C27A', warning: '#FFB547',
  danger: '#FF5A6F', text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  ACTIVE:    { color: V.success,   bg: 'rgba(0,194,122,0.12)' },
  COMPLETED: { color: V.primary,   bg: 'rgba(77,162,255,0.12)' },
  CANCELLED: { color: V.textMuted, bg: 'rgba(255,255,255,0.06)' },
  OVERDUE:   { color: V.danger,    bg: 'rgba(255,90,111,0.12)' },
  RESERVED:  { color: V.warning,   bg: 'rgba(255,181,71,0.12)' },
};

const PAYMENT_STATUS_CFG: Record<string, string> = {
  COMPLETED: V.success, PENDING: V.warning, FAILED: V.danger, REFUNDED: V.textMuted,
};

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
      <p style={{ color: color ?? V.text, fontSize: '18px', fontWeight: 800 }}>{value}</p>
      <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>{label}</p>
    </div>
  );
}

export default function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const qc = useQueryClient();

  const rentalQuery = useQuery({
    queryKey: ['rental', resolvedParams.id],
    queryFn: () => apiClient<any>(`/rentals/${resolvedParams.id}`),
  });

  const returnMutation = useMutation({
    mutationFn: () => apiClient(`/rentals/${resolvedParams.id}/return`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rental', resolvedParams.id] }),
  });

  const stripeMutation = useMutation({
    mutationFn: async () => {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const result = await apiClient<{ url: string | null }>('/stripe/checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          rentalId: resolvedParams.id,
          customerId: rentalQuery.data?.customer?.id ?? '',
          amountCents: rentalQuery.data?.balanceDueCents ?? 0,
          invoiceId: rentalQuery.data?.invoice?.id,
          description: `Rental: ${rentalQuery.data?.car?.make} ${rentalQuery.data?.car?.model}`,
          customerEmail: rentalQuery.data?.customer?.email,
          successUrl: `${origin}/dashboard/rentals/${resolvedParams.id}?paid=1`,
          cancelUrl: `${origin}/dashboard/rentals/${resolvedParams.id}`,
        }),
      });
      if (result.url) window.location.href = result.url;
    },
  });

  if (rentalQuery.isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '12px' }}>
      <Loader2 style={{ width: '22px', height: '22px', color: V.primary, animation: 'spin 1s linear infinite' }} />
      <span style={{ color: V.textMuted, fontSize: '14px' }}>Loading rental...</span>
    </div>
  );

  if (rentalQuery.isError || !rentalQuery.data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '12px' }}>
      <AlertTriangle style={{ width: '22px', height: '22px', color: V.danger }} />
      <span style={{ color: V.danger, fontSize: '14px' }}>Unable to load rental.</span>
    </div>
  );

  const r = rentalQuery.data;
  const sc = STATUS_CFG[r.status] ?? { color: V.textSec, bg: 'rgba(255,255,255,0.06)' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <Link href="/dashboard/rentals/active">
          <button style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: V.textSec }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
          </button>
        </Link>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #4DA2FF 0%, #006BCF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Car style={{ width: '20px', height: '20px', color: '#fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: V.text, fontSize: '18px', fontWeight: 800 }}>
            {r.car?.make} {r.car?.model}
            <span style={{ color: V.textMuted, fontWeight: 500, fontSize: '14px', marginLeft: '10px' }}>{r.car?.registrationNumber}</span>
          </h1>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: sc.bg, color: sc.color }}>{r.status}</span>
            <span style={{ color: V.textMuted, fontSize: '12px' }}>#{resolvedParams.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {r.status === 'ACTIVE' && r.balanceDueCents > 0 && (
            <button
              onClick={() => stripeMutation.mutate()}
              disabled={stripeMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '11px', border: 'none', background: '#635BFF', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: stripeMutation.isPending ? 0.7 : 1 }}
            >
              {stripeMutation.isPending ? <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> : <CreditCard style={{ width: '13px', height: '13px' }} />}
              Pay with Stripe
            </button>
          )}
          {r.status === 'ACTIVE' && (
            <button
              onClick={() => { if (confirm('Mark this rental as returned?')) returnMutation.mutate(); }}
              disabled={returnMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '11px', border: 'none', background: V.success, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: returnMutation.isPending ? 0.7 : 1 }}
            >
              {returnMutation.isPending ? <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> : <RefreshCw style={{ width: '13px', height: '13px' }} />}
              Return Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Stat label="Balance Due" value={formatCurrency(r.balanceDueCents)} color={r.balanceDueCents > 0 ? V.warning : V.success} />
        <Stat label="Pickup" value={formatDateTime(r.pickupAt)} />
        <Stat label="Expected Return" value={formatDateTime(r.expectedReturnAt)} />
        {r.actualReturnAt && <Stat label="Returned" value={formatDateTime(r.actualReturnAt)} color={V.success} />}
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'minmax(0,1fr)', alignItems: 'start' }} className="md:!grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">      
        {/* Left — workflow info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Customer + Car */}
          <div style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px', padding: '20px' }}>
            <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>Rental Details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(77,162,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User style={{ width: '16px', height: '16px', color: V.primary }} />
                </div>
                <div>
                  <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>Customer</p>
                  <Link href={`/dashboard/customers/${r.customer?.id}`}>
                    <p style={{ color: V.primary, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{r.customer?.firstName} {r.customer?.lastName}</p>
                  </Link>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(77,162,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Car style={{ width: '16px', height: '16px', color: V.primary }} />
                </div>
                <div>
                  <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>Vehicle</p>
                  <p style={{ color: V.text, fontSize: '13px', fontWeight: 600 }}>{r.car?.year} {r.car?.make} {r.car?.model} · <span style={{ color: V.textMuted }}>{r.car?.registrationNumber}</span></p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar style={{ width: '13px', height: '13px', color: V.textMuted }} />
                  <div>
                    <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>Pickup</p>
                    <p style={{ color: V.text, fontSize: '12px' }}>{formatDateTime(r.pickupAt)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock style={{ width: '13px', height: '13px', color: V.textMuted }} />
                  <div>
                    <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>Return Due</p>
                    <p style={{ color: V.text, fontSize: '12px' }}>{formatDateTime(r.expectedReturnAt)}</p>
                  </div>
                </div>
              </div>
              {r.notes && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${V.border}` }}>
                  <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Notes</p>
                  <p style={{ color: V.textSec, fontSize: '12px' }}>{r.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — financials */}
        <div style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ReceiptText style={{ width: '14px', height: '14px', color: V.primary }} />
            <p style={{ color: V.text, fontSize: '13px', fontWeight: 700 }}>Financial Ledger</p>
          </div>

          {r.invoice && (
            <div style={{ padding: '14px 18px', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <p style={{ color: V.text, fontSize: '13px', fontWeight: 600 }}>Invoice {r.invoice.invoiceNumber}</p>
                <span style={{ fontSize: '11px', fontWeight: 700, color: r.invoice.status === 'PAID' ? V.success : V.warning }}>{r.invoice.status}</span>
              </div>
              <p style={{ color: V.textMuted, fontSize: '12px' }}>{formatCurrency(r.invoice.totalAmountCents)}</p>
            </div>
          )}

          {(r.payments ?? []).map((p: any) => (
            <div key={p.id} style={{ padding: '14px 18px', borderBottom: `1px solid rgba(255,255,255,0.04)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DollarSign style={{ width: '13px', height: '13px', color: V.success }} />
                <div>
                  <p style={{ color: V.text, fontSize: '13px', fontWeight: 600 }}>{formatCurrency(p.amountCents)}</p>
                  <p style={{ color: V.textMuted, fontSize: '11px' }}>{p.method} · {formatDateTime(p.createdAt)}</p>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: PAYMENT_STATUS_CFG[p.status] ?? V.textSec }}>{p.status}</span>
            </div>
          ))}

          {(r.extensions ?? []).map((ext: any) => (
            <div key={ext.id} style={{ padding: '14px 18px', borderBottom: `1px solid rgba(255,255,255,0.04)`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ChevronRight style={{ width: '13px', height: '13px', color: V.warning, flexShrink: 0 }} />
              <div>
                <p style={{ color: V.text, fontSize: '13px', fontWeight: 600 }}>Extension</p>
                <p style={{ color: V.textMuted, fontSize: '11px' }}>New return {formatDateTime(ext.newReturnAt)} · {formatCurrency(ext.additionalAmountCents)}</p>
              </div>
            </div>
          ))}

          {!r.invoice && (r.payments ?? []).length === 0 && (r.extensions ?? []).length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <ReceiptText style={{ width: '28px', height: '28px', color: V.textMuted, margin: '0 auto 8px' }} />
              <p style={{ color: V.textMuted, fontSize: '12px' }}>No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
