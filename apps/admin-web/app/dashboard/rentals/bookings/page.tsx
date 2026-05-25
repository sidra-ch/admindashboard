'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { formatDateTime } from '../../../../lib/formatters';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  CalendarRange, Search, Plus, Clock, CheckCircle2,
  XCircle, AlertCircle, User, Car, ArrowRight, Filter,
  Calendar, TrendingUp, BarChart3,
} from 'lucide-react';

type BookingItem = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  rental: { id: string } | null;
  customer: { firstName: string; lastName: string };
  car: { make: string; model: string; registrationNumber: string };
};

type BookingsResponse = { items: BookingItem[] };

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:   { label: 'Pending',   color: 'oklch(0.78 0.14 72)',   bg: 'oklch(0.78 0.14 72 / 0.12)',   icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'oklch(0.688 0.196 256)', bg: 'oklch(0.688 0.196 256 / 0.12)', icon: CheckCircle2 },
  ACTIVE:    { label: 'Active',    color: 'oklch(0.72 0.152 145)', bg: 'oklch(0.72 0.152 145 / 0.12)', icon: TrendingUp },
  CANCELLED: { label: 'Cancelled', color: 'oklch(0.70 0.18 27)',   bg: 'oklch(0.70 0.18 27 / 0.12)',   icon: XCircle },
  COMPLETED: { label: 'Completed', color: 'oklch(0.50 0.010 265)', bg: 'oklch(0.50 0.010 265 / 0.12)', icon: CheckCircle2 },
};

function getCfg(status: string) {
  return STATUS_CFG[status] ?? STATUS_CFG['PENDING'];
}

