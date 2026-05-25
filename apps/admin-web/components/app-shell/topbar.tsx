'use client';

import { Bell, Search, Menu, Command, X, ArrowRight, Clock, TrendingUp, Car, Users } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clearStoredSession, getStoredSession, type StoredSession } from '../../lib/auth-storage';
import { sidebarSections } from '../../lib/nav';

const V = {
  bg: '#0B1020', surface: '#121A2F', card: '#18233D',
  border: 'rgba(255,255,255,0.08)', primary: '#4DA2FF', secondary: '#00D1FF',
  success: '#00C27A', warning: '#FFB547', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

function routeMatches(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
}

function getGreeting(now: Date | null) {
  if (!now) return 'there';
  const h = now.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function toTitleCase(s: string) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Quick actions for command palette
const QUICK_ACTIONS = [
  { label: 'Add New Vehicle', icon: Car, href: '/dashboard/fleet/cars/new', category: 'Fleet' },
  { label: 'View Active Rentals', icon: TrendingUp, href: '/dashboard/rentals/active', category: 'Rentals' },
  { label: 'Customer Search', icon: Users, href: '/dashboard/customers', category: 'CRM' },
  { label: 'Revenue Analytics', icon: TrendingUp, href: '/dashboard/payments/revenue', category: 'Finance' },
];

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const cmdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSession(getStoredSession()); }, []);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // CMD+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
        setCmdQuery('');
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (cmdOpen) setTimeout(() => cmdInputRef.current?.focus(), 50);
  }, [cmdOpen]);

  const navItems = sidebarSections.flatMap(s => s.items.map(i => ({ title: i.title, href: i.href })));
  const currentNavItem = navItems.find(i => routeMatches(pathname, i.href));
  const currentSection = sidebarSections.find(s => s.items.some(i => routeMatches(pathname, i.href)));
  const title = currentNavItem?.title ?? 'Dashboard';
  const sectionTitle = currentSection?.title ?? 'Operations';
  const displayName = session?.user.email?.split('@')[0]?.replace(/[._-]/g, ' ') ?? 'Fleet Admin';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const currentDate = now ? new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(now) : '';
  const currentTime = now ? new Intl.DateTimeFormat('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now) : '';

  // Command palette filtered results
  const allRoutes = sidebarSections.flatMap(s => s.items.map(i => ({ title: i.title, href: i.href, category: s.title })));
  const filteredRoutes = cmdQuery
    ? allRoutes.filter(r => r.title.toLowerCase().includes(cmdQuery.toLowerCase()) || r.category.toLowerCase().includes(cmdQuery.toLowerCase()))
    : allRoutes.slice(0, 6);

  const notifs = [
    { icon: '🔴', text: 'Insurance expiring in 2 days — Toyota Camry ABC-123', tag: 'Urgent', color: V.danger, time: '2m ago' },
    { icon: '⚠️', text: '2 rentals overdue in Sydney CBD branch', tag: 'Warning', color: V.warning, time: '8m ago' },
    { icon: '💳', text: 'Pending payments exceed $45,000 threshold', tag: 'Finance', color: V.primary, time: '15m ago' },
    { icon: '🔧', text: 'Scheduled maintenance due: Ford Ranger XYZ-456', tag: 'Maintenance', color: V.secondary, time: '1h ago' },
  ];

  return (
    <>
      {/* ── Main topbar ──────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', padding: '12px 20px',
        background: 'linear-gradient(135deg, rgba(18,26,47,0.95) 0%, rgba(15,22,42,0.90) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '18px', backdropFilter: 'blur(24px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.20), 0 0 0 1px rgba(77,162,255,0.05)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle top glow line */}
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(77,162,255,0.3), transparent)', pointerEvents: 'none' }} />

        {/* Left: Page title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <button
            onClick={onOpenSidebar}
            style={{ display: 'none', width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            className="lg:!hidden !flex"
          >
            <Menu style={{ width: '16px', height: '16px', color: V.textSec }} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ color: V.textMuted, fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{sectionTitle}</span>
              <span style={{ color: V.textMuted, fontSize: '10px' }}>›</span>
            </div>
            <h1 style={{ color: V.text, fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{title}</h1>
            <p style={{ color: V.textMuted, fontSize: '11px', marginTop: '2px' }}>
              Good {getGreeting(now)}, {toTitleCase(displayName)}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Date/time */}
          <div style={{ display: 'none', alignItems: 'center', gap: '10px', padding: '8px 14px', borderRadius: '12px', background: 'rgba(77,162,255,0.07)', border: '1px solid rgba(77,162,255,0.14)', minWidth: '180px' }}
            className="lg:!flex"
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #4DA2FF, #00D1FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(77,162,255,0.3)' }}>
              <Clock style={{ width: '14px', height: '14px', color: 'white' }} />
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <p style={{ color: V.text, fontSize: '12px', fontWeight: 600 }}>{currentDate}</p>
              <p style={{ color: V.textMuted, fontSize: '10.5px', fontFamily: 'monospace', marginTop: '1px' }}>{currentTime}</p>
            </div>
          </div>

          {/* CMD+K search trigger */}
          <button
            onClick={() => { setCmdOpen(true); setCmdQuery(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', minWidth: '200px', transition: 'all 0.18s ease' }}
            className="hidden sm:flex hover:border-blue-500/30"
          >
            <Search style={{ width: '14px', height: '14px', color: V.textMuted, flexShrink: 0 }} />
            <span style={{ color: V.textMuted, fontSize: '12.5px', flex: 1, textAlign: 'left' }}>Search fleet, routes...</span>
            <kbd style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '2px 6px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', fontSize: '10px', color: V.textMuted, fontFamily: 'monospace' }}>
              <Command style={{ width: '9px', height: '9px' }} />K
            </kbd>
          </button>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
              style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'all 0.18s ease' }}
            >
              <Bell style={{ width: '16px', height: '16px', color: V.textSec }} />
              <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: V.danger, border: '2px solid #0F1828', boxShadow: `0 0 6px ${V.danger}` }} />
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: '48px', right: 0, width: '340px', maxWidth: 'calc(100vw - 32px)', background: '#121A2F', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden' }}
                >
                  <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: V.text, fontSize: '13px', fontWeight: 700 }}>Alert Centre</span>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: 'rgba(255,90,111,0.12)', color: V.danger, border: '1px solid rgba(255,90,111,0.22)' }}>4 new</span>
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notifs.map((n, i) => (
                      <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}>
                        <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{n.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: V.textSec, fontSize: '12px', lineHeight: 1.4 }}>{n.text}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{ padding: '1px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 600, background: `${n.color}18`, color: n.color }}>{n.tag}</span>
                            <span style={{ color: V.textMuted, fontSize: '10px' }}>{n.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px' }}>
                    <button style={{ width: '100%', padding: '8px', borderRadius: '10px', background: 'rgba(77,162,255,0.08)', border: '1px solid rgba(77,162,255,0.15)', color: V.primary, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => { router.push('/dashboard/notifications'); setNotifOpen(false); }}>
                      View All Alerts
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px 6px 6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.18s ease' }}
            >
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #4DA2FF, #00D1FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ textAlign: 'left' }} className="hidden sm:block">
                <p style={{ color: V.text, fontSize: '12px', fontWeight: 600, lineHeight: 1.2 }}>{toTitleCase(displayName)}</p>
                <p style={{ color: V.textMuted, fontSize: '10px' }}>Fleet Admin</p>
              </div>
            </button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: '48px', right: 0, width: '220px', maxWidth: 'calc(100vw - 32px)', background: '#121A2F', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden', padding: '8px' }}
                >
                  {[
                    { label: 'Profile Settings', href: '/dashboard/settings/company' },
                    { label: 'Audit Logs', href: '/dashboard/audit-logs' },
                    { label: 'Help & Support', href: '#' },
                  ].map(item => (
                    <button key={item.label}
                      onClick={() => { router.push(item.href); setUserMenuOpen(false); }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', textAlign: 'left', fontSize: '13px', color: V.textSec, background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease' }}
                    >
                      {item.label}
                    </button>
                  ))}
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />
                  <button
                    onClick={() => { clearStoredSession(); router.push('/auth/login'); }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', textAlign: 'left', fontSize: '13px', color: V.danger, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Command Palette ───────────────────────────────────────────── */}
      <AnimatePresence>
        {cmdOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="cmd-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setCmdOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
              className="cmd-panel"
            >
              {/* Search input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Search style={{ width: '18px', height: '18px', color: V.primary, flexShrink: 0 }} />
                <input
                  ref={cmdInputRef}
                  value={cmdQuery}
                  onChange={e => setCmdQuery(e.target.value)}
                  placeholder="Search fleet, navigate, or run actions..."
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: V.text, fontSize: '15px', fontWeight: 400 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && filteredRoutes[0]) {
                      router.push(filteredRoutes[0].href);
                      setCmdOpen(false);
                    }
                  }}
                />
                <kbd style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', fontSize: '11px', color: V.textMuted, cursor: 'pointer' }} onClick={() => setCmdOpen(false)}>ESC</kbd>
              </div>

              {/* Results */}
              <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
                {!cmdQuery && (
                  <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '8px 12px 4px' }}>Quick Navigation</p>
                )}
                {filteredRoutes.map((route, i) => (
                  <button
                    key={route.href}
                    onClick={() => { router.push(route.href); setCmdOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '11px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                    className="hover:bg-white/5"
                  >
                    <span style={{ padding: '6px 8px', borderRadius: '8px', background: 'rgba(77,162,255,0.10)', border: '1px solid rgba(77,162,255,0.18)', fontSize: '10px', color: V.primary, fontWeight: 600, flexShrink: 0, minWidth: '80px', textAlign: 'center' }}>
                      {route.category}
                    </span>
                    <span style={{ color: V.text, fontSize: '13px', fontWeight: 500, flex: 1 }}>{route.title}</span>
                    <ArrowRight style={{ width: '14px', height: '14px', color: V.textMuted, flexShrink: 0 }} />
                  </button>
                ))}
                {filteredRoutes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px', color: V.textMuted, fontSize: '13px' }}>
                    No results for &quot;{cmdQuery}&quot;
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ color: V.textMuted, fontSize: '11px' }}>⌘K to toggle · Enter to navigate</span>
                <span style={{ color: V.textMuted, fontSize: '11px' }}>{filteredRoutes.length} results</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
