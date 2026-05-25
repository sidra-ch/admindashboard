import { LoginForm } from '../../../components/auth/login-form';
import { Suspense } from 'react';

export default function LoginPage() {
  const features = [
    { icon: '⚡', title: 'Real-time Fleet Intelligence', description: 'Live vehicle tracking, maintenance alerts, and revenue analytics unified in one command centre.' },
    { icon: '🛡️', title: 'Bank-Grade Security', description: 'Multi-tenant JWT auth with full audit trail, RBAC permissions, and SOC 2 standards.' },
    { icon: '🌏', title: 'Enterprise Grade', description: 'GST-compliant reporting, document management, and end-to-end operational visibility.' },
  ];
  const stats = [
    { value: '500+', label: 'Vehicles Managed' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '200+', label: 'Enterprise Fleets' },
    { value: '2.4B', label: 'Value Managed' },
  ];

  return (
    <main style={{ display: 'flex', minHeight: '100vh', background: '#0B1020' }}>
      {/* ── Left: Brand Hero ─────────────────────────────────── */}
      <div style={{ display: 'none', width: '52%', position: 'relative', overflow: 'hidden', flexDirection: 'column', justifyContent: 'space-between', padding: '48px' }} className="xl:flex xl:flex-col">
        {/* Background gradient card */}
        <div style={{ position: 'absolute', inset: '20px 0 20px 20px', borderRadius: '32px', background: 'linear-gradient(145deg, rgba(18,26,47,0.90) 0%, rgba(11,16,32,0.80) 100%)', border: '1px solid rgba(77,162,255,0.12)', backdropFilter: 'blur(20px)' }} />
        {/* Radial glow */}
        <div style={{ position: 'absolute', top: '20%', left: '30%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,162,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,194,122,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Blue accent line */}
        <div style={{ position: 'absolute', left: '20px', top: '30%', width: '3px', height: '120px', borderRadius: '2px', background: 'linear-gradient(to bottom, transparent, #4DA2FF, transparent)' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #4DA2FF, #00D1FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 8px 32px rgba(77,162,255,0.35)' }}>🚗</div>
          <div>
            <p style={{ color: '#F5F7FA', fontSize: '13px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase' }}>Velocity Fleet OS</p>
            <p style={{ color: '#6E7A99', fontSize: '10px', letterSpacing: '0.20em', textTransform: 'uppercase' }}>Enterprise Command Centre</p>
          </div>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ color: '#4DA2FF', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: '16px' }}>AI-Powered Mobility OS — 2027 Edition</p>
          <h1 style={{ color: '#F5F7FA', fontSize: '40px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '20px' }}>
            Fleet Operations<br />
            <span style={{ background: 'linear-gradient(135deg, #4DA2FF, #00D1FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Reimagined</span>
          </h1>
          <p style={{ color: '#A8B3CF', fontSize: '14px', lineHeight: 1.7, maxWidth: '380px', marginBottom: '40px' }}>
            The complete enterprise platform for car rental operations. From vehicle lifecycle to customer CRM, all in one intelligent system.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
            {features.map(f => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(77,162,255,0.10)', border: '1px solid rgba(77,162,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <p style={{ color: '#F5F7FA', fontSize: '13px', fontWeight: 600, marginBottom: '3px' }}>{f.title}</p>
                  <p style={{ color: '#6E7A99', fontSize: '12px', lineHeight: 1.5 }}>{f.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {stats.map(s => (
              <div key={s.label} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                <p style={{ color: '#4DA2FF', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>{s.value}</p>
                <p style={{ color: '#6E7A99', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', marginTop: '3px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Login form ─────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Mobile logo */}
          <div className="xl:hidden" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #4DA2FF, #00D1FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🚗</div>
            <p style={{ color: '#F5F7FA', fontSize: '14px', fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase' }}>Velocity Fleet OS</p>
          </div>

          {/* Card */}
          <div style={{ background: '#18233D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '36px 32px' }}>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ color: '#F5F7FA', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>Welcome back</h2>
              <p style={{ color: '#6E7A99', fontSize: '13.5px' }}>Sign in to your Fleet OS workspace</p>
            </div>
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>

          {/* Footer */}
          <p style={{ color: '#6E7A99', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
            © 2027 Velocity Fleet OS · Enterprise Edition · All rights reserved
          </p>
        </div>
      </div>
    </main>
  );
}