'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Check,
  ChevronDown,
  DollarSign,
  Fuel,
  Gauge,
  Hash,
  Image as ImageIcon,
  Layers,
  MapPin,
  Settings2,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { apiClient } from '../../../../../lib/api-client';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Branch = { id: string; name: string };
type CarCategory = { id: string; name: string };
type PreviewImage = { id: string; url: string; file: File };

// ─── Zod Schemas ───────────────────────────────────────────────────────────────
// Empty string from HTML inputs must become undefined for optional fields
const optNum = (min = 0) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().min(min).optional(),
  );
const optEnum = <T extends [string, ...string[]]>(vals: T) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.enum(vals).optional(),
  );

const step1Schema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  categoryId: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  brand: z.string().min(2, 'Min 2 characters'),
  model: z.string().min(1, 'Required'),
  year: z.coerce.number().min(2000).max(2030),
  color: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  registrationNumber: z.string().min(2, 'Required'),
  transmissionType: optEnum(['MANUAL', 'AUTOMATIC']),
  fuelType: optEnum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID']),
  seats: optNum(1),
});
const step2Schema = z.object({
  dailyRateCents: z.coerce.number().min(1, 'Daily rate is required'),
  weeklyRateCents: optNum(0),
  monthlyRateCents: optNum(0),
  depositAmountCents: optNum(0),
  odometerKm: z.coerce.number().min(0),
  status: z.enum(['AVAILABLE', 'MAINTENANCE', 'DISABLED']),
});
const fullSchema = step1Schema.merge(step2Schema);
type FormValues = z.infer<typeof fullSchema>;
const DRAFT_KEY = 'fleet-car-wizard-draft';

// ─── Style Constants ────────────────────────────────────────────────────────────
const BG = 'oklch(0.082 0.018 265)';
const CARD: React.CSSProperties = { background: 'oklch(0.132 0.020 265 / 0.80)', border: '1px solid oklch(0.248 0.020 265)', backdropFilter: 'blur(16px)', borderRadius: '16px' };
const FIELD: React.CSSProperties = { background: 'oklch(0.10 0.018 265)', border: '1px solid oklch(0.248 0.020 265)', borderRadius: '10px', color: 'oklch(0.92 0.010 265)', padding: '0.625rem 0.875rem 0.625rem 2.5rem', width: '100%', fontSize: '0.875rem', outline: 'none' };
const SELECT: React.CSSProperties = { ...FIELD, paddingRight: '2.5rem', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' };
const LABEL: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'oklch(0.50 0.010 265)', marginBottom: '0.35rem', display: 'block' };
const ERR: React.CSSProperties = { color: 'oklch(0.70 0.18 27)', fontSize: '0.72rem', marginTop: '0.25rem' };

// ─── Static Data ───────────────────────────────────────────────────────────────
const TX_LABELS: Record<string, string> = { MANUAL: 'Manual', AUTOMATIC: 'Automatic' };
const FUEL_LABELS: Record<string, string> = { PETROL: 'Petrol', DIESEL: 'Diesel', ELECTRIC: 'Electric', HYBRID: 'Hybrid', PLUGIN_HYBRID: 'Plug-in Hybrid' };
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: 'Available', color: 'oklch(0.72 0.152 145)', bg: 'oklch(0.72 0.152 145 / 0.15)' },
  MAINTENANCE: { label: 'Maintenance', color: 'oklch(0.78 0.14 72)', bg: 'oklch(0.78 0.14 72 / 0.15)' },
  DISABLED: { label: 'Archived', color: 'oklch(0.40 0.008 265)', bg: 'oklch(0.40 0.008 265 / 0.15)' },
};
const COLOR_SWATCHES = [
  { label: 'White', value: 'White', hex: '#f5f5f5' },
  { label: 'Black', value: 'Black', hex: '#1a1a1a' },
  { label: 'Silver', value: 'Silver', hex: '#a8a9ad' },
  { label: 'Grey', value: 'Grey', hex: '#6b7280' },
  { label: 'Blue', value: 'Blue', hex: '#3b82f6' },
  { label: 'Red', value: 'Red', hex: '#ef4444' },
];

