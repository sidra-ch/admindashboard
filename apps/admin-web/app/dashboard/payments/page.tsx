'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient, getApiUrl } from '../../../lib/api-client';
import { getStoredSession } from '../../../lib/auth-storage';
import { formatCurrency, formatDateTime } from '../../../lib/formatters';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  CreditCard, Search, Download, DollarSign, TrendingUp,
  Clock, XCircle, CheckCircle2, BarChart3, Banknote,
  Receipt, ArrowUpRight, Mail, Loader2,
} from 'lucide-react';

type PaymentItem = {
  id: string;
  amountCents: number;
  method: string;
  status: string;
  createdAt: string;
  invoiceId: string | null;
  rental: { id: string } | null;
  customer: { firstName: string; lastName: string };
};

type PaymentsResponse = { items: PaymentItem[] };

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  COMPLETED: { label: 'Completed', color: 'oklch(0.72 0.152 145)', bg: 'oklch(0.72 0.152 145 / 0.12)', icon: CheckCircle2 },
  PENDING:   { label: 'Pending',   color: 'oklch(0.78 0.14 72)',   bg: 'oklch(0.78 0.14 72 / 0.12)',   icon: Clock },
  FAILED:    { label: 'Failed',    color: 'oklch(0.70 0.18 27)',   bg: 'oklch(0.70 0.18 27 / 0.12)',   icon: XCircle },
  REFUNDED:  { label: 'Refunded',  color: 'oklch(0.688 0.196 256)', bg: 'oklch(0.688 0.196 256 / 0.12)', icon: ArrowUpRight },
};

const METHOD_ICONS: Record<string, string> = {
  CARD: '💳', CASH: '💵', BANK_TRANSFER: '🏦', STRIPE: '⚡',
};

function getCfg(status: string) {
  return STATUS_CFG[status] ?? STATUS_CFG['PENDING'];
}

