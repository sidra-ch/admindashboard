'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import {
  Building2, Shield, Zap, CreditCard, Save, Upload,
  Globe, Phone, Mail, MapPin, Users, CheckCircle2,
  Lock, Key, Bell, ChevronRight, Plus, X, Trash2, Loader2, AlertTriangle, GitBranch,
} from 'lucide-react';

type TabKey = 'company' | 'branches' | 'security' | 'integrations' | 'billing';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'company',      label: 'Company Profile', icon: Building2 },
  { key: 'branches',     label: 'Branches',        icon: GitBranch },
  { key: 'security',    label: 'Security',        icon: Shield },
  { key: 'integrations', label: 'Integrations',    icon: Zap },
  { key: 'billing',     label: 'Billing & Plan',  icon: CreditCard },
];

type BranchItem = {
  id: string; name: string; code: string;
  address: string | null; city: string | null; state: string | null;
  _count: { users: number; cars: number };
};

const INTEGRATIONS = [
  {
    name: 'Google Maps Platform',
    description: 'Live vehicle tracking & geofencing',
    icon: Globe,
    color: '#4DA2FF',
    bg: 'oklch(0.688 0.196 256 / 0.10)',
    connected: true,
  },
  {
    name: 'Stripe Payments',
    description: 'Secure payment processing',
    icon: CreditCard,
    color: '#A78BFA',
    bg: 'oklch(0.65 0.22 280 / 0.10)',
    connected: true,
  },
  {
    name: 'Sentry Error Tracking',
    description: 'Performance monitoring & alerting',
    icon: Bell,
    color: '#F97316',
    bg: 'oklch(0.70 0.18 27 / 0.10)',
    connected: true,
  },
  {
    name: 'SendGrid Email',
    description: 'Transactional email delivery',
    icon: Mail,
    color: '#00C27A',
    bg: 'oklch(0.72 0.152 145 / 0.10)',
    connected: false,
  },
  {
    name: 'Twilio SMS',
    description: 'Customer SMS notifications',
    icon: Phone,
    color: '#FFB547',
    bg: 'oklch(0.78 0.14 72 / 0.10)',
    connected: false,
  },
];

const PLAN_FEATURES = [
  'Unlimited vehicles',
  'Unlimited staff accounts',
  'AI-powered analytics',
  'Geofencing & live tracking',
  'Custom branding & white-label',
  'Priority 24/7 support',
  'Advanced audit logging',
  'Custom webhooks & API',
];

const V = {
  border: 'rgba(255,255,255,0.08)', primary: '#4DA2FF',
  success: '#00C27A', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
  surface: '#121A2F', card: '#18233D',
};

function AddBranchModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', code: '', address: '', city: '', state: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => apiClient('/tenants/me/branches', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant-me'] }); onClose(); },
    onError: (e: Error) => setError(e.message || 'Failed to create branch'),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const inp: React.CSSProperties = {
    background: '#0E1728', border: `1px solid ${V.border}`, color: V.text,
    borderRadius: '10px', padding: '9px 13px', fontSize: '13px', width: '100%', outline: 'none',
  };
  const lbl: React.CSSProperties = {
    fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.10em', color: V.textMuted, display: 'block', marginBottom: '5px',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 32px 80px rgba(0,0,0,0.55)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div>
            <h3 style={{ color: V.text, fontSize: '16px', fontWeight: 700 }}>Add Branch</h3>
            <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '2px' }}>Create a new operational location</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: V.textMuted }}><X style={{ width: '18px', height: '18px' }} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ gridColumn: 'span 1' }}><label style={lbl}>Branch Name</label><input style={inp} value={form.name} onChange={set('name')} placeholder="Sydney CBD" /></div>
          <div><label style={lbl}>Branch Code</label><input style={inp} value={form.code} onChange={set('code')} placeholder="SYD" /></div>
        </div>
        <div style={{ marginTop: '14px' }}><label style={lbl}>Address (optional)</label><input style={inp} value={form.address} onChange={set('address')} placeholder="Level 1, 123 George St" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
          <div><label style={lbl}>City</label><input style={inp} value={form.city} onChange={set('city')} placeholder="Sydney" /></div>
          <div><label style={lbl}>State</label><input style={inp} value={form.state} onChange={set('state')} placeholder="NSW" /></div>
        </div>

        {error && (
          <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,90,111,0.10)', border: '1px solid rgba(255,90,111,0.22)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertTriangle style={{ width: '14px', height: '14px', color: V.danger, flexShrink: 0 }} />
            <span style={{ color: V.danger, fontSize: '12px' }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '11px', border: `1px solid ${V.border}`, background: 'transparent', color: V.textSec, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || !form.code}
            style={{ flex: 1, padding: '10px', borderRadius: '11px', border: 'none', background: V.primary, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: mutation.isPending ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: mutation.isPending ? 0.7 : 1 }}
          >
            {mutation.isPending && <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />}
            {mutation.isPending ? 'Creating...' : 'Create Branch'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanySettingsPage() {
  const [tab, setTab] = useState<TabKey>('company');
  const [saved, setSaved] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const qc = useQueryClient();

  const tenantQuery = useQuery({
    queryKey: ['tenant-me'],
    queryFn: () => apiClient<{ name: string; branches: BranchItem[] }>('/tenants/me'),
    enabled: tab === 'branches',
  });

  const deleteBranchMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/tenants/me/branches/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-me'] }),
  });

  const branches = tenantQuery.data?.branches ?? [];

  const cardStyle: React.CSSProperties = {
    background: '#18233D',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(16px)',
  };

  const inputStyle: React.CSSProperties = {
    background: '#0E1728',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--foreground)',
    borderRadius: '0.75rem',
    padding: '0.5rem 0.875rem',
    fontSize: '0.78rem',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.10em',
    color: '#6E7A99',
    display: 'block',
    marginBottom: '0.375rem',
  };

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex size-9 items-center justify-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #C084FC 0%, #8B5CF6 100%)',
            boxShadow: '0 4px 12px oklch(0.55 0.22 310 / 0.25)',
          }}
        >
          <Building2 className="size-4.5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Enterprise Settings
          </h2>
          <p className="text-[0.65rem]" style={{ color: '#6E7A99' }}>
            Organisation profile, security &amp; platform integrations
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.70rem] font-bold whitespace-nowrap transition-all duration-150"
              style={{
                background: active ? '#4DA2FF' : '#18233D',
                border: active ? '1px solid #4DA2FF' : '1px solid rgba(255,255,255,0.08)',
                color: active ? '#fff' : '#A8B3CF',
                backdropFilter: 'blur(16px)',
              }}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Company Profile tab */}
      {tab === 'company' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Logo & branding */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.12em]" style={{ color: '#6E7A99' }}>
              Company Logo
            </p>
            <div
              className="mb-4 flex flex-col items-center justify-center gap-2 rounded-xl py-8"
              style={{ background: '#0E1728', border: '2px dashed rgba(255,255,255,0.08)' }}
            >
              <div
                className="flex size-12 items-center justify-center rounded-xl text-lg font-black"
                style={{ background: 'linear-gradient(135deg, #4DA2FF, #A78BFA)', color: '#fff' }}
              >
                V
              </div>
              <p className="text-[0.65rem]" style={{ color: '#6E7A99' }}>Velocity Fleet OS</p>
            </div>
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[0.72rem] font-bold transition-all duration-150 hover:scale-[1.01]"
              style={{
                background: 'oklch(0.688 0.196 256 / 0.12)',
                border: '1px solid oklch(0.688 0.196 256 / 0.30)',
                color: '#A8D8FF',
              }}
            >
              <Upload className="size-3.5" />
              Upload Logo
            </button>
          </div>

          {/* Company details */}
          <div className="col-span-2 rounded-2xl p-5" style={cardStyle}>
            <p className="mb-5 text-[0.65rem] font-bold uppercase tracking-[0.12em]" style={{ color: '#6E7A99' }}>
              Organisation Details
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: 'Company Name', placeholder: 'Velocity Fleet OS', icon: Building2 },
                { label: 'ABN / ACN', placeholder: '12 345 678 901', icon: Key },
                { label: 'Primary Email', placeholder: 'admin@velocityfleet.com.au', icon: Mail },
                { label: 'Phone', placeholder: '+61 2 9000 0000', icon: Phone },
                { label: 'Website', placeholder: 'https://velocityfleet.com.au', icon: Globe },
                { label: 'Staff Count', placeholder: '25', icon: Users },
              ].map(({ label, placeholder, icon: Icon }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" style={{ color: '#6E7A99' }} />
                    <input
                      type="text"
                      placeholder={placeholder}
                      style={{ ...inputStyle, paddingLeft: '2rem' }}
                    />
                  </div>
                </div>
              ))}
              <div className="sm:col-span-2">
                <label style={labelStyle}>Address</label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-3 size-3.5" style={{ color: '#6E7A99' }} />
                  <textarea
                    rows={2}
                    placeholder="Level 22, 1 Market St, Sydney NSW 2000"
                    style={{ ...inputStyle, paddingLeft: '2rem', resize: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[0.72rem] font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: saved ? '#00C27A' : '#4DA2FF',
                  color: '#fff',
                  boxShadow: `0 4px 12px ${saved ? 'oklch(0.72 0.152 145 / 0.30)' : 'oklch(0.688 0.196 256 / 0.30)'}`,
                }}
              >
                {saved ? <CheckCircle2 className="size-3.5" /> : <Save className="size-3.5" />}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security tab */}
      {tab === 'security' && (
        <div className="space-y-4">
          {[
            {
              icon: Lock,
              title: 'Two-Factor Authentication',
              desc: 'Require 2FA for all admin accounts to protect sensitive data.',
              color: '#00C27A',
              enabled: true,
            },
            {
              icon: Key,
              title: 'API Key Management',
              desc: 'Generate and revoke API keys for third-party integrations.',
              color: '#4DA2FF',
              enabled: true,
            },
            {
              icon: Shield,
              title: 'IP Allowlist',
              desc: 'Restrict access to trusted IP address ranges only.',
              color: '#FFB547',
              enabled: false,
            },
            {
              icon: Bell,
              title: 'Login Alerts',
              desc: 'Get notified of new logins via email and SMS.',
              color: '#A78BFA',
              enabled: true,
            },
          ].map(({ icon: Icon, title, desc, color, enabled }) => (
            <div key={title} className="flex items-center gap-4 rounded-2xl px-5 py-4" style={cardStyle}>
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${color}18` }}
              >
                <Icon className="size-4" style={{ color }} />
              </div>
              <div className="flex-1">
                <p className="text-[0.75rem] font-bold" style={{ color: 'var(--foreground)' }}>{title}</p>
                <p className="text-[0.63rem]" style={{ color: '#6E7A99' }}>{desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.08em]"
                  style={{
                    background: enabled ? 'oklch(0.72 0.152 145 / 0.12)' : 'rgba(255,255,255,0.08)',
                    color: enabled ? '#00C27A' : '#6E7A99',
                  }}
                >
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  className="flex size-7 items-center justify-center rounded-lg transition-all hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#A8B3CF' }}
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Integrations tab */}
      {tab === 'integrations' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {INTEGRATIONS.map(({ name, description, icon: Icon, color, bg, connected }) => (
            <div key={name} className="rounded-2xl p-5" style={cardStyle}>
              <div className="mb-4 flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: bg }}>
                  <Icon className="size-5" style={{ color }} />
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.08em]"
                  style={{
                    background: connected ? 'oklch(0.72 0.152 145 / 0.12)' : 'rgba(255,255,255,0.08)',
                    color: connected ? '#00C27A' : '#6E7A99',
                    border: `1px solid ${connected ? 'oklch(0.72 0.152 145 / 0.25)' : 'transparent'}`,
                  }}
                >
                  {connected ? 'Connected' : 'Not set up'}
                </span>
              </div>
              <p className="mb-1 text-[0.75rem] font-bold" style={{ color: 'var(--foreground)' }}>{name}</p>
              <p className="mb-4 text-[0.62rem]" style={{ color: '#6E7A99' }}>{description}</p>
              <button
                className="w-full rounded-xl py-2 text-[0.68rem] font-bold transition-all duration-150 hover:scale-[1.01]"
                style={{
                  background: connected ? 'rgba(255,255,255,0.08)' : `${color}18`,
                  border: `1px solid ${connected ? 'rgba(255,255,255,0.08)' : `${color}30`}`,
                  color: connected ? '#A8B3CF' : color,
                }}
              >
                {connected ? 'Manage' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Branches tab */}
      {tab === 'branches' && (
        <div className="space-y-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ color: '#6E7A99', fontSize: '12px' }}>{branches.length} branch{branches.length !== 1 ? 'es' : ''} configured</p>
            <button
              onClick={() => setShowAddBranch(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '11px', border: 'none', background: '#4DA2FF', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(77,162,255,0.28)' }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              Add Branch
            </button>
          </div>

          {tenantQuery.isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
              <Loader2 style={{ width: '20px', height: '20px', color: '#4DA2FF', animation: 'spin 1s linear infinite' }} />
              <span style={{ color: '#6E7A99', fontSize: '13px' }}>Loading branches...</span>
            </div>
          )}

          {!tenantQuery.isLoading && branches.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#18233D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
              <GitBranch style={{ width: '32px', height: '32px', color: '#6E7A99', margin: '0 auto 10px' }} />
              <p style={{ color: '#F5F7FA', fontWeight: 600, fontSize: '14px' }}>No branches yet</p>
              <p style={{ color: '#6E7A99', fontSize: '12px', marginTop: '4px' }}>Add your first branch to organise your fleet operations</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {branches.map(branch => (
              <div key={branch.id} style={{ ...cardStyle, padding: '18px', borderRadius: '16px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(77,162,255,0.12)', border: '1px solid rgba(77,162,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GitBranch style={{ width: '16px', height: '16px', color: '#4DA2FF' }} />
                    </div>
                    <div>
                      <p style={{ color: '#F5F7FA', fontSize: '14px', fontWeight: 700 }}>{branch.name}</p>
                      <span style={{ padding: '1px 8px', borderRadius: '5px', background: 'rgba(77,162,255,0.10)', border: '1px solid rgba(77,162,255,0.18)', fontSize: '10px', fontWeight: 700, color: '#4DA2FF', fontFamily: 'monospace' }}>{branch.code}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete branch "${branch.name}"? This cannot be undone.`)) {
                        deleteBranchMutation.mutate(branch.id);
                      }
                    }}
                    disabled={deleteBranchMutation.isPending}
                    style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,90,111,0.08)', border: '1px solid rgba(255,90,111,0.16)', color: '#FF5A6F', cursor: 'pointer', transition: 'all 0.12s' }}
                  >
                    <Trash2 style={{ width: '13px', height: '13px' }} />
                  </button>
                </div>

                {(branch.city || branch.state || branch.address) && (
                  <p style={{ color: '#6E7A99', fontSize: '12px', marginBottom: '12px' }}>
                    {[branch.address, branch.city, branch.state].filter(Boolean).join(', ')}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
                    <p style={{ color: '#F5F7FA', fontSize: '16px', fontWeight: 700 }}>{branch._count.users}</p>
                    <p style={{ color: '#6E7A99', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Staff</p>
                  </div>
                  <div style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
                    <p style={{ color: '#F5F7FA', fontSize: '16px', fontWeight: 700 }}>{branch._count.cars}</p>
                    <p style={{ color: '#6E7A99', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vehicles</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showAddBranch && <AddBranchModal onClose={() => setShowAddBranch(false)} />}
        </div>
      )}

      {/* Billing tab */}
      {tab === 'billing' && (
        <div className="space-y-6">
          {/* Plan card */}
          <div
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, #16233E 0%, #101828 100%)',
              border: '1px solid oklch(0.688 0.196 256 / 0.35)',
            }}
          >
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #4DA2FF, transparent 60%)' }} />
            <div className="relative flex items-start justify-between">
              <div>
                <div
                  className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em]"
                  style={{ background: 'oklch(0.688 0.196 256 / 0.15)', color: '#A8D8FF', border: '1px solid oklch(0.688 0.196 256 / 0.30)' }}
                >
                  <Zap className="size-2.5" />
                  Enterprise Plan
                </div>
                <h3 className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>$899<span className="text-sm font-medium" style={{ color: '#6E7A99' }}>/mo</span></h3>
                <p className="mt-1 text-[0.65rem]" style={{ color: '#6E7A99' }}>Billed annually Â· Next renewal 1 Jan 2026</p>
              </div>
              <button
                className="rounded-xl px-4 py-2 text-[0.68rem] font-bold transition-all hover:scale-[1.02]"
                style={{ background: '#4DA2FF', color: '#fff', boxShadow: '0 4px 12px oklch(0.688 0.196 256 / 0.30)' }}
              >
                Manage Plan
              </button>
            </div>
            <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLAN_FEATURES.map(feature => (
                <div key={feature} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 shrink-0" style={{ color: '#00C27A' }} />
                  <span className="text-[0.60rem]" style={{ color: '#A8B3CF' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Billing history */}
          <div className="rounded-2xl" style={cardStyle}>
            <div className="border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em]" style={{ color: '#6E7A99' }}>
                Recent Invoices
              </p>
            </div>
            {[
              { date: 'Jun 2025', amount: '$899.00', status: 'Paid' },
              { date: 'May 2025', amount: '$899.00', status: 'Paid' },
              { date: 'Apr 2025', amount: '$899.00', status: 'Paid' },
            ].map(({ date, amount, status }) => (
              <div
                key={date}
                className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div>
                  <p className="text-[0.73rem] font-bold" style={{ color: 'var(--foreground)' }}>{date} â€” Enterprise Plan</p>
                  <p className="text-[0.62rem]" style={{ color: 'oklch(0.45 0.008 265)' }}>Annual billing</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.73rem] font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{amount}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[0.58rem] font-bold"
                    style={{ background: 'oklch(0.72 0.152 145 / 0.12)', color: '#00C27A' }}
                  >
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

