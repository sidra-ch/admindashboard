'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Zap, ChevronRight, Wifi, Database, Shield, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { sidebarSections } from '../../lib/nav';

// ── Velocity Fleet OS Color System ───────────────────────────────────────────
const V = {
  bg: '#0B1020',
  surface: '#121A2F',
  card: '#18233D',
  border: 'rgba(255,255,255,0.08)',
  primary: '#4DA2FF',
  secondary: '#00D1FF',
  success: '#00C27A',
  warning: '#FFB547',
  danger: '#FF5A6F',
  text: '#F5F7FA',
  textSec: '#A8B3CF',
  textMuted: '#6E7A99',
};

const SECTION_COLORS: Record<string, string> = {
  'Command Center': 'linear-gradient(135deg, #4DA2FF, #00D1FF)',
  'Fleet Intelligence': 'linear-gradient(135deg, #00C27A, #00D1FF)',
  'Bookings & Rentals': 'linear-gradient(135deg, #FFB547, #FF8C42)',
  'Finance': 'linear-gradient(135deg, #A78BFA, #4DA2FF)',
  'CRM': 'linear-gradient(135deg, #F472B6, #FF5A6F)',
  'Administration': 'linear-gradient(135deg, #6E7A99, #A8B3CF)',
};

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [time, setTime] = useState<string>('');

  useEffect(() => { setPendingHref(null); }, [pathname]);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside
      className={className}
      style={{
        display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
        padding: '16px 12px',
        background: 'linear-gradient(180deg, #121A2F 0%, #0F1828 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px', backdropFilter: 'blur(40px)',
        overflow: 'hidden', position: 'relative',
      }}
    >
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '-60px', left: '-30px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,162,255,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-40px', right: '-20px', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,209,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 6px 20px', position: 'relative' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: 'linear-gradient(135deg, #4DA2FF 0%, #00D1FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(77,162,255,0.38)', fontSize: '18px' }}>
            ⚡
          </div>
          <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '11px', height: '11px', borderRadius: '50%', background: '#00C27A', boxShadow: '0 0 6px #00C27A, 0 0 12px rgba(0,194,122,0.4)' }} className="animate-live-blink" />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ color: V.text, fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>Velocity Fleet OS</p>
          <p style={{ color: V.textMuted, fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '2px' }}>Enterprise Platform</p>
        </div>
        <span style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, fontFamily: 'monospace', background: 'rgba(77,162,255,0.10)', border: '1px solid rgba(77,162,255,0.18)', color: '#4DA2FF', flexShrink: 0 }}>
          {time || '--:--'}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', margin: '0 4px 16px', background: 'linear-gradient(90deg, transparent, rgba(77,162,255,0.25), rgba(0,209,255,0.15), transparent)' }} />

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', paddingRight: '2px' }}>
        {sidebarSections.map((section, sIdx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.05, duration: 0.3 }}
            style={{ marginBottom: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px 8px', marginBottom: '2px' }}>
              <div style={{ width: '16px', height: '3px', borderRadius: '2px', background: SECTION_COLORS[section.title] || V.primary, flexShrink: 0 }} />
              <p style={{ color: V.textMuted, fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{section.title}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
                const pending = pendingHref === item.href && !active;
                const hovered = hoveredHref === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    onFocus={() => router.prefetch(item.href)}
                    onMouseEnter={() => { router.prefetch(item.href); setHoveredHref(item.href); }}
                    onMouseLeave={() => setHoveredHref(null)}
                    onClick={() => { if (!active) setPendingHref(item.href); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 10px', borderRadius: '11px', fontSize: '13px',
                      fontWeight: active ? 600 : 450, textDecoration: 'none',
                      transition: 'all 0.18s ease', position: 'relative',
                      opacity: pending ? 0.55 : 1,
                      background: active ? 'linear-gradient(135deg, rgba(77,162,255,0.16) 0%, rgba(0,209,255,0.08) 100%)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                      border: active ? '1px solid rgba(77,162,255,0.22)' : hovered ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
                      color: active ? V.primary : hovered ? V.textSec : '#7B8BA8',
                      boxShadow: active ? '0 4px 16px rgba(77,162,255,0.10)' : 'none',
                    }}
                  >
                    {active && (
                      <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '62%', borderRadius: '0 3px 3px 0', background: 'linear-gradient(to bottom, #4DA2FF, #00D1FF)', boxShadow: '0 0 8px rgba(77,162,255,0.7)' }} />
                    )}
                    <span style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(77,162,255,0.18)' : hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)', color: active ? V.primary : hovered ? V.textSec : V.textMuted, transition: 'all 0.18s ease' }}>
                      {pending ? <Loader2 style={{ width: '13px', height: '13px' }} className="animate-spin" /> : <Icon style={{ width: '13px', height: '13px' }} />}
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                    {active && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: V.primary, boxShadow: `0 0 8px ${V.primary}` }} />
                    )}
                    {!active && hovered && (
                      <ChevronRight style={{ width: '12px', height: '12px', color: V.textMuted, flexShrink: 0 }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ))}
      </nav>

      {/* System Status */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
          {([['API', V.success, Wifi], ['Database', V.success, Database], ['Auth', V.success, Shield], ['Fleet', V.warning, Activity]] as const).map(([label, color, Icon]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color as string, boxShadow: `0 0 5px ${color}`, flexShrink: 0 }} className="animate-live-blink" />
              <span style={{ color: V.textMuted, fontSize: '10px', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(0,194,122,0.07)', border: '1px solid rgba(0,194,122,0.14)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: V.success, boxShadow: `0 0 8px ${V.success}`, flexShrink: 0 }} className="animate-live-blink" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: V.text, fontSize: '11px', fontWeight: 600, lineHeight: 1.3 }}>All systems operational</p>
            <p style={{ color: V.textMuted, fontSize: '9.5px', marginTop: '1px' }}>v2.4.1 · SLA 99.9%</p>
          </div>
          <Zap style={{ width: '12px', height: '12px', color: V.success, flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
