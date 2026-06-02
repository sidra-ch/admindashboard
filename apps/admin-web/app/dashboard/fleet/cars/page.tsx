'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { apiClient } from '../../../../lib/api-client';
import { formatCurrency, formatDate } from '../../../../lib/formatters';
import {
  Car, Plus, Search, Filter, Grid3X3, List, Wrench, Shield,
  MapPin, AlertTriangle, CheckCircle2, Fuel, TrendingUp, BarChart3,
  ChevronRight, Settings, RefreshCw, Download, SlidersHorizontal,
  Gauge, Activity, Calendar, DollarSign, Star,
  FileUp, FileSpreadsheet, X, Upload, CheckCheck, AlertCircle,
} from 'lucide-react';

const V = {
  bg: '#0B1020', surface: '#121A2F', card: '#18233D',
  border: 'rgba(255,255,255,0.08)', primary: '#4DA2FF', secondary: '#00D1FF',
  success: '#00C27A', warning: '#FFB547', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

type CarItem = {
  id: string; registrationNumber: string; brand: string; model: string;
  year?: number; color?: string; seats?: number; fuelType?: string;
  transmissionType?: string; odometerKm?: number; variant?: string;
  category: { id: string; name: string; icon?: string | null } | null;
  dailyRateCents: number; status: string;
  nextServiceDue: string | null; insuranceExpiry: string | null;
  branch: { name: string };
};

type CarsResponse = { items: CarItem[] };

const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  AVAILABLE:   { label: 'Available',   color: '#00C27A', bg: 'rgba(0,194,122,0.10)',  border: 'rgba(0,194,122,0.22)'  },
  RENTED:      { label: 'On Rental',   color: '#4DA2FF', bg: 'rgba(77,162,255,0.10)', border: 'rgba(77,162,255,0.22)' },
  MAINTENANCE: { label: 'Maintenance', color: '#FFB547', bg: 'rgba(255,181,71,0.10)', border: 'rgba(255,181,71,0.22)' },
  BOOKED:      { label: 'Reserved',    color: '#00D1FF', bg: 'rgba(0,209,255,0.10)',  border: 'rgba(0,209,255,0.22)'  },
  DISABLED:    { label: 'Disabled',    color: '#FF5A6F', bg: 'rgba(255,90,111,0.10)', border: 'rgba(255,90,111,0.22)' },
  INACTIVE:    { label: 'Inactive',    color: '#6E7A99', bg: 'rgba(110,122,153,0.10)',border: 'rgba(110,122,153,0.18)'},
};

function getStatus(s: string) { return STATUS[s] ?? STATUS.INACTIVE; }

function HealthScore({ score }: { score: number }) {
  const color = score > 70 ? V.success : score > 40 ? V.warning : V.danger;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '4px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ color, fontSize: '11px', fontWeight: 600, minWidth: '30px', textAlign: 'right' }}>{score}%</span>
    </div>
  );
}

// Compute vehicle health score
function healthScore(car: CarItem): number {
  let score = 100;
  if (!car.insuranceExpiry) { score -= 30; }
  else {
    const days = Math.ceil((new Date(car.insuranceExpiry).getTime() - Date.now()) / 86_400_000);
    if (days < 0) score -= 35; else if (days < 14) score -= 20; else if (days < 30) score -= 8;
  }
  if (car.status === 'MAINTENANCE') score -= 20;
  if (car.odometerKm && car.odometerKm > 100_000) score -= 10;
  return Math.max(0, score);
}

const FUEL_ICONS: Record<string, string> = {
  PETROL: '⛽', DIESEL: '⛽', ELECTRIC: '⚡', HYBRID: '🔋', PLUGIN_HYBRID: '🔌',
};

// ── Excel Import Template Definition ─────────────────────────────────────────
const TEMPLATE_HEADERS = [
  'Brand*', 'Sub Brand / Variant', 'Engine Capacity', 'Color',
  'Transmission (MANUAL/AUTOMATIC)', 'Fuel Type (PETROL/DIESEL/ELECTRIC/HYBRID/PLUGIN_HYBRID)',
  'Car Condition (NEW/EXCELLENT/GOOD/FAIR/POOR)',
  'Number Plate*', 'Chassis Number (VIN)', 'Year*',
  'Odometer (km)', 'Daily Rate (currency)*',
  'Insurance Expiry (YYYY-MM-DD)', 'Tracker (YES/NO)',
  'Purchase Price (currency)', 'Date of Purchase (YYYY-MM-DD)',
];

