'use client';

import { useState } from 'react';
import {
  Building2, Shield, Zap, CreditCard, Save, Upload,
  Globe, Phone, Mail, MapPin, Users, CheckCircle2,
  Lock, Key, Bell, ChevronRight,
} from 'lucide-react';

type TabKey = 'company' | 'security' | 'integrations' | 'billing';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'company', label: 'Company Profile', icon: Building2 },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'integrations', label: 'Integrations', icon: Zap },
  { key: 'billing', label: 'Billing & Plan', icon: CreditCard },
];

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

export default function CompanySettingsPage() {
  const [tab, setTab] = useState<TabKey>('company');
  const [saved, setSaved] = useState(false);

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

