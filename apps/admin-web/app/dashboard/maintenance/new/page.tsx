'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Wrench, ArrowLeft, ChevronDown, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const V = {
  card: '#18233D', border: 'rgba(255,255,255,0.08)',
  primary: '#4DA2FF', warning: '#FFB547', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

const MAINTENANCE_TYPES = [
  { value: 'ROUTINE_SERVICE', label: 'Routine Service' },
  { value: 'TYRE_REPLACEMENT', label: 'Tyre Replacement' },
  { value: 'BRAKE_SERVICE', label: 'Brake Service' },
  { value: 'ENGINE_REPAIR', label: 'Engine Repair' },
  { value: 'BODY_REPAIR', label: 'Body Repair' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'OTHER', label: 'Other' },
];

type Car = { id: string; make: string; model: string; registrationNumber: string };

const inp: React.CSSProperties = {
  background: '#0E1728', border: `1px solid ${V.border}`, color: V.text,
  borderRadius: '10px', padding: '9px 13px', fontSize: '13px', width: '100%', outline: 'none',
};
const lbl: React.CSSProperties = {
  fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.10em', color: V.textMuted, display: 'block', marginBottom: '5px',
};

export default function NewMaintenanceJobPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: carsData } = useQuery({
    queryKey: ['cars-list'],
    queryFn: () => apiClient<{ items: Car[] }>('/cars?pageSize=200'),
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const body = {
      carId: fd.get('carId'),
      type: fd.get('type'),
      description: fd.get('description') || undefined,
      odometerKm: fd.get('odometerKm') ? Number(fd.get('odometerKm')) : undefined,
      scheduledAt: fd.get('scheduledAt'),
      costCents: fd.get('costCents') ? Math.round(Number(fd.get('costCents')) * 100) : undefined,
      vendor: fd.get('vendor') || undefined,
      notes: fd.get('notes') || undefined,
    };
    try {
      await apiClient('/maintenance', { method: 'POST', body: JSON.stringify(body) });
      router.push('/dashboard/maintenance');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
      setSaving(false);
    }
  }

  const cars = carsData?.items ?? [];

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }} className="space-y-6">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/dashboard/maintenance">
          <button type="button" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: V.textSec }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
          </button>
        </Link>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #FFB547 0%, #E08000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Wrench style={{ width: '20px', height: '20px', color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ color: V.text, fontSize: '18px', fontWeight: 800 }}>Schedule Maintenance Job</h1>
          <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '2px' }}>Add a new service or repair to the schedule</p>
        </div>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={lbl}>Vehicle *</label>
              <div style={{ position: 'relative' }}>
                <select name="carId" required style={{ ...inp, appearance: 'none', paddingRight: '32px', cursor: 'pointer' }}>
                  <option value="">Select vehicle…</option>
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>{c.make} {c.model} — {c.registrationNumber}</option>
                  ))}
                </select>
                <ChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: V.textMuted, pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Type */}
            <div>
              <label style={lbl}>Job Type *</label>
              <div style={{ position: 'relative' }}>
                <select name="type" required style={{ ...inp, appearance: 'none', paddingRight: '32px', cursor: 'pointer' }}>
                  <option value="">Select type…</option>
                  {MAINTENANCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <ChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: V.textMuted, pointerEvents: 'none' }} />
              </div>
            </div>

            <div>
              <label style={lbl}>Scheduled Date *</label>
              <input name="scheduledAt" type="datetime-local" required style={{ ...inp, colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={lbl}>Odometer (km)</label>
              <input name="odometerKm" type="number" min="0" style={inp} placeholder="e.g. 25000" />
            </div>
            <div>
              <label style={lbl}>Vendor / Workshop</label>
              <input name="vendor" style={inp} placeholder="Bob's Auto Service" />
            </div>
            <div>
              <label style={lbl}>Estimated Cost (AUD)</label>
              <input name="costCents" type="number" min="0" step="0.01" style={inp} placeholder="0.00" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={lbl}>Description</label>
              <input name="description" style={inp} placeholder="Brief description of work required" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={lbl}>Notes</label>
              <input name="notes" style={inp} placeholder="Additional notes..." />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,90,111,0.10)', border: '1px solid rgba(255,90,111,0.22)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertTriangle style={{ width: '14px', height: '14px', color: V.danger, flexShrink: 0 }} />
              <span style={{ color: V.danger, fontSize: '12px' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '22px', justifyContent: 'flex-end' }}>
            <Link href="/dashboard/maintenance">
              <button type="button" style={{ padding: '10px 20px', borderRadius: '11px', border: `1px solid ${V.border}`, background: 'transparent', color: V.textSec, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '10px 24px', borderRadius: '11px', border: 'none', background: V.warning, color: '#000', fontSize: '13px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}
            >
              {saving && <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />}
              {saving ? 'Scheduling...' : 'Schedule Job'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