const TEMPLATE_EXAMPLE = [
  'Toyota', 'Camry', '2.5L', 'White', 'AUTOMATIC', 'PETROL', 'EXCELLENT',
  'ABC-123', '1HGCM82633A123456', '2023', '15000', '25000',
  '2025-12-31', 'YES', '120000', '2023-01-15',
];

type ImportRow = {
  brand: string; variant?: string; engineSize?: string; color?: string;
  transmissionType?: string; fuelType?: string; condition?: string;
  registrationNumber: string; vin?: string; year: number;
  odometerKm: number; dailyRateCents: number;
  insuranceExpiry?: string; trackerInstalled: boolean;
  purchasePrice?: number; purchaseDate?: string;
};

type Branch = { id: string; name: string };

function downloadExcelTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]);
  // Set column widths
  ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 26 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Cars Import');
  XLSX.writeFile(wb, 'fleet_import_template.xlsx');
}

function parseExcelRows(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];
        // Skip header row
        const parsed: ImportRow[] = rows.slice(1).filter(r => r[0] || r[7]).map(r => ({
          brand: String(r[0] ?? '').trim(),
          variant: r[1] ? String(r[1]).trim() : undefined,
          engineSize: r[2] ? String(r[2]).trim() : undefined,
          color: r[3] ? String(r[3]).trim() : undefined,
          transmissionType: r[4] ? String(r[4]).trim().toUpperCase() : undefined,
          fuelType: r[5] ? String(r[5]).trim().toUpperCase() : undefined,
          condition: r[6] ? String(r[6]).trim().toUpperCase() : undefined,
          registrationNumber: String(r[7] ?? '').trim(),
          vin: r[8] ? String(r[8]).trim() : undefined,
          year: parseInt(String(r[9] ?? '0')) || new Date().getFullYear(),
          odometerKm: parseInt(String(r[10] ?? '0')) || 0,
          dailyRateCents: Math.round((parseFloat(String(r[11] ?? '0')) || 0) * 100),
          insuranceExpiry: r[12] ? String(r[12]).trim() : undefined,
          trackerInstalled: String(r[13] ?? '').trim().toUpperCase() === 'YES',
          purchasePrice: r[14] ? Math.round((parseFloat(String(r[14])) || 0) * 100) : undefined,
          purchaseDate: r[15] ? String(r[15]).trim() : undefined,
        }));
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export default function FleetCarsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Excel Import state
  const [importOpen, setImportOpen] = useState(false);
  const [importBranchId, setImportBranchId] = useState('');
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: { row: number; message: string }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cars'],
    queryFn: () => apiClient<CarsResponse>('/cars?limit=100'),
    select: r => r.items,
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient<{ items: Branch[] }>('/branches?limit=100'),
  });
  const branches: Branch[] = branchesData?.items ?? [];

  const bulkImportMutation = useMutation({
    mutationFn: (payload: { cars: (ImportRow & { branchId: string })[] }) =>
      apiClient<{ success: number; failed: number; errors: { row: number; message: string }[] }>(
        '/cars/bulk-import', { method: 'POST', body: JSON.stringify(payload) }
      ),
    onSuccess: (result) => {
      setImportResult(result);
      setImporting(false);
      if (result.success > 0) qc.invalidateQueries({ queryKey: ['cars'] });
    },
    onError: () => setImporting(false),
  });

  const cars = data ?? [];

  const filtered = useMemo(() => {
    return cars.filter(c => {
      const matchSearch = !search || `${c.brand} ${c.model} ${c.registrationNumber}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [cars, search, statusFilter]);

  const stats = useMemo(() => ({
    total: cars.length,
    available: cars.filter(c => c.status === 'AVAILABLE').length,
    rented: cars.filter(c => c.status === 'RENTED').length,
    maintenance: cars.filter(c => c.status === 'MAINTENANCE').length,
  }), [cars]);

  async function handleExcelFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseExcelRows(file);
      setImportRows(rows);
      setImportResult(null);
    } catch {
      alert('Could not read the Excel file. Please use the downloaded template.');
    }
    e.target.value = '';
  }

  async function handleImport() {
    if (!importBranchId) { alert('Please select a branch first.'); return; }
    if (importRows.length === 0) { alert('Please upload an Excel file first.'); return; }
    setImporting(true);
    setImportResult(null);
    bulkImportMutation.mutate({
      cars: importRows.map(r => ({ ...r, branchId: importBranchId })),
    });
  }

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px', ...extra,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ ...card({ padding: '24px' }) }}>
          <div style={{ height: '28px', width: '180px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ ...card({ padding: '20px', height: '200px' }) }} className="shimmer-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{
        ...card({ padding: '22px 26px' }),
        background: 'linear-gradient(135deg, rgba(77,162,255,0.10) 0%, rgba(24,35,61,0.98) 70%)',
        border: '1px solid rgba(77,162,255,0.16)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #4DA2FF, #00D1FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(77,162,255,0.30)' }}>
              <Car style={{ width: '16px', height: '16px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ color: V.text, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Fleet Management</h1>
              <p style={{ color: V.textMuted, fontSize: '12px' }}>{cars.length} vehicles across all branches</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
          <button onClick={() => refetch()} style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw style={{ width: '14px', height: '14px', color: V.textSec }} />
          </button>
          <button
            onClick={downloadExcelTemplate}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '11px', background: 'rgba(0,194,122,0.12)', border: '1px solid rgba(0,194,122,0.22)', color: V.success, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            <Download style={{ width: '14px', height: '14px' }} />
            <span className="hidden sm:inline">Template</span>
          </button>
          <button
            onClick={() => { setImportOpen(true); setImportRows([]); setImportResult(null); setImportBranchId(branches[0]?.id ?? ''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '11px', background: 'rgba(77,162,255,0.12)', border: '1px solid rgba(77,162,255,0.22)', color: V.primary, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            <FileSpreadsheet style={{ width: '14px', height: '14px' }} />
            <span className="hidden sm:inline">Import Excel</span>
          </button>
          <Link href="/dashboard/fleet/cars/new" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '11px', background: V.primary, color: 'white', fontWeight: 600, fontSize: '13px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(77,162,255,0.30)' }}>
            <Plus style={{ width: '14px', height: '14px' }} />
            <span className="hidden sm:inline">Add Vehicle</span>
          </Link>
        </div>
      </motion.div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-[14px]">
        {[
          { label: 'Total Fleet', value: stats.total, icon: Car, color: V.primary, glow: 'rgba(77,162,255,0.12)' },
          { label: 'Available', value: stats.available, icon: CheckCircle2, color: V.success, glow: 'rgba(0,194,122,0.12)' },
          { label: 'On Rental', value: stats.rented, icon: Activity, color: V.secondary, glow: 'rgba(0,209,255,0.12)' },
          { label: 'Maintenance', value: stats.maintenance, icon: Wrench, color: V.warning, glow: 'rgba(255,181,71,0.12)' },
        ].map(({ label, value, icon: Icon, color, glow }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ ...card({ padding: '18px 20px', position: 'relative', overflow: 'hidden' }) }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: glow, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: '17px', height: '17px', color }} />
              </div>
              <div>
                <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ color: V.text, fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: V.textMuted }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by brand, model, plate..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '12px', background: V.card, border: `1px solid ${V.border}`, color: V.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'AVAILABLE', 'RENTED', 'MAINTENANCE', 'DISABLED'].map(s => {
            const active = statusFilter === s;
            const cfg = s !== 'ALL' ? getStatus(s) : null;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? (cfg?.border ?? V.primary + '40') : V.border}`, background: active ? (cfg?.bg ?? 'rgba(77,162,255,0.10)') : 'transparent', color: active ? (cfg?.color ?? V.primary) : V.textMuted, transition: 'all 0.15s' }}>
                {s === 'ALL' ? 'All Vehicles' : getStatus(s).label}
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', background: V.card, border: `1px solid ${V.border}`, borderRadius: '10px', padding: '3px', gap: '2px', flexShrink: 0 }}>
          {(['grid', 'list'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: viewMode === m ? 'rgba(77,162,255,0.15)' : 'transparent', color: viewMode === m ? V.primary : V.textMuted, transition: 'all 0.15s' }}>
              {m === 'grid' ? <Grid3X3 style={{ width: '14px', height: '14px' }} /> : <List style={{ width: '14px', height: '14px' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Vehicle Grid ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ ...card({ padding: '60px', textAlign: 'center' }) }}>
          <Car style={{ width: '48px', height: '48px', color: V.textMuted, margin: '0 auto 16px', opacity: 0.5 }} />
          <p style={{ color: V.text, fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No vehicles found</p>
          <p style={{ color: V.textMuted, fontSize: '13px', marginBottom: '20px' }}>Try adjusting your search or filters</p>
          <Link href="/dashboard/fleet/cars/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '11px', background: V.primary, color: 'white', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <Plus style={{ width: '14px', height: '14px' }} /> Add Your First Vehicle
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filtered.map((car, i) => {
            const st = getStatus(car.status);
            const health = healthScore(car);
            const insExpiry = car.insuranceExpiry
              ? Math.ceil((new Date(car.insuranceExpiry).getTime() - Date.now()) / 86_400_000)
              : null;
            return (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.35 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Link href={`/dashboard/fleet/cars/${car.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{ ...card(), padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' }}>
                    {/* Hover glow */}
                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: `radial-gradient(circle, ${st.color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />

                    {/* Vehicle icon placeholder */}
                    <div style={{ width: '100%', height: '100px', borderRadius: '12px', background: `linear-gradient(135deg, ${st.bg}, rgba(255,255,255,0.03))`, border: `1px solid ${st.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ fontSize: '36px', opacity: 0.8 }}>🚗</div>
                      <div style={{ position: 'absolute', bottom: '8px', right: '8px', padding: '3px 9px', borderRadius: '6px', background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontSize: '10.5px', fontWeight: 700 }}>
                        {st.label}
                      </div>
                      {car.fuelType && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '14px' }}>
                          {FUEL_ICONS[car.fuelType] ?? '⛽'}
                        </div>
                      )}
                    </div>

                    {/* Car info */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                        <p style={{ color: V.text, fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>{car.brand} {car.model}</p>
                        {car.category && (
                          <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(77,162,255,0.10)', border: '1px solid rgba(77,162,255,0.18)', color: V.primary, fontSize: '10px', fontWeight: 600, flexShrink: 0 }}>
                            {car.category.icon} {car.category.name}
                          </span>
                        )}
                      </div>
                      <p style={{ color: V.textMuted, fontSize: '11.5px' }}>
                        {car.registrationNumber} · {car.branch.name}
                        {car.year ? ` · ${car.year}` : ''}
                        {car.seats ? ` · ${car.seats} seats` : ''}
                      </p>
                    </div>

                    {/* Health bar */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Fleet Health</span>
                        <span style={{ color: health > 70 ? V.success : health > 40 ? V.warning : V.danger, fontSize: '11px', fontWeight: 700 }}>{health}%</span>
                      </div>
                      <div style={{ height: '4px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{ height: '100%', width: `${health}%`, background: health > 70 ? V.success : health > 40 ? V.warning : V.danger, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div>
                        <p style={{ color: V.success, fontSize: '15px', fontWeight: 700 }}>{formatCurrency(car.dailyRateCents)}</p>
                        <p style={{ color: V.textMuted, fontSize: '10px' }}>per day</p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {insExpiry !== null && insExpiry < 30 && (
                          <span title="Insurance expiring soon" style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,90,111,0.12)', border: '1px solid rgba(255,90,111,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield style={{ width: '12px', height: '12px', color: V.danger }} />
                          </span>
                        )}
                        {car.odometerKm && car.odometerKm > 80000 && (
                          <span title="High mileage" style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,181,71,0.12)', border: '1px solid rgba(255,181,71,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Gauge style={{ width: '12px', height: '12px', color: V.warning }} />
                          </span>
                        )}
                        <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(77,162,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ChevronRight style={{ width: '13px', height: '13px', color: V.primary }} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div style={{ ...card({ padding: '0', overflow: 'hidden' }) }}>
          <div style={{ overflowX: 'auto' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 100px 120px', gap: '16px', padding: '12px 20px', borderBottom: `1px solid ${V.border}`, minWidth: '700px' }}>
            {['Vehicle', 'Status', 'Branch', 'Daily Rate', 'Health', 'Actions'].map(h => (
              <span key={h} style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>
          {filtered.map((car, i) => {
            const st = getStatus(car.status);
            const health = healthScore(car);
            return (
              <motion.div key={car.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <Link href={`/dashboard/fleet/cars/${car.id}`} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 100px 120px', gap: '16px', padding: '14px 20px', borderBottom: `1px solid ${V.border}`, textDecoration: 'none', transition: 'background 0.15s', alignItems: 'center', minWidth: '700px' }}
                  className="hover:bg-white/[0.02]">
                  <div>
                    <p style={{ color: V.text, fontSize: '13px', fontWeight: 600 }}>{car.brand} {car.model}</p>
                    <p style={{ color: V.textMuted, fontSize: '11px', marginTop: '2px' }}>{car.registrationNumber}{car.year ? ` · ${car.year}` : ''}</p>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '7px', background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontSize: '11px', fontWeight: 600, width: 'fit-content' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                    {st.label}
                  </span>
                  <span style={{ color: V.textSec, fontSize: '12px' }}>{car.branch.name}</span>
                  <span style={{ color: V.success, fontSize: '13px', fontWeight: 600 }}>{formatCurrency(car.dailyRateCents)}</span>
                  <HealthScore score={health} />
                  <ChevronRight style={{ width: '16px', height: '16px', color: V.textMuted }} />
                </Link>
              </motion.div>
            );
          })}
          </div>
        </div>
      )}

      {/* ── Excel Import Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {importOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={e => { if (e.target === e.currentTarget) setImportOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              style={{ background: '#121A2F', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px', padding: '0', width: '100%', maxWidth: '820px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              {/* Modal header */}
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(77,162,255,0.20), rgba(0,209,255,0.20))', border: '1px solid rgba(77,162,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileSpreadsheet style={{ width: '18px', height: '18px', color: V.primary }} />
                  </div>
                  <div>
                    <h2 style={{ color: V.text, fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em' }}>Import Cars from Excel</h2>
                    <p style={{ color: V.textMuted, fontSize: '11.5px', marginTop: '2px' }}>Download the template, fill it in Excel, then upload it here</p>
                  </div>
                </div>
                <button onClick={() => setImportOpen(false)} style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <X style={{ width: '14px', height: '14px', color: V.textSec }} />
                </button>
              </div>

              {/* Modal body */}
              <div style={{ padding: '20px 24px', overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Step 1: Download template */}
                <div style={{ background: 'rgba(0,194,122,0.06)', border: '1px solid rgba(0,194,122,0.16)', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ color: V.text, fontSize: '13px', fontWeight: 600, marginBottom: '3px' }}>Step 1 — Download Excel Template</p>
                      <p style={{ color: V.textMuted, fontSize: '11.5px' }}>Template includes: Brand, Sub Brand, Engine Capacity, Color, Transmission, Condition, Number Plate, Chassis, Insurance, Tracker, Value, Purchase Date</p>
                    </div>
                    <button
                      onClick={downloadExcelTemplate}
                      style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '10px', background: V.success, color: 'white', fontWeight: 600, fontSize: '12.5px', cursor: 'pointer', border: 'none', flexShrink: 0 }}
                    >
                      <Download style={{ width: '13px', height: '13px' }} /> Download Template
                    </button>
                  </div>
                </div>

                {/* Step 2: Select branch */}
                <div>
                  <label style={{ color: V.textMuted, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Step 2 — Select Branch (applies to all imported cars)
                  </label>
                  <select
                    value={importBranchId}
                    onChange={e => setImportBranchId(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '11px', background: '#0F1828', border: '1px solid rgba(255,255,255,0.12)', color: V.text, fontSize: '13px', outline: 'none', appearance: 'none' }}
                  >
                    <option value="">— Select a branch —</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                {/* Step 3: Upload */}
                <div>
                  <label style={{ color: V.textMuted, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Step 3 — Upload Filled Excel File
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: `2px dashed ${importRows.length > 0 ? 'rgba(0,194,122,0.40)' : 'rgba(255,255,255,0.12)'}`, borderRadius: '14px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: importRows.length > 0 ? 'rgba(0,194,122,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}
                  >
                    {importRows.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <CheckCheck style={{ width: '28px', height: '28px', color: V.success }} />
                        <p style={{ color: V.success, fontSize: '14px', fontWeight: 700 }}>{importRows.length} car{importRows.length !== 1 ? 's' : ''} parsed successfully</p>
                        <p style={{ color: V.textMuted, fontSize: '11.5px' }}>Click to replace with a different file</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <FileUp style={{ width: '28px', height: '28px', color: V.textMuted, opacity: 0.6 }} />
                        <p style={{ color: V.text, fontSize: '13px', fontWeight: 600 }}>Click to upload your Excel file</p>
                        <p style={{ color: V.textMuted, fontSize: '11.5px' }}>.xlsx or .xls files supported</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelFile} />
                </div>

                {/* Preview table */}
                {importRows.length > 0 && !importResult && (
                  <div>
                    <p style={{ color: V.textMuted, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Preview (first 5 rows)</p>
                    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {['Brand', 'Variant', 'Engine', 'Color', 'Trans.', 'Condition', 'Plate', 'VIN', 'Year', 'ODO', 'Rate', 'Tracker'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', color: V.textMuted, fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.slice(0, 5).map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '7px 12px', color: V.text }}>{r.brand}</td>
                              <td style={{ padding: '7px 12px', color: V.textSec }}>{r.variant ?? '—'}</td>
                              <td style={{ padding: '7px 12px', color: V.textSec }}>{r.engineSize ?? '—'}</td>
                              <td style={{ padding: '7px 12px', color: V.textSec }}>{r.color ?? '—'}</td>
                              <td style={{ padding: '7px 12px', color: V.textSec }}>{r.transmissionType ?? '—'}</td>
                              <td style={{ padding: '7px 12px', color: V.textSec }}>{r.condition ?? '—'}</td>
                              <td style={{ padding: '7px 12px', color: V.primary, fontWeight: 600 }}>{r.registrationNumber}</td>
                              <td style={{ padding: '7px 12px', color: V.textSec }}>{r.vin ?? '—'}</td>
                              <td style={{ padding: '7px 12px', color: V.textSec }}>{r.year}</td>
                              <td style={{ padding: '7px 12px', color: V.textSec }}>{r.odometerKm}</td>
                              <td style={{ padding: '7px 12px', color: V.success }}>{(r.dailyRateCents / 100).toLocaleString()}</td>
                              <td style={{ padding: '7px 12px', color: r.trackerInstalled ? V.success : V.textMuted }}>{r.trackerInstalled ? 'YES' : 'NO'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importRows.length > 5 && (
                      <p style={{ color: V.textMuted, fontSize: '11px', marginTop: '6px', textAlign: 'center' }}>…and {importRows.length - 5} more rows</p>
                    )}
                  </div>
                )}

                {/* Result */}
                {importResult && (
                  <div style={{ background: importResult.failed === 0 ? 'rgba(0,194,122,0.08)' : 'rgba(255,181,71,0.08)', border: `1px solid ${importResult.failed === 0 ? 'rgba(0,194,122,0.22)' : 'rgba(255,181,71,0.22)'}`, borderRadius: '14px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      {importResult.failed === 0
                        ? <CheckCheck style={{ width: '20px', height: '20px', color: V.success }} />
                        : <AlertCircle style={{ width: '20px', height: '20px', color: V.warning }} />
                      }
                      <p style={{ color: V.text, fontSize: '14px', fontWeight: 700 }}>
                        {importResult.success} car{importResult.success !== 1 ? 's' : ''} imported
                        {importResult.failed > 0 ? `, ${importResult.failed} failed` : ' successfully!'}
                      </p>
                    </div>
                    {importResult.errors.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                        {importResult.errors.map((e, i) => (
                          <p key={i} style={{ color: V.warning, fontSize: '11.5px' }}>Row {e.row}: {e.message}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
                <button onClick={() => setImportOpen(false)} style={{ padding: '9px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: V.textSec, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                  {importResult ? 'Close' : 'Cancel'}
                </button>
                {!importResult && (
                  <button
                    onClick={handleImport}
                    disabled={importing || importRows.length === 0 || !importBranchId}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', borderRadius: '10px', background: importing || importRows.length === 0 || !importBranchId ? 'rgba(77,162,255,0.30)' : V.primary, color: 'white', fontWeight: 600, fontSize: '13px', cursor: importing || importRows.length === 0 || !importBranchId ? 'not-allowed' : 'pointer', border: 'none', boxShadow: '0 4px 16px rgba(77,162,255,0.25)' }}
                  >
                    {importing ? (
                      <><RefreshCw style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> Importing…</>
                    ) : (
                      <><Upload style={{ width: '13px', height: '13px' }} /> Import {importRows.length > 0 ? `${importRows.length} Cars` : 'Cars'}</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