// ─── FieldWrap & SelectWrap ─────────────────────────────────────────────────────
function FieldWrap({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'oklch(0.50 0.010 265)', pointerEvents: 'none', zIndex: 1, display: 'flex', alignItems: 'center' }}>{icon}</span>
      {children}
    </div>
  );
}
function SelectWrap({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'oklch(0.50 0.010 265)', pointerEvents: 'none', zIndex: 1, display: 'flex', alignItems: 'center' }}>{icon}</span>
      {children}
      <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'oklch(0.50 0.010 265)', pointerEvents: 'none' }}><ChevronDown size={14} /></span>
    </div>
  );
}

// ─── StepIndicator ─────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = [
    { n: 1, label: 'Basic Info', icon: <Car size={15} /> },
    { n: 2, label: 'Pricing', icon: <DollarSign size={15} /> },
    { n: 3, label: 'Media', icon: <ImageIcon size={15} /> },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem' }}>
      {steps.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <React.Fragment key={s.n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'oklch(0.72 0.152 145)' : active ? 'linear-gradient(135deg, oklch(0.688 0.196 256), oklch(0.60 0.22 270))' : 'oklch(0.132 0.020 265)', border: active || done ? 'none' : '1px solid oklch(0.248 0.020 265)', color: active || done ? 'white' : 'oklch(0.50 0.010 265)', boxShadow: active ? '0 0 20px oklch(0.688 0.196 256 / 0.4)' : 'none', transition: 'all 0.3s ease', flexShrink: 0 }}>
                {done ? <Check size={16} /> : s.icon}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: active ? 700 : 500, color: active ? 'oklch(0.688 0.196 256)' : done ? 'oklch(0.72 0.152 145)' : 'oklch(0.40 0.008 265)', whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, marginBottom: '1.2rem', background: done ? 'oklch(0.72 0.152 145)' : 'oklch(0.248 0.020 265)', transition: 'background 0.3s ease', minWidth: 40 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── VehiclePreviewCard ────────────────────────────────────────────────────────
