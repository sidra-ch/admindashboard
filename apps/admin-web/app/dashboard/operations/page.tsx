'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { getStoredSession } from '@/lib/auth-storage';
import {
  LayoutDashboard, Car, FileText, Clock, AlertTriangle,
  CheckCircle2, ArrowRight, Wrench, Users, TrendingUp,
  MapPin, Zap, Activity, CircleDot,
} from 'lucide-react';

type DashboardOverview = {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  maintenanceCars?: number;
  totalCustomers: number;
  activeRentals: number;
  pendingBookings: number;
};

type Rental = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  car: { make: string; model: string; registrationNumber: string };
  customer: { firstName: string; lastName: string };
  rental?: { id: string } | null;
};

const RENTAL_STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  ACTIVE:    { color: 'oklch(0.72 0.152 145)', bg: 'oklch(0.72 0.152 145 / 0.12)', label: 'Active' },
  CONFIRMED: { color: 'oklch(0.688 0.196 256)', bg: 'oklch(0.688 0.196 256 / 0.12)', label: 'Confirmed' },
  PENDING:   { color: 'oklch(0.78 0.14 72)', bg: 'oklch(0.78 0.14 72 / 0.12)', label: 'Pending' },
  COMPLETED: { color: 'oklch(0.50 0.010 265)', bg: 'oklch(0.248 0.020 265)', label: 'Completed' },
  CANCELLED: { color: 'oklch(0.70 0.18 27)', bg: 'oklch(0.70 0.18 27 / 0.12)', label: 'Cancelled' },
};

