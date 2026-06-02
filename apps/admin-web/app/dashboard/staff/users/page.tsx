'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { formatDateTime } from '../../../../lib/formatters';
import {
  ShieldCheck, Plus, X, User, Mail, Building2,
  ChevronDown, Loader2, AlertTriangle,
} from 'lucide-react';

const V = {
  bg: '#0B1020', surface: '#121A2F', card: '#18233D',
  border: 'rgba(255,255,255,0.08)', primary: '#4DA2FF',
  success: '#00C27A', warning: '#FFB547', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

type RoleItem = { id: string; code: string; name: string; description: string | null };
type BranchItem = { id: string; name: string; code: string };
type StaffUser = {
  id: string; firstName: string; lastName: string;
  email: string; phone: string | null; createdAt: string;
  role: { code: string; name: string };
  branch: { id: string; name: string; code: string } | null;
};

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  SUPER_ADMIN: { color: '#FF5A6F', bg: 'rgba(255,90,111,0.12)' },
  ADMIN:       { color: '#4DA2FF', bg: 'rgba(77,162,255,0.12)' },
  MANAGER:     { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  STAFF:       { color: '#00C27A', bg: 'rgba(0,194,122,0.12)' },
  ACCOUNTANT:  { color: '#FFB547', bg: 'rgba(255,181,71,0.12)' },
};

function RoleBadge({ code, name }: { code: string; name: string }) {
  const cfg = ROLE_COLORS[code] ?? { color: V.textSec, bg: 'rgba(255,255,255,0.06)' };
  return (
    <span style={{
      padding: '2px 10px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700,
      letterSpacing: '0.06em', background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}28`,
    }}>
      {name}
    </span>
  );
}

function InviteModal({ roles, branches, onClose }: { roles: RoleItem[]; branches: BranchItem[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', roleCode: roles[0]?.code ?? '', branchId: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => apiClient('/users', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff-users'] }); onClose(); },
    onError: (e: Error) => setError(e.message || 'Failed to create staff member'),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: V.surface, border: `1px solid ${V.border}`, borderRadius: '20px',
        padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div>
            <h3 style={{ color: V.text, fontSize: '16px', fontWeight: 700 }}>Invite Staff Member</h3>
            <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '2px' }}>Create a new account for your team</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: V.textMuted }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div><label style={lbl}>First Name</label><input style={inp} value={form.firstName} onChange={set('firstName')} placeholder="John" /></div>
          <div><label style={lbl}>Last Name</label><input style={inp} value={form.lastName} onChange={set('lastName')} placeholder="Smith" /></div>
        </div>

        <div style={{ marginTop: '14px' }}>
          <label style={lbl}>Email Address</label>
          <input style={inp} type="email" value={form.email} onChange={set('email')} placeholder="john@company.com" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
          <div><label style={lbl}>Phone (optional)</label><input style={inp} value={form.phone} onChange={set('phone')} placeholder="+61 400 000 000" /></div>
          <div><label style={lbl}>Temporary Password</label><input style={inp} type="password" value={form.password} onChange={set('password')} placeholder="Min 8 chars" /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
          <div>
            <label style={lbl}>Role</label>
            <div style={{ position: 'relative' }}>
              <select style={{ ...inp, appearance: 'none', paddingRight: '32px', cursor: 'pointer' }} value={form.roleCode} onChange={set('roleCode')}>
                {roles.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
              <ChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: V.textMuted, pointerEvents: 'none' }} />
            </div>
          </div>
          <div>
            <label style={lbl}>Branch (optional)</label>
            <div style={{ position: 'relative' }}>
              <select style={{ ...inp, appearance: 'none', paddingRight: '32px', cursor: 'pointer' }} value={form.branchId} onChange={set('branchId')}>
                <option value="">— No branch —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: V.textMuted, pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,90,111,0.10)', border: '1px solid rgba(255,90,111,0.22)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertTriangle style={{ width: '14px', height: '14px', color: V.danger, flexShrink: 0 }} />
            <span style={{ color: V.danger, fontSize: '12px' }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '11px', border: `1px solid ${V.border}`, background: 'transparent', color: V.textSec, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.firstName || !form.email || !form.password}
            style={{ flex: 1, padding: '10px', borderRadius: '11px', border: 'none', background: V.primary, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: mutation.isPending ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: mutation.isPending ? 0.7 : 1 }}
          >
            {mutation.isPending && <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />}
            {mutation.isPending ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffUsersPage() {
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState('');

  const usersQuery  = useQuery({ queryKey: ['staff-users'], queryFn: () => apiClient<StaffUser[]>('/users') });
  const rolesQuery  = useQuery({ queryKey: ['roles'],       queryFn: () => apiClient<RoleItem[]>('/users/roles') });
  const tenantQuery = useQuery({ queryKey: ['tenant-me'],   queryFn: () => apiClient<{ branches: BranchItem[] }>('/tenants/me') });

  const users    = usersQuery.data  ?? [];
  const roles    = rolesQuery.data  ?? [];
  const branches = tenantQuery.data?.branches ?? [];

  const filtered = users.filter(u =>
    !search || `${u.firstName} ${u.lastName} ${u.email} ${u.role.name}`.toLowerCase().includes(search.toLowerCase())
  );

  const card: React.CSSProperties = {
    background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px', backdropFilter: 'blur(16px)',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0, background: 'linear-gradient(135deg, #FF5A6F 0%, #C73B4E 100%)', boxShadow: '0 4px 12px rgba(255,90,111,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck style={{ width: '18px', height: '18px', color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ color: V.text, fontSize: '18px', fontWeight: 700 }}>Staff & Security</h2>
            <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '2px' }}>{users.length} team member{users.length !== 1 ? 's' : ''} · {roles.length} roles</p>
          </div>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '12px', border: 'none', background: V.primary, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(77,162,255,0.30)' }}
        >
          <Plus style={{ width: '15px', height: '15px' }} />
          Invite Staff
        </button>
      </div>

      {/* Role summary cards */}
      {roles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
          {roles.map(role => {
            const cfg = ROLE_COLORS[role.code] ?? { color: V.textSec, bg: 'rgba(255,255,255,0.06)' };
            const count = users.filter(u => u.role.code === role.code).length;
            return (
              <div key={role.code} style={{ ...card, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: cfg.color }}>{role.name}</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: V.text }}>{count}</span>
                </div>
                <p style={{ fontSize: '11px', color: V.textMuted, lineHeight: 1.3 }}>{role.description ?? 'Team member'}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Search + table */}
      <div style={card}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or role..."
              style={{ background: '#0E1728', border: `1px solid ${V.border}`, color: V.text, borderRadius: '10px', padding: '8px 12px 8px 36px', fontSize: '13px', width: '100%', outline: 'none' }}
            />
            <Mail style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: V.textMuted }} />
          </div>
          <span style={{ color: V.textMuted, fontSize: '12px', marginLeft: 'auto' }}>{filtered.length} members</span>
        </div>

        {usersQuery.isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
            <Loader2 style={{ width: '20px', height: '20px', color: V.primary, animation: 'spin 1s linear infinite' }} />
            <span style={{ color: V.textMuted, fontSize: '13px' }}>Loading staff...</span>
          </div>
        )}

        {!usersQuery.isLoading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <User style={{ width: '32px', height: '32px', color: V.textMuted, margin: '0 auto 10px' }} />
            <p style={{ color: V.text, fontWeight: 600, fontSize: '14px' }}>No staff members found</p>
            <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '4px' }}>Invite your first team member to get started</p>
          </div>
        )}

        <div>
          {filtered.map((user, i) => (
            <div key={user.id}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderBottom: i < filtered.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, background: `${ROLE_COLORS[user.role.code]?.color ?? V.primary}20`, border: `1px solid ${ROLE_COLORS[user.role.code]?.color ?? V.primary}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: ROLE_COLORS[user.role.code]?.color ?? V.primary }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: V.text, fontSize: '13px', fontWeight: 600 }}>{user.firstName} {user.lastName}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                  <span style={{ color: V.textMuted, fontSize: '11.5px' }}>{user.email}</span>
                  {user.phone && <><span style={{ color: V.border }}>·</span><span style={{ color: V.textMuted, fontSize: '11.5px' }}>{user.phone}</span></>}
                </div>
              </div>
              {user.branch && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(77,162,255,0.08)', border: '1px solid rgba(77,162,255,0.16)' }}>
                  <Building2 style={{ width: '11px', height: '11px', color: V.primary }} />
                  <span style={{ color: V.primary, fontSize: '11px', fontWeight: 600 }}>{user.branch.name}</span>
                </div>
              )}
              <RoleBadge code={user.role.code} name={user.role.name} />
              <span style={{ color: V.textMuted, fontSize: '11px', whiteSpace: 'nowrap' }} className="hidden sm:block">
                {formatDateTime(user.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showInvite && rolesQuery.data && (
        <InviteModal roles={roles} branches={branches} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}
