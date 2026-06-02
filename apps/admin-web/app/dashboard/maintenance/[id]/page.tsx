'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Wrench, ArrowLeft, Calendar, DollarSign, Car, MapPin, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';

const V = {
  card: '#18233D', surface: '#121A2F', border: 'rgba(255,255,255,0.08)',
  primary: '#4DA2FF', success: '#00C27A', warning: '#FFB547', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  SCHEDULED:   { color: V.primary,   bg: 'rgba(77,162,255,0.12)' },
  IN_PROGRESS: { color: V.warning,   bg: 'rgba(255,181,71,0.12)' },
  COMPLETED:   { color: V.success,   bg: 'rgba(0,194,122,0.12)' },
  CANCELLED:   { color: V.textMuted, bg: 'rgba(255,255,255,0.06)' },
};

const TYPE_LABELS: Record<string, string> = {
  ROUTINE_SERVICE: 'Routine Service',
  TYRE_REPLACEMENT: 'Tyre Replacement',
  BRAKE_SERVICE: 'Brake Service',
  ENGINE_REPAIR: 'Engine Repair',
  BODY_REPAIR: 'Body Repair',
  ELECTRICAL: 'Electrical',
  OTHER: 'Other',
};

const STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

type MaintenanceJob = {
  id: string; type: string; status: string;
  description: string | null; odometerKm: number | null;
  scheduledAt: string; completedAt: string | null;
  costCents: number; vendor: string | null; notes: string | null;
  car: { make: string; model: string; year: number; registrationNumber: string } | null;
};

export default function MaintenanceJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => apiClient<MaintenanceJob>(`/maintenance/${id}`),
  });

  async function handleStatusUpdate() {
    if (!newStatus || !job) return;
    setUpdating(true);
    try {
      await apiClient(`/maintenance/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {}),
        }),
      });
      await qc.invalidateQueries({ queryKey: ['maintenance'] });
      router.push('/dashboard/maintenance');
    } catch {
      setUpdating(false);
    }
  }

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '12px' }}>
      <Loader2 style={{ width: '22px', height: '22px', color: V.primary, animation: 'spin 1s linear infinite' }} />
      <span style={{ color: V.textMuted, fontSize: '14px' }}>Loading job...</span>
    </div>
  );
  if (!job) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '12px' }}>
      <AlertTriangle style={{ width: '22px', height: '22px', color: V.danger }} />
      <span style={{ color: V.danger, fontSize: '14px' }}>Job not found.</span>
    </div>
  );

  const sc = STATUS_CFG[job.status] ?? { color: V.textSec, bg: 'rgba(255,255,255,0.06)' };
  const card: React.CSSProperties = { background: V.card, border: `1px solid ${V.border}`, borderRadius: '16px', padding: '18px' };
  const inp: React.CSSProperties = { background: '#0E1728', border: `1px solid ${V.border}`, color: V.text, borderRadius: '10px', padding: '9px 13px', fontSize: '13px', outline: 'none', appearance: 'none' };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }} className="space-y-6">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <Link href="/dashboard/maintenance">
          <button style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: V.textSec }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
          </button>
        </Link>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #FFB547 0%, #E08000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Wrench style={{ width: '20px', height: '20px', color: '#fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: V.text, fontSize: '18px', fontWeight: 800 }}>{TYPE_LABELS[job.type] ?? job.type}</h1>
          <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '2px' }}>Job #{id.slice(0, 8).toUpperCase()}</p>
        </div>
        <span style={{ padding: '4px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: sc.bg, color: sc.color }}>
          {job.status.replace('_', ' ')}
        </span>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Car style={{ width: '14px', height: '14px', color: V.primary }} />
            <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em' }}>Vehicle</p>
          </div>
          <p style={{ color: V.text, fontSize: '14px', fontWeight: 700 }}>{job.car?.make} {job.car?.model} ({job.car?.year})</p>
          <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '2px' }}>{job.car?.registrationNumber}</p>
        </div>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Calendar style={{ width: '14px', height: '14px', color: V.primary }} />
            <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em' }}>Schedule</p>
          </div>
          <p style={{ color: V.text, fontSize: '13px', fontWeight: 600 }}>Scheduled: {new Date(job.scheduledAt).toLocaleDateString('en-AU', { dateStyle: 'medium' })}</p>
          {job.completedAt && <p style={{ color: V.success, fontSize: '12px', marginTop: '2px' }}>Completed: {new Date(job.completedAt).toLocaleDateString('en-AU', { dateStyle: 'medium' })}</p>}
        </div>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <DollarSign style={{ width: '14px', height: '14px', color: V.success }} />
            <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em' }}>Cost</p>
          </div>
          <p style={{ color: V.text, fontSize: '24px', fontWeight: 800 }}>${((job.costCents ?? 0) / 100).toFixed(2)}</p>
          <p style={{ color: V.textMuted, fontSize: '11px' }}>AUD</p>
        </div>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <MapPin style={{ width: '14px', height: '14px', color: V.primary }} />
            <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em' }}>Vendor</p>
          </div>
          <p style={{ color: V.text, fontSize: '14px', fontWeight: 600 }}>{job.vendor ?? '—'}</p>
          {job.odometerKm && <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '2px' }}>Odometer: {job.odometerKm.toLocaleString()} km</p>}
        </div>
      </div>

      {/* Notes / description */}
      {(job.description || job.notes) && (
        <div style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: '16px', padding: '18px' }}>
          <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '12px' }}>Details</p>
          {job.description && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ color: V.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</p>
              <p style={{ color: V.textSec, fontSize: '13px', marginTop: '4px' }}>{job.description}</p>
            </div>
          )}
          {job.notes && (
            <div>
              <p style={{ color: V.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notes</p>
              <p style={{ color: V.textSec, fontSize: '13px', marginTop: '4px' }}>{job.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Update status */}
      {job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && (
        <div style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: '16px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Wrench style={{ width: '14px', height: '14px', color: V.warning }} />
            <p style={{ color: V.text, fontSize: '13px', fontWeight: 700 }}>Update Status</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <select style={{ ...inp, paddingRight: '36px', minWidth: '200px', cursor: 'pointer' }} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="">Select new status…</option>
                {STATUSES.filter(s => s !== job.status).map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <ChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: V.textMuted, pointerEvents: 'none' }} />
            </div>
            <button
              onClick={handleStatusUpdate}
              disabled={!newStatus || updating}
              style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', background: V.warning, color: '#000', fontSize: '13px', fontWeight: 700, cursor: !newStatus || updating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: !newStatus || updating ? 0.6 : 1 }}
            >
              {updating && <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />}
              {updating ? 'Saving…' : 'Update Status'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