function daysCount(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

function BookingCard({ booking }: { booking: BookingItem }) {
  const cfg = getCfg(booking.status);
  const Icon = cfg.icon;
  const days = daysCount(booking.startDate, booking.endDate);

  const inner = (
    <div
      className="group relative overflow-hidden rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'oklch(0.132 0.020 265 / 0.80)',
        border: '1px solid oklch(0.248 0.020 265)',
        backdropFilter: 'blur(16px)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.border = `1px solid ${cfg.color}44`;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${cfg.color}10`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.border = '1px solid oklch(0.248 0.020 265)';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      {/* Left accent */}
      <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full" style={{ background: cfg.color }} />

      <div className="flex flex-col gap-3 pl-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Left info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ background: cfg.bg }}
            >
              <Icon className="size-2.5" style={{ color: cfg.color }} />
              <span className="text-[0.60rem] font-bold uppercase tracking-[0.12em]" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
            <span
              className="rounded px-1.5 py-0.5 font-mono text-[0.58rem] font-semibold"
              style={{ background: 'oklch(0.155 0.018 265)', color: 'oklch(0.50 0.010 265)' }}
            >
              #{booking.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <User className="size-3 shrink-0" style={{ color: 'oklch(0.50 0.010 265)' }} />
            <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              {booking.customer.firstName} {booking.customer.lastName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Car className="size-3 shrink-0" style={{ color: 'oklch(0.50 0.010 265)' }} />
            <p className="text-[0.70rem]" style={{ color: 'oklch(0.55 0.010 265)' }}>
              {booking.car.make} {booking.car.model}
              <span
                className="ml-2 rounded px-1 py-0.5 font-mono text-[0.60rem]"
                style={{ background: 'oklch(0.688 0.196 256 / 0.10)', color: 'oklch(0.75 0.10 256)' }}
              >
                {booking.car.registrationNumber}
              </span>
            </p>
          </div>
        </div>

        {/* Right: dates + days */}
        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'oklch(0.155 0.018 265 / 0.60)', border: '1px solid oklch(0.248 0.020 265)' }}
          >
            <Calendar className="size-3" style={{ color: 'oklch(0.50 0.010 265)' }} />
            <div className="text-right">
              <p className="text-[0.60rem]" style={{ color: 'oklch(0.50 0.010 265)' }}>
                {new Date(booking.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </p>
              <div className="flex items-center gap-1">
                <ArrowRight className="size-2.5" style={{ color: 'oklch(0.35 0.008 265)' }} />
                <p className="text-[0.60rem]" style={{ color: 'oklch(0.50 0.010 265)' }}>
                  {new Date(booking.endDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          </div>
          <div
            className="flex flex-col items-center rounded-xl px-3 py-2"
            style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
          >
            <span className="text-lg font-bold tabular-nums leading-none" style={{ color: cfg.color }}>{days}</span>
            <span className="text-[0.55rem] font-bold uppercase tracking-[0.12em]" style={{ color: cfg.color }}>days</span>
          </div>
        </div>
      </div>
    </div>
  );

  return booking.rental ? (
    <Link href={`/dashboard/rentals/${booking.rental.id}`} className="block" style={{ outline: 'none' }}>
      {inner}
    </Link>
  ) : (
    <div>{inner}</div>
  );
}

export default function BookingsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const bookingsQuery = useQuery({
    queryKey: ['rentals-bookings'],
    queryFn: () => apiClient<BookingsResponse>('/rentals/bookings?page=1&pageSize=50'),
  });

  const items = bookingsQuery.data?.items ?? [];
  const filtered = items.filter(b => {
    const matchSearch = !search ||
      `${b.customer.firstName} ${b.customer.lastName} ${b.car.make} ${b.car.model} ${b.car.registrationNumber}`
        .toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    ALL: items.length,
    PENDING: items.filter(b => b.status === 'PENDING').length,
    CONFIRMED: items.filter(b => b.status === 'CONFIRMED').length,
    ACTIVE: items.filter(b => b.status === 'ACTIVE').length,
    COMPLETED: items.filter(b => b.status === 'COMPLETED').length,
  };

  const statCards = [
    { label: 'Total Bookings', value: counts.ALL, color: 'oklch(0.688 0.196 256)', bg: 'oklch(0.688 0.196 256 / 0.10)', icon: CalendarRange },
    { label: 'Pending Review', value: counts.PENDING, color: 'oklch(0.78 0.14 72)', bg: 'oklch(0.78 0.14 72 / 0.10)', icon: Clock },
    { label: 'Confirmed', value: counts.CONFIRMED, color: 'oklch(0.72 0.152 145)', bg: 'oklch(0.72 0.152 145 / 0.10)', icon: CheckCircle2 },
    { label: 'Active Rentals', value: counts.ACTIVE, color: 'oklch(0.65 0.22 280)', bg: 'oklch(0.65 0.22 280 / 0.10)', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-9 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, oklch(0.65 0.22 280) 0%, oklch(0.688 0.196 256) 100%)',
              boxShadow: '0 4px 12px oklch(0.65 0.22 280 / 0.25)',
            }}
          >
            <CalendarRange className="size-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Bookings Queue
            </h2>
            <p className="text-[0.65rem]" style={{ color: 'oklch(0.50 0.010 265)' }}>
              Manage reservations &amp; rental pipeline
            </p>
          </div>
        </div>
        <Button
          asChild
          style={{
            background: 'linear-gradient(135deg, oklch(0.65 0.22 280) 0%, oklch(0.688 0.196 256) 100%)',
            border: 'none',
            boxShadow: '0 4px 16px oklch(0.65 0.22 280 / 0.25)',
          }}
        >
          <Link href="/dashboard/rentals/bookings/new" className="flex items-center gap-2">
            <Plus className="size-4" />
            New Booking
          </Link>
        </Button>
      </div>

      {/* KPI cards */}
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
              <BarChart3 className="size-3.5" style={{ color: 'oklch(0.35 0.008 265)' }} />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{value}</p>
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
            placeholder="Search customer, vehicle, booking ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'oklch(0.155 0.018 265 / 0.60)',
              border: '1px solid oklch(0.248 0.020 265)',
              borderRadius: '0.75rem',
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map(s => {
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
                } : {
                  color: 'oklch(0.50 0.010 265)',
                  border: '1px solid transparent',
                }}
              >
                {cfg && <span className="size-1.5 rounded-full" style={{ background: active ? cfg.color : 'oklch(0.40 0.008 265)' }} />}
                {s === 'ALL' ? `All (${count})` : `${cfg!.label} (${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Booking list */}
      {bookingsQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div
              className="mx-auto mb-4 size-12 animate-spin rounded-full"
              style={{ border: '2px solid oklch(0.248 0.020 265)', borderTop: '2px solid oklch(0.65 0.22 280)' }}
            />
            <p className="text-sm" style={{ color: 'oklch(0.50 0.010 265)' }}>Loading booking pipeline...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-20"
          style={{ background: 'oklch(0.132 0.020 265 / 0.80)', border: '1px solid oklch(0.248 0.020 265)' }}
        >
          <CalendarRange className="mb-3 size-10" style={{ color: 'oklch(0.35 0.008 265)' }} />
          <p className="font-semibold" style={{ color: 'var(--foreground)' }}>No bookings found</p>
          <p className="mt-1 text-sm" style={{ color: 'oklch(0.50 0.010 265)' }}>
            {search ? 'Try adjusting your search' : 'No bookings in the current pipeline'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => <BookingCard key={booking.id} booking={booking} />)}
        </div>
      )}
    </div>
  );
}
