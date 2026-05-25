'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { getStoredSession } from '@/lib/auth-storage';
import {
  Bell, Check, CheckCheck, AlertTriangle, DollarSign,
  Car, Wrench, MapPin, Info, Clock,
} from 'lucide-react';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
};

type FilterKey = 'ALL' | 'UNREAD' | 'ALERTS' | 'INFO';

const TYPE_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  RENTAL_OVERDUE: { icon: AlertTriangle, color: 'oklch(0.70 0.18 27)', bg: 'oklch(0.70 0.18 27 / 0.12)', label: 'Overdue' },
  RENTAL_DUE: { icon: Clock, color: 'oklch(0.78 0.14 72)', bg: 'oklch(0.78 0.14 72 / 0.12)', label: 'Due Soon' },
  PAYMENT_RECEIVED: { icon: DollarSign, color: 'oklch(0.72 0.152 145)', bg: 'oklch(0.72 0.152 145 / 0.12)', label: 'Payment' },
  MAINTENANCE_DUE: { icon: Wrench, color: 'oklch(0.688 0.196 256)', bg: 'oklch(0.688 0.196 256 / 0.12)', label: 'Maintenance' },
  GEOFENCE_ALERT: { icon: MapPin, color: 'oklch(0.65 0.22 280)', bg: 'oklch(0.65 0.22 280 / 0.12)', label: 'Geofence' },
  NEW_VEHICLE: { icon: Car, color: 'oklch(0.72 0.152 145)', bg: 'oklch(0.72 0.152 145 / 0.12)', label: 'Fleet' },
};

const DEFAULT_CFG = { icon: Info, color: 'oklch(0.50 0.010 265)', bg: 'oklch(0.20 0.010 265 / 0.40)', label: 'Info' };

const ALERT_TYPES = new Set(['RENTAL_OVERDUE', 'RENTAL_DUE', 'GEOFENCE_ALERT', 'MAINTENANCE_DUE']);

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const session = getStoredSession();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>('ALL');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      apiClient<Notification[]>(`/notifications?tenantId=${session?.user.tenantId}`),
    enabled: !!session?.user.tenantId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/notifications/${id}/read?tenantId=${session?.user.tenantId}`, {
        method: 'PATCH',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiClient(`/notifications/read-all?tenantId=${session?.user.tenantId}`, {
        method: 'PATCH',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const all = notifications ?? [];
  const unreadCount = all.filter(n => !n.isRead).length;
  const alertCount = all.filter(n => ALERT_TYPES.has(n.type)).length;

  const filtered = all.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'ALERTS') return ALERT_TYPES.has(n.type);
    if (filter === 'INFO') return !ALERT_TYPES.has(n.type);
    return true;
  });

  const FILTERS: { key: FilterKey; label: string; count?: number }[] = [
    { key: 'ALL', label: 'All', count: all.length },
    { key: 'UNREAD', label: 'Unread', count: unreadCount },
    { key: 'ALERTS', label: 'Alerts', count: alertCount },
    { key: 'INFO', label: 'Info' },
  ];

  const cardStyle: React.CSSProperties = {
    background: 'oklch(0.132 0.020 265 / 0.80)',
    border: '1px solid oklch(0.248 0.020 265)',
    backdropFilter: 'blur(16px)',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-9 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, oklch(0.688 0.196 256) 0%, oklch(0.60 0.22 280) 100%)',
              boxShadow: '0 4px 12px oklch(0.688 0.196 256 / 0.25)',
            }}
          >
            <Bell className="size-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Notifications
            </h2>
            <p className="text-[0.65rem]" style={{ color: 'oklch(0.50 0.010 265)' }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[0.72rem] font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'oklch(0.688 0.196 256 / 0.12)',
              border: '1px solid oklch(0.688 0.196 256 / 0.30)',
              color: 'oklch(0.80 0.12 256)',
            }}
          >
            <CheckCheck className="size-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: all.length, color: 'oklch(0.688 0.196 256)' },
          { label: 'Unread', value: unreadCount, color: 'oklch(0.78 0.14 72)' },
          { label: 'Alerts', value: alertCount, color: 'oklch(0.70 0.18 27)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl px-4 py-3" style={cardStyle}>
            <p className="text-xl font-bold tabular-nums" style={{ color }}>{value}</p>
            <p className="text-[0.62rem] font-medium" style={{ color: 'oklch(0.50 0.010 265)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label, count }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[0.70rem] font-bold transition-all duration-150"
              style={{
                background: active ? 'oklch(0.688 0.196 256)' : 'oklch(0.132 0.020 265 / 0.80)',
                border: active ? '1px solid oklch(0.688 0.196 256)' : '1px solid oklch(0.248 0.020 265)',
                color: active ? '#fff' : 'oklch(0.55 0.010 265)',
              }}
            >
              {label}
              {count !== undefined && (
                <span
                  className="rounded-full px-1.5 py-0 text-[0.58rem] font-bold tabular-nums"
                  style={{
                    background: active ? 'oklch(1 0 0 / 0.20)' : 'oklch(0.248 0.020 265)',
                    color: active ? '#fff' : 'oklch(0.65 0.010 265)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="size-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'oklch(0.688 0.196 256)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Bell className="size-10" style={{ color: 'oklch(0.30 0.010 265)' }} />
            <p className="text-sm font-medium" style={{ color: 'oklch(0.40 0.008 265)' }}>
              No notifications here
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'oklch(0.200 0.018 265)' }}>
            {filtered.map((n) => {
              const cfg = TYPE_CFG[n.type] ?? DEFAULT_CFG;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-4 px-5 py-4 transition-all duration-150 hover:bg-white/[0.02]"
                  style={n.isRead ? {} : { background: 'oklch(0.688 0.196 256 / 0.04)' }}
                >
                  {/* Icon */}
                  <div
                    className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: cfg.bg }}
                  >
                    <Icon className="size-4" style={{ color: cfg.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="rounded-full px-2 py-0 text-[0.58rem] font-bold uppercase tracking-[0.08em]"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      {!n.isRead && (
                        <span
                          className="size-1.5 rounded-full"
                          style={{ background: 'oklch(0.688 0.196 256)' }}
                        />
                      )}
                    </div>
                    <p className="text-[0.75rem] font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] leading-relaxed" style={{ color: 'oklch(0.50 0.010 265)' }}>
                      {n.message}
                    </p>
                    <p className="mt-1.5 text-[0.60rem]" style={{ color: 'oklch(0.40 0.008 265)' }}>
                      {formatRelative(n.createdAt)}
                    </p>
                  </div>

                  {/* Mark read */}
                  {!n.isRead && (
                    <button
                      onClick={() => markAsReadMutation.mutate(n.id)}
                      disabled={markAsReadMutation.isPending}
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
                      style={{
                        background: 'oklch(0.72 0.152 145 / 0.10)',
                        border: '1px solid oklch(0.72 0.152 145 / 0.25)',
                      }}
                      title="Mark as read"
                    >
                      <Check className="size-3" style={{ color: 'oklch(0.72 0.152 145)' }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