const ALERTS = [
  { icon: AlertTriangle, color: 'oklch(0.70 0.18 27)', bg: 'oklch(0.70 0.18 27 / 0.10)', title: '2 rentals overdue return', time: '10 min ago', priority: 'HIGH' },
  { icon: Wrench,        color: 'oklch(0.78 0.14 72)', bg: 'oklch(0.78 0.14 72 / 0.10)', title: 'Vehicle QLD-892 service due', time: '1 hr ago', priority: 'MED' },
  { icon: MapPin,        color: 'oklch(0.65 0.22 280)', bg: 'oklch(0.65 0.22 280 / 0.10)', title: 'Geofence breach — TBN-001', time: '2 hr ago', priority: 'MED' },
  { icon: CheckCircle2,  color: 'oklch(0.72 0.152 145)', bg: 'oklch(0.72 0.152 145 / 0.10)', title: 'Payment received — $1,240', time: '3 hr ago', priority: 'INFO' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  return `${days}d left`;
}

export default function OperationsPage() {
  const session = getStoredSession();

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiClient<DashboardOverview>('/dashboard/overview'),
    enabled: !!session?.accessToken,
  });

  const { data: rentals, isLoading: loadingRentals } = useQuery({
    queryKey: ['rentals-operations'],
    queryFn: () => apiClient<{ items: Rental[] }>('/rentals/bookings?page=1&pageSize=8'),
    enabled: !!session?.accessToken,
  });

  const activeRentals = (rentals?.items ?? []).filter(r => r.status === 'ACTIVE' || r.status === 'CONFIRMED');
  const utilizationPct = overview?.totalCars
    ? Math.round(((overview.rentedCars ?? 0) / overview.totalCars) * 100)
    : 0;

  const cardStyle: React.CSSProperties = {
    background: 'oklch(0.132 0.020 265 / 0.80)',
    border: '1px solid oklch(0.248 0.020 265)',
    backdropFilter: 'blur(16px)',
  };

  const isLoading = loadingOverview || loadingRentals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-9 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, oklch(0.688 0.196 256) 0%, oklch(0.55 0.22 310) 100%)',
              boxShadow: '0 4px 12px oklch(0.688 0.196 256 / 0.25)',
            }}
          >
            <LayoutDashboard className="size-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Operations Command Center
            </h2>
            <p className="text-[0.65rem]" style={{ color: 'oklch(0.50 0.010 265)' }}>
              Real-time fleet operations &amp; activity overview
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{
            background: 'oklch(0.72 0.152 145 / 0.10)',
            border: '1px solid oklch(0.72 0.152 145 / 0.25)',
          }}
        >
          <span
            className="size-1.5 rounded-full animate-pulse"
            style={{ background: 'oklch(0.72 0.152 145)' }}
          />
          <span className="text-[0.62rem] font-bold" style={{ color: 'oklch(0.72 0.152 145)' }}>LIVE</span>
        </div>
      </div>

      {/* KPI strip */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div
            className="size-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'oklch(0.688 0.196 256)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Total Fleet', value: String(overview?.totalCars ?? '—'), icon: Car, color: 'oklch(0.688 0.196 256)', bg: 'oklch(0.688 0.196 256 / 0.10)' },
              { label: 'Available', value: String(overview?.availableCars ?? '—'), icon: CheckCircle2, color: 'oklch(0.72 0.152 145)', bg: 'oklch(0.72 0.152 145 / 0.10)' },
              { label: 'On Rent', value: String(overview?.rentedCars ?? '—'), icon: FileText, color: 'oklch(0.78 0.14 72)', bg: 'oklch(0.78 0.14 72 / 0.10)' },
              { label: 'Maintenance', value: String(overview?.maintenanceCars ?? '—'), icon: Wrench, color: 'oklch(0.70 0.18 27)', bg: 'oklch(0.70 0.18 27 / 0.10)' },
              { label: 'Customers', value: String(overview?.totalCustomers ?? '—'), icon: Users, color: 'oklch(0.65 0.22 280)', bg: 'oklch(0.65 0.22 280 / 0.10)' },
              { label: 'Utilisation', value: `${utilizationPct}%`, icon: TrendingUp, color: utilizationPct > 70 ? 'oklch(0.72 0.152 145)' : 'oklch(0.78 0.14 72)', bg: utilizationPct > 70 ? 'oklch(0.72 0.152 145 / 0.10)' : 'oklch(0.78 0.14 72 / 0.10)' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl p-4" style={cardStyle}>
                <div className="mb-3 flex size-8 items-center justify-center rounded-xl" style={{ background: bg }}>
                  <Icon className="size-3.5" style={{ color }} />
                </div>
                <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{value}</p>
                <p className="text-[0.62rem] font-medium" style={{ color: 'oklch(0.50 0.010 265)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Fleet utilisation bar */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="size-3.5" style={{ color: 'oklch(0.688 0.196 256)' }} />
                <span className="text-[0.72rem] font-bold" style={{ color: 'var(--foreground)' }}>Fleet Utilisation</span>
              </div>
              <span className="text-[0.70rem] font-black tabular-nums" style={{ color: utilizationPct > 70 ? 'oklch(0.72 0.152 145)' : 'oklch(0.78 0.14 72)' }}>
                {utilizationPct}%
              </span>
            </div>
            <div className="flex gap-1">
              {overview && Array.from({ length: overview.totalCars }).map((_, i) => {
                let barColor = 'oklch(0.248 0.020 265)';
                if (i < overview.rentedCars) barColor = 'oklch(0.72 0.152 145)';
                else if (i < overview.rentedCars + (overview.maintenanceCars ?? 0)) barColor = 'oklch(0.78 0.14 72)';
                return (
                  <div
                    key={i}
                    className="h-2 flex-1 rounded-full transition-all duration-300"
                    style={{ background: barColor, maxWidth: '3rem' }}
                  />
                );
              })}
            </div>
            <div className="mt-2.5 flex gap-4">
              {[
                { label: 'Rented', color: 'oklch(0.72 0.152 145)' },
                { label: 'Maintenance', color: 'oklch(0.78 0.14 72)' },
                { label: 'Available', color: 'oklch(0.248 0.020 265)' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full" style={{ background: color }} />
                  <span className="text-[0.60rem]" style={{ color: 'oklch(0.50 0.010 265)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Active rentals */}
            <div className="col-span-2 rounded-2xl" style={cardStyle}>
              <div
                className="flex items-center justify-between border-b px-5 py-4"
                style={{ borderColor: 'oklch(0.200 0.018 265)' }}
              >
                <div className="flex items-center gap-2">
                  <CircleDot className="size-3.5" style={{ color: 'oklch(0.72 0.152 145)' }} />
                  <span className="text-[0.72rem] font-bold" style={{ color: 'var(--foreground)' }}>
                    Active &amp; Confirmed Rentals
                  </span>
                </div>
                <a
                  href="/dashboard/rentals/bookings"
                  className="flex items-center gap-1 text-[0.62rem] font-bold transition-opacity hover:opacity-70"
                  style={{ color: 'oklch(0.688 0.196 256)' }}
                >
                  View all <ArrowRight className="size-3" />
                </a>
              </div>

              {activeRentals.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <FileText className="size-8" style={{ color: 'oklch(0.30 0.010 265)' }} />
                  <p className="text-sm" style={{ color: 'oklch(0.40 0.008 265)' }}>No active rentals</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'oklch(0.200 0.018 265)' }}>
                  {activeRentals.map(rental => {
                    const cfg = RENTAL_STATUS_CFG[rental.status] ?? RENTAL_STATUS_CFG.PENDING;
                    const remaining = daysLeft(rental.endDate);
                    const isOverdue = remaining.includes('overdue');
                    return (
                      <div
                        key={rental.id}
                        className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                      >
                        {/* Status bar */}
                        <div
                          className="h-8 w-0.5 rounded-full shrink-0"
                          style={{ background: cfg.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[0.73rem] font-bold truncate" style={{ color: 'var(--foreground)' }}>
                              {rental.customer ? `${rental.customer.firstName} ${rental.customer.lastName}` : 'Unknown Customer'}
                            </span>
                            <span
                              className="shrink-0 rounded-full px-2 py-0 text-[0.58rem] font-bold uppercase tracking-[0.08em]"
                              style={{ background: cfg.bg, color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-[0.63rem] truncate" style={{ color: 'oklch(0.50 0.010 265)' }}>
                            {rental.car ? `${rental.car.make} ${rental.car.model} · ${rental.car.registrationNumber}` : 'Vehicle —'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className="text-[0.63rem] font-bold tabular-nums"
                            style={{ color: isOverdue ? 'oklch(0.70 0.18 27)' : 'oklch(0.55 0.010 265)' }}
                          >
                            {remaining}
                          </p>
                          <p className="text-[0.58rem]" style={{ color: 'oklch(0.40 0.008 265)' }}>
                            {formatDate(rental.startDate)} → {formatDate(rental.endDate)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Alerts feed */}
            <div className="rounded-2xl" style={cardStyle}>
              <div
                className="flex items-center justify-between border-b px-5 py-4"
                style={{ borderColor: 'oklch(0.200 0.018 265)' }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="size-3.5" style={{ color: 'oklch(0.78 0.14 72)' }} />
                  <span className="text-[0.72rem] font-bold" style={{ color: 'var(--foreground)' }}>Alerts &amp; Activity</span>
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: 'oklch(0.200 0.018 265)' }}>
                {ALERTS.map(({ icon: Icon, color, bg, title, time, priority }) => (
                  <div key={title} className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]">
                    <div
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: bg }}
                    >
                      <Icon className="size-3.5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.68rem] font-bold leading-snug" style={{ color: 'var(--foreground)' }}>{title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[0.58rem]" style={{ color: 'oklch(0.40 0.008 265)' }}>{time}</span>
                        <span
                          className="rounded-full px-1.5 py-0 text-[0.55rem] font-bold uppercase tracking-[0.08em]"
                          style={{ background: bg, color }}
                        >
                          {priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.12em]" style={{ color: 'oklch(0.50 0.010 265)' }}>
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'New Booking',    icon: FileText,   color: 'oklch(0.688 0.196 256)', href: '/dashboard/rentals/bookings' },
                { label: 'Add Vehicle',    icon: Car,        color: 'oklch(0.72 0.152 145)', href: '/dashboard/fleet/cars' },
                { label: 'Live Tracking',  icon: MapPin,     color: 'oklch(0.65 0.22 280)', href: '/dashboard/tracking/live-map' },
                { label: 'View Reports',   icon: TrendingUp, color: 'oklch(0.78 0.14 72)', href: '/dashboard/reports' },
              ].map(({ label, icon: Icon, color, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background: `${color}10`,
                    border: `1px solid ${color}25`,
                  }}
                >
                  <Icon className="size-4 shrink-0" style={{ color }} />
                  <span className="text-[0.68rem] font-bold" style={{ color: 'var(--foreground)' }}>{label}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