function VehiclePreviewCard({ values, images, categories }: { values: Partial<FormValues>; images: PreviewImage[]; categories: CarCategory[] }) {
  const statusCfg = STATUS_CFG[values.status ?? 'AVAILABLE'] ?? STATUS_CFG.AVAILABLE;
  const catName = categories.find((c) => c.id === values.categoryId)?.name;
  const colorHex = COLOR_SWATCHES.find((s) => s.value === values.color)?.hex;
  const mainImage = images[0];
  return (
    <div style={{ position: 'sticky', top: '1.5rem' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'oklch(0.50 0.010 265)', marginBottom: '0.75rem' }}>LIVE PREVIEW</p>
      <div style={{ ...CARD, padding: 0, overflow: 'hidden', boxShadow: '0 0 40px oklch(0.688 0.196 256 / 0.08)' }}>
        {/* Image / Placeholder */}
        <div style={{ height: 190, position: 'relative', background: mainImage ? 'transparent' : 'linear-gradient(135deg, oklch(0.132 0.020 265), oklch(0.168 0.030 260))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {mainImage ? (
            <img src={mainImage.url} alt="vehicle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: 0.45 }}>
              <Car size={56} style={{ color: 'oklch(0.688 0.196 256)' }} />
              <p style={{ fontSize: '0.72rem', color: 'oklch(0.50 0.010 265)', textAlign: 'center', lineHeight: 1.4, margin: 0 }}>No Vehicle Media<br /><span style={{ fontSize: '0.65rem', color: 'oklch(0.40 0.008 265)' }}>Upload images anytime</span></p>
            </div>
          )}
          {colorHex && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: colorHex }} />}
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.color}` }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.color, display: 'inline-block' }} />
              {statusCfg.label}
            </span>
          </div>
          {catName && <div style={{ position: 'absolute', top: 10, left: 10 }}><span style={{ padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.62rem', fontWeight: 600, color: 'oklch(0.688 0.196 256)', background: 'oklch(0.688 0.196 256 / 0.12)', border: '1px solid oklch(0.688 0.196 256 / 0.3)' }}>{catName}</span></div>}
        </div>
        {/* Info */}
        <div style={{ padding: '1.1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: values.brand || values.model ? 'oklch(0.95 0.010 265)' : 'oklch(0.35 0.008 265)', margin: '0 0 0.2rem 0' }}>
            {values.brand && values.model ? `${values.brand} ${values.model}` : values.brand || values.model || 'Brand & Model'}{values.year ? ` (${values.year})` : ''}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'oklch(0.50 0.010 265)', margin: '0 0 0.85rem 0' }}>{values.registrationNumber || 'REG-0000'}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
            {values.transmissionType && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.68rem', background: 'oklch(0.10 0.018 265)', color: 'oklch(0.60 0.010 265)', border: '1px solid oklch(0.248 0.020 265)' }}><Settings2 size={10} />{TX_LABELS[values.transmissionType]}</span>}
            {values.fuelType && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.68rem', background: 'oklch(0.10 0.018 265)', color: 'oklch(0.60 0.010 265)', border: '1px solid oklch(0.248 0.020 265)' }}><Fuel size={10} />{FUEL_LABELS[values.fuelType]}</span>}
            {values.seats ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.68rem', background: 'oklch(0.10 0.018 265)', color: 'oklch(0.60 0.010 265)', border: '1px solid oklch(0.248 0.020 265)' }}>{values.seats} seats</span> : null}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', borderTop: '1px solid oklch(0.248 0.020 265)', paddingTop: '0.85rem' }}>
            {[
              { label: 'Daily', value: values.dailyRateCents ? `$${(values.dailyRateCents / 100).toFixed(0)}` : '—' },
              { label: 'Weekly', value: values.weeklyRateCents ? `$${(values.weeklyRateCents / 100).toFixed(0)}` : '—' },
              { label: 'Monthly', value: values.monthlyRateCents ? `$${(values.monthlyRateCents / 100).toFixed(0)}` : '—' },
            ].map((p) => (
              <div key={p.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.58rem', color: 'oklch(0.40 0.008 265)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.15rem' }}>{p.label}</p>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'oklch(0.92 0.010 265)', margin: 0 }}>{p.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p style={{ fontSize: '0.68rem', color: 'oklch(0.35 0.008 265)', textAlign: 'center', marginTop: '0.65rem' }}>💾 Draft auto-saved</p>
    </div>
  );
}

// ─── ImageDropzone ─────────────────────────────────────────────────────────────
function ImageDropzone({ images, onAdd, onRemove }: { images: PreviewImage[]; onAdd: (f: File[]) => void; onRemove: (id: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(false); const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/')); if (files.length) onAdd(files); }, [onAdd]);
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(e.target.files ?? []); if (files.length) onAdd(files); e.target.value = ''; }, [onAdd]);
  return (
    <div>
      <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={() => inputRef.current?.click()} style={{ border: `2px dashed ${dragging ? 'oklch(0.688 0.196 256)' : 'oklch(0.248 0.020 265)'}`, borderRadius: '12px', padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', background: dragging ? 'oklch(0.688 0.196 256 / 0.05)' : 'oklch(0.10 0.018 265)', transition: 'all 0.2s ease' }}>
        <div style={{ width: 52, height: 52, borderRadius: '14px', background: 'oklch(0.688 0.196 256 / 0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid oklch(0.688 0.196 256 / 0.25)' }}>
          <Upload size={22} style={{ color: 'oklch(0.688 0.196 256)' }} />
        </div>
        <p style={{ color: 'oklch(0.70 0.010 265)', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.35rem' }}>Drag & drop vehicle photos</p>
        <p style={{ color: 'oklch(0.40 0.008 265)', fontSize: '0.78rem', margin: 0 }}>or click to browse · JPG, PNG, WEBP</p>
        <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFileInput} />
      </div>
      <p style={{ color: 'oklch(0.40 0.008 265)', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem' }}>✦ Optional — upload now or from the vehicle detail page later</p>
      {images.length > 0 && (
        <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.65rem' }}>
          {images.map((img, i) => (
            <div key={img.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: i === 0 ? '2px solid oklch(0.688 0.196 256)' : '1px solid oklch(0.248 0.020 265)', aspectRatio: '4/3' }}>
              <img src={img.url} alt={`upload-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {i === 0 && <span style={{ position: 'absolute', bottom: 5, left: 5, padding: '0.18rem 0.45rem', borderRadius: '5px', fontSize: '0.58rem', fontWeight: 700, background: 'oklch(0.688 0.196 256)', color: 'white' }}>COVER</span>}
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(img.id); }} style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'oklch(0.70 0.18 27)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function NewCarPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<PreviewImage[]>([]);

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(fullSchema) as unknown as Resolver<FormValues>,
    defaultValues: (() => {
      if (typeof window !== 'undefined') {
        try { const d = localStorage.getItem(DRAFT_KEY); if (d) return JSON.parse(d) as FormValues; } catch {}
      }
      return { year: new Date().getFullYear(), odometerKm: 0, dailyRateCents: 15000, status: 'AVAILABLE' };
    })(),
  });

  const values = watch();

  useEffect(() => {
    const id = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(values)); } catch {} }, 600);
    return () => clearTimeout(id);
  }, [values]);

  const tenantQuery = useQuery({ queryKey: ['tenant-branches'], queryFn: () => apiClient<{ branches: Branch[] }>('/tenants/me'), staleTime: 5 * 60_000 });
  const categoriesQuery = useQuery({ queryKey: ['car-categories'], queryFn: () => apiClient<CarCategory[]>('/car-categories'), staleTime: 5 * 60_000 });
  const branches: Branch[] = tenantQuery.data?.branches ?? [];
  const categories: CarCategory[] = Array.isArray(categoriesQuery.data) ? categoriesQuery.data : [];

  const handleAddImages = useCallback((files: File[]) => {
    const newImgs: PreviewImage[] = files.map((f) => ({ id: `${Date.now()}-${Math.random()}`, url: URL.createObjectURL(f), file: f }));
    setImages((prev) => [...prev, ...newImgs].slice(0, 10));
  }, []);
  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => { const img = prev.find((i) => i.id === id); if (img) URL.revokeObjectURL(img.url); return prev.filter((i) => i.id !== id); });
  }, []);

  const STEP1_FIELDS: (keyof FormValues)[] = ['branchId', 'brand', 'model', 'year', 'registrationNumber'];
  const STEP2_FIELDS: (keyof FormValues)[] = ['dailyRateCents', 'odometerKm', 'status'];
  const goNext = async () => { const ok = await trigger(step === 1 ? STEP1_FIELDS : STEP2_FIELDS); if (ok) setStep((s) => s + 1); };

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { branchId: data.branchId, brand: data.brand, model: data.model, year: data.year, registrationNumber: data.registrationNumber, odometerKm: data.odometerKm, dailyRateCents: data.dailyRateCents, status: data.status };
      if (data.categoryId) payload.categoryId = data.categoryId;
      if (data.color) payload.color = data.color;
      if (data.transmissionType) payload.transmissionType = data.transmissionType;
      if (data.fuelType) payload.fuelType = data.fuelType;
      if (data.seats) payload.seats = data.seats;
      if (data.weeklyRateCents) payload.weeklyRateCents = data.weeklyRateCents;
      if (data.monthlyRateCents) payload.monthlyRateCents = data.monthlyRateCents;
      if (data.depositAmountCents) payload.depositAmountCents = data.depositAmountCents;
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      const car = await apiClient<{ id: string }>('/cars', { method: 'POST', body: JSON.stringify(payload) });
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      toast.success('Vehicle added to fleet', { description: `${data.brand} ${data.model} is now live.` });
      router.push(`/dashboard/fleet/cars/${car.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create vehicle');
      setSubmitting(false);
    }
  });

  const sectionTitle = (text: string) => (
    <h3 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'oklch(0.688 0.196 256)', margin: '0 0 1rem 0' }}>{text}</h3>
  );

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button type="button" onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'oklch(0.50 0.010 265)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.25rem', padding: 0 }}>
          <ArrowLeft size={16} /> Back to Fleet
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(135deg, oklch(0.688 0.196 256), oklch(0.60 0.22 270))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Car size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'oklch(0.95 0.010 265)', margin: 0 }}>Add New Vehicle</h1>
            <p style={{ color: 'oklch(0.50 0.010 265)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>Register a vehicle to your fleet in 3 steps</p>
          </div>
        </div>
      </div>

      <StepIndicator current={step} />

      <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: Steps */}
          <div>
            {/* STEP 1 */}
            {step === 1 && (
              <div style={{ ...CARD, padding: '1.75rem' }}>
                {sectionTitle('Vehicle Identity')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={LABEL}>Branch *</label>
                    <SelectWrap icon={<MapPin size={15} />}><select style={SELECT} {...register('branchId')}><option value="">{tenantQuery.isLoading ? 'Loading…' : 'Select branch'}</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></SelectWrap>
                    {errors.branchId && <p style={ERR}>{errors.branchId.message}</p>}
                  </div>
                  <div>
                    <label style={LABEL}>Brand / Make *</label>
                    <FieldWrap icon={<Car size={15} />}><input style={FIELD} placeholder="e.g. Toyota" {...register('brand')} /></FieldWrap>
                    {errors.brand && <p style={ERR}>{errors.brand.message}</p>}
                  </div>
                  <div>
                    <label style={LABEL}>Model *</label>
                    <FieldWrap icon={<Car size={15} />}><input style={FIELD} placeholder="e.g. Camry" {...register('model')} /></FieldWrap>
                    {errors.model && <p style={ERR}>{errors.model.message}</p>}
                  </div>
                  <div>
                    <label style={LABEL}>Year *</label>
                    <FieldWrap icon={<Wrench size={15} />}><input style={FIELD} type="number" {...register('year')} /></FieldWrap>
                    {errors.year && <p style={ERR}>{errors.year.message}</p>}
                  </div>
                  <div>
                    <label style={LABEL}>Registration *</label>
                    <FieldWrap icon={<Hash size={15} />}><input style={FIELD} placeholder="ABC-1234" {...register('registrationNumber')} /></FieldWrap>
                    {errors.registrationNumber && <p style={ERR}>{errors.registrationNumber.message}</p>}
                  </div>
                  <div>
                    <label style={LABEL}>Vehicle Type</label>
                    <SelectWrap icon={<Layers size={15} />}><select style={SELECT} {...register('categoryId')}><option value="">{categoriesQuery.isLoading ? 'Loading…' : 'Select type'}</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></SelectWrap>
                  </div>
                  <div>
                    <label style={LABEL}>Seats</label>
                    <FieldWrap icon={<span style={{ fontSize: '0.75rem' }}>👤</span>}><input style={FIELD} type="number" min={1} max={12} placeholder="5" {...register('seats')} /></FieldWrap>
                  </div>
                  <div>
                    <label style={LABEL}>Transmission</label>
                    <SelectWrap icon={<Settings2 size={15} />}><select style={SELECT} {...register('transmissionType')}><option value="">Select</option><option value="AUTOMATIC">Automatic</option><option value="MANUAL">Manual</option></select></SelectWrap>
                  </div>
                  <div>
                    <label style={LABEL}>Fuel Type</label>
                    <SelectWrap icon={<Fuel size={15} />}><select style={SELECT} {...register('fuelType')}><option value="">Select</option><option value="PETROL">Petrol</option><option value="DIESEL">Diesel</option><option value="ELECTRIC">Electric</option><option value="HYBRID">Hybrid</option><option value="PLUGIN_HYBRID">Plug-in Hybrid</option></select></SelectWrap>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={LABEL}>Colour</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {COLOR_SWATCHES.map((s) => {
                        const selected = values.color === s.value;
                        return (
                          <button key={s.value} type="button" onClick={() => setValue('color', selected ? '' : s.value)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.7rem', borderRadius: '8px', border: selected ? '2px solid oklch(0.688 0.196 256)' : '1px solid oklch(0.248 0.020 265)', background: selected ? 'oklch(0.688 0.196 256 / 0.10)' : 'oklch(0.10 0.018 265)', cursor: 'pointer', fontSize: '0.78rem', color: 'oklch(0.70 0.010 265)' }}>
                            <span style={{ width: 13, height: 13, borderRadius: '50%', background: s.hex, border: '1px solid rgba(255,255,255,0.15)', display: 'inline-block' }} />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ ...CARD, padding: '1.75rem' }}>
                  {sectionTitle('Pricing')}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={LABEL}>Daily Rate (cents) *</label>
                      <FieldWrap icon={<DollarSign size={15} />}><input style={FIELD} type="number" placeholder="15000" {...register('dailyRateCents')} /></FieldWrap>
                      {values.dailyRateCents > 0 && <p style={{ ...ERR, color: 'oklch(0.50 0.010 265)' }}>${(values.dailyRateCents / 100).toFixed(2)}/day</p>}
                      {errors.dailyRateCents && <p style={ERR}>{errors.dailyRateCents.message}</p>}
                    </div>
                    <div>
                      <label style={LABEL}>Weekly Rate (cents)</label>
                      <FieldWrap icon={<DollarSign size={15} />}><input style={FIELD} type="number" placeholder="90000" {...register('weeklyRateCents')} /></FieldWrap>
                      {(values.weeklyRateCents ?? 0) > 0 && <p style={{ ...ERR, color: 'oklch(0.50 0.010 265)' }}>${((values.weeklyRateCents ?? 0) / 100).toFixed(2)}/week</p>}
                    </div>
                    <div>
                      <label style={LABEL}>Monthly Rate (cents)</label>
                      <FieldWrap icon={<DollarSign size={15} />}><input style={FIELD} type="number" placeholder="350000" {...register('monthlyRateCents')} /></FieldWrap>
                      {(values.monthlyRateCents ?? 0) > 0 && <p style={{ ...ERR, color: 'oklch(0.50 0.010 265)' }}>${((values.monthlyRateCents ?? 0) / 100).toFixed(2)}/month</p>}
                    </div>
                    <div>
                      <label style={LABEL}>Security Deposit (cents)</label>
                      <FieldWrap icon={<Shield size={15} />}><input style={FIELD} type="number" placeholder="50000" {...register('depositAmountCents')} /></FieldWrap>
                      {(values.depositAmountCents ?? 0) > 0 && <p style={{ ...ERR, color: 'oklch(0.50 0.010 265)' }}>${((values.depositAmountCents ?? 0) / 100).toFixed(2)} deposit</p>}
                    </div>
                  </div>
                </div>
                <div style={{ ...CARD, padding: '1.75rem' }}>
                  {sectionTitle('Operational Details')}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={LABEL}>Odometer (km)</label>
                      <FieldWrap icon={<Gauge size={15} />}><input style={FIELD} type="number" placeholder="0" {...register('odometerKm')} /></FieldWrap>
                    </div>
                    <div>
                      <label style={LABEL}>Availability Status</label>
                      <SelectWrap icon={<Zap size={15} />}><select style={SELECT} {...register('status')}><option value="AVAILABLE">Available</option><option value="MAINTENANCE">Maintenance</option><option value="DISABLED">Archived</option></select></SelectWrap>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div style={{ ...CARD, padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  {sectionTitle('Vehicle Media')}
                  <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'oklch(0.72 0.152 145 / 0.12)', color: 'oklch(0.72 0.152 145)', border: '1px solid oklch(0.72 0.152 145 / 0.3)', fontWeight: 600 }}>OPTIONAL</span>
                </div>
                <ImageDropzone images={images} onAdd={handleAddImages} onRemove={handleRemoveImage} />
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', gap: '1rem' }}>
              <button type="button" onClick={() => step > 1 ? setStep((s) => s - 1) : router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '10px', border: '1px solid oklch(0.248 0.020 265)', background: 'oklch(0.10 0.018 265)', color: 'oklch(0.70 0.010 265)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                <ArrowLeft size={16} />{step === 1 ? 'Cancel' : 'Back'}
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {step === 3 && (
                  <button type="submit" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '10px', border: '1px solid oklch(0.248 0.020 265)', background: 'transparent', color: 'oklch(0.70 0.010 265)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                    Skip & Save
                  </button>
                )}
                {step < 3 ? (
                  <button type="button" onClick={goNext} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, oklch(0.688 0.196 256), oklch(0.60 0.22 270))', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button type="submit" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderRadius: '10px', border: 'none', background: submitting ? 'oklch(0.40 0.08 256)' : 'linear-gradient(135deg, oklch(0.688 0.196 256), oklch(0.60 0.22 270))', color: 'white', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
                    {submitting ? (<><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Adding…</>) : (<><Check size={16} />Add to Fleet</>)}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <VehiclePreviewCard values={values} images={images} categories={categories} />
        </div>
      </form>
    </div>
  );
}