function downloadInvoicePdf(invoiceId: string, token: string | undefined) {
  const url = `${getApiUrl()}/payments/invoices/${invoiceId}/pdf`;
  fetch(url, { headers: { Authorization: `Bearer ${token ?? ''}` } })
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a');
      const blobUrl = URL.createObjectURL(blob);
      a.href = blobUrl;
      a.download = `invoice-${invoiceId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    });
}

function PaymentRow({ payment, token, onSendEmail, sendingEmail }: {
  payment: PaymentItem;
  token: string | undefined;
  onSendEmail?: (invoiceId: string) => void;
  sendingEmail?: boolean;
}) {
  const cfg = getCfg(payment.status);
  const Icon = cfg.icon;
  const methodIcon = METHOD_ICONS[payment.method] ?? '💳';

  return (
    <div
      className="flex flex-col gap-3 px-4 py-3.5 transition-all duration-150 sm:flex-row sm:items-center"
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'oklch(0.155 0.018 265 / 0.60)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = '';
      }}
    >
      {/* Method icon */}
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-base"
        style={{ background: 'oklch(0.155 0.018 265)', border: '1px solid oklch(0.248 0.020 265)' }}
      >
        {methodIcon}
      </div>

      {/* Customer + method */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          {payment.customer.firstName} {payment.customer.lastName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[0.62rem]" style={{ color: 'oklch(0.50 0.010 265)' }}>
            {payment.method.replace('_', ' ')}
          </span>
          <span style={{ color: 'oklch(0.30 0.008 265)' }}>·</span>
          <span className="text-[0.62rem]" style={{ color: 'oklch(0.50 0.010 265)' }}>
            {formatDateTime(payment.createdAt)}
          </span>
          <span style={{ color: 'oklch(0.30 0.008 265)' }}>·</span>
          <span
            className="font-mono text-[0.58rem]"
            style={{ color: 'oklch(0.45 0.008 265)' }}
          >
            #{payment.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
          {formatCurrency(payment.amountCents)}
        </p>
      </div>

      {/* Status badge */}
      <div
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
        style={{ background: cfg.bg }}
      >
        <Icon className="size-2.5" style={{ color: cfg.color }} />
        <span className="text-[0.60rem] font-bold uppercase tracking-[0.10em]" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      {/* Download PDF + Send Email */}
      {payment.invoiceId && (
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl"
            title="Download Invoice PDF"
            onClick={() => downloadInvoicePdf(payment.invoiceId!, token)}
            style={{ color: 'oklch(0.50 0.010 265)' }}
          >
            <Download className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl"
            title="Send Invoice Email"
            onClick={() => onSendEmail?.(payment.invoiceId!)}
            disabled={sendingEmail}
            style={{ color: 'oklch(0.50 0.010 265)' }}
          >
            {sendingEmail
              ? <Loader2 className="size-3.5 animate-spin" />
              : <Mail className="size-3.5" />
            }
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const session = getStoredSession();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [sentInvoiceIds, setSentInvoiceIds] = useState<Set<string>>(new Set());

  const sendEmailMutation = useMutation({
    mutationFn: (invoiceId: string) =>
      apiClient<{ sent: boolean; toEmail: string }>(`/payments/invoices/${invoiceId}/send-email`, { method: 'POST' }),
    onMutate: (invoiceId) => setSendingInvoiceId(invoiceId),
    onSuccess: (_, invoiceId) => {
      setSentInvoiceIds(prev => new Set(prev).add(invoiceId));
      setSendingInvoiceId(null);
    },
    onError: () => setSendingInvoiceId(null),
  });

  const paymentsQuery = useQuery({
    queryKey: ['payments'],
    queryFn: () => apiClient<PaymentsResponse>('/payments?page=1&pageSize=50'),
  });

  const items = paymentsQuery.data?.items ?? [];
  const filtered = items.filter(p => {
    const matchSearch = !search ||
      `${p.customer.firstName} ${p.customer.lastName} ${p.method}`
        .toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = items.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amountCents, 0);
  const totalPending = items.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amountCents, 0);

  const counts = {
    ALL: items.length,
    COMPLETED: items.filter(p => p.status === 'COMPLETED').length,
    PENDING: items.filter(p => p.status === 'PENDING').length,
    FAILED: items.filter(p => p.status === 'FAILED').length,
  };

  const statCards = [
    { label: 'Total Revenue',    value: formatCurrency(totalRevenue), color: 'oklch(0.72 0.152 145)', bg: 'oklch(0.72 0.152 145 / 0.10)', icon: DollarSign },
    { label: 'Pending Payments', value: formatCurrency(totalPending), color: 'oklch(0.78 0.14 72)',   bg: 'oklch(0.78 0.14 72 / 0.10)',   icon: Clock },
    { label: 'Transactions',     value: String(counts.ALL),           color: 'oklch(0.688 0.196 256)', bg: 'oklch(0.688 0.196 256 / 0.10)', icon: Receipt },
    { label: 'Failed',           value: String(counts.FAILED),        color: 'oklch(0.70 0.18 27)',   bg: 'oklch(0.70 0.18 27 / 0.10)',   icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex size-9 items-center justify-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, oklch(0.72 0.152 145) 0%, oklch(0.55 0.18 160) 100%)',
            boxShadow: '0 4px 12px oklch(0.72 0.152 145 / 0.25)',
          }}
        >
          <CreditCard className="size-4.5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Payment Ledger
          </h2>
          <p className="text-[0.65rem]" style={{ color: 'oklch(0.50 0.010 265)' }}>
            Financial transactions &amp; invoice management
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(({ label, value, color, bg, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{
              background: 'oklch(0.132 0.020 265 / 0.80)',
              border: '1px solid oklch(0.248 0.020 265)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: bg }}>
                <Icon className="size-4" style={{ color }} />
              </div>
              <TrendingUp className="size-3.5" style={{ color: 'oklch(0.35 0.008 265)' }} />
            </div>
            <p className="mt-3 text-xl font-bold tabular-nums leading-tight" style={{ color: 'var(--foreground)' }}>{value}</p>
            <p className="text-[0.65rem] font-medium" style={{ color: 'oklch(0.50 0.010 265)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div
        className="flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center"
        style={{
          background: 'oklch(0.132 0.020 265 / 0.80)',
          border: '1px solid oklch(0.248 0.020 265)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2" style={{ color: 'oklch(0.50 0.010 265)' }} />
          <Input
            className="pl-9 text-sm"
            placeholder="Search customer, method..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'oklch(0.155 0.018 265 / 0.60)',
              border: '1px solid oklch(0.248 0.020 265)',
              borderRadius: '0.75rem',
            }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'] as const).map(s => {
            const active = statusFilter === s;
            const cfg = s === 'ALL' ? null : getCfg(s);
            const count = s === 'ALL' ? counts.ALL : (counts[s as keyof typeof counts] ?? 0);
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.10em] transition-all duration-150"
                style={active ? {
                  background: cfg ? cfg.bg : 'oklch(0.688 0.196 256 / 0.12)',
                  color: cfg ? cfg.color : 'oklch(0.80 0.10 256)',
                  border: `1px solid ${cfg ? cfg.color + '44' : 'oklch(0.688 0.196 256 / 0.30)'}`,
                } : { color: 'oklch(0.50 0.010 265)', border: '1px solid transparent' }}
              >
                {cfg && <span className="size-1.5 rounded-full" style={{ background: active ? cfg.color : 'oklch(0.40 0.008 265)' }} />}
                {s === 'ALL' ? `All (${count})` : `${cfg!.label} (${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {paymentsQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div
              className="mx-auto mb-4 size-12 animate-spin rounded-full"
              style={{ border: '2px solid oklch(0.248 0.020 265)', borderTop: '2px solid oklch(0.72 0.152 145)' }}
            />
            <p className="text-sm" style={{ color: 'oklch(0.50 0.010 265)' }}>Loading payment ledger...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-20"
          style={{ background: 'oklch(0.132 0.020 265 / 0.80)', border: '1px solid oklch(0.248 0.020 265)' }}
        >
          <Banknote className="mb-3 size-10" style={{ color: 'oklch(0.35 0.008 265)' }} />
          <p className="font-semibold" style={{ color: 'var(--foreground)' }}>No transactions found</p>
          <p className="mt-1 text-sm" style={{ color: 'oklch(0.50 0.010 265)' }}>
            {search ? 'Try adjusting your search' : 'No payment records yet'}
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: 'oklch(0.132 0.020 265 / 0.80)',
            border: '1px solid oklch(0.248 0.020 265)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-2.5"
            style={{ borderBottom: '1px solid oklch(0.200 0.018 265)', background: 'oklch(0.115 0.018 265 / 0.50)' }}
          >
            {['', 'Customer', 'Amount', 'Status', ''].map((h, i) => (
              <span key={i} className="text-[0.58rem] font-bold uppercase tracking-[0.18em]" style={{ color: 'oklch(0.40 0.008 265)' }}>
                {h}
              </span>
            ))}
          </div>
          <div className="divide-y" style={{ borderColor: 'oklch(0.180 0.018 265)' }}>
            {filtered.map(payment => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                token={session?.accessToken}
                onSendEmail={(invoiceId) => sendEmailMutation.mutate(invoiceId)}
                sendingEmail={sendingInvoiceId === payment.invoiceId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

