'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, getApiOrigin } from '../../../lib/api-client';
import { getStoredSession } from '../../../lib/auth-storage';
import { MapPin, Wifi, WifiOff, Car, Loader2 } from 'lucide-react';

const V = {
  bg: '#0B1020', surface: '#121A2F', card: '#18233D',
  border: 'rgba(255,255,255,0.08)', primary: '#4DA2FF',
  success: '#00C27A', warning: '#FFB547', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

// ─── types ────────────────────────────────────────────────────────────────────
type LiveLocation = {
  carId: string;
  lat: number;
  lng: number;
  speedKmh: number;
  heading: number;
  ignitionOn: boolean;
  batteryVoltage?: number;
  fuelLevelPercent?: number;
  recordedAt: string;
  car: {
    id: string;
    registrationNumber: string;
    make: string;
    model: string;
    status: string;
  } | null;
  rental: {
    id: string;
    customer: { firstName: string; lastName: string } | null;
    expectedReturnAt: string;
  } | null;
};

// ─── Dynamic map (SSR disabled — Leaflet requires window) ─────────────────────
const TrackingMap = dynamic(() => import('../../../components/maps/live-tracking-map'), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, background: V.surface, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
      <Loader2 style={{ width: '20px', height: '20px', color: V.primary, animation: 'spin 1s linear infinite' }} />
      <span style={{ color: V.textMuted, fontSize: '13px' }}>Loading map…</span>
    </div>
  ),
});

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const session = getStoredSession();
  const tenantId = session?.user?.tenantId ?? '';

  const [locations, setLocations] = useState<Record<string, LiveLocation>>({});
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef<import('socket.io-client').Socket | null>(null);

  // Initial fetch
  const { data: initial, isLoading } = useQuery<LiveLocation[]>({
    queryKey: ['tracking-live', tenantId],
    queryFn: () => apiClient(`/tracking/live?tenantId=${tenantId}`),
    enabled: !!tenantId,
    refetchOnWindowFocus: false,
  });

  // Seed state from initial fetch
  useEffect(() => {
    if (initial) {
      const map: Record<string, LiveLocation> = {};
      for (const loc of initial) map[loc.carId] = loc;
      setLocations(map);
    }
  }, [initial]);

  // WebSocket connection
  useEffect(() => {
    if (!tenantId) return;

    let socket: import('socket.io-client').Socket;

    (async () => {
      const { io } = await import('socket.io-client');
      const origin = getApiOrigin();

      socket = io(`${origin}/tracking`, {
        transports: ['websocket'],
        auth: { token: session?.accessToken ?? '' },
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setWsConnected(true);
        socket.emit('subscribe:tenant', { tenantId });
      });

      socket.on('disconnect', () => setWsConnected(false));

      socket.on('car.location.updated', (data: LiveLocation) => {
        setLocations((prev) => ({ ...prev, [data.carId]: data }));
      });
    })();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const locationList = Object.values(locations);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 96px)', minHeight: '540px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #4DA2FF 0%, #006BCF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin style={{ width: '20px', height: '20px', color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ color: V.text, fontSize: '20px', fontWeight: 800, margin: 0 }}>Live Tracking</h1>
            <p style={{ color: V.textMuted, fontSize: '12px', margin: 0 }}>Real-time fleet GPS positions</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: wsConnected ? 'rgba(0,194,122,0.10)' : 'rgba(255,90,111,0.10)', border: `1px solid ${wsConnected ? V.success : V.danger}` }}>
          {wsConnected
            ? <Wifi style={{ width: '14px', height: '14px', color: V.success }} />
            : <WifiOff style={{ width: '14px', height: '14px', color: V.danger }} />}
          <span style={{ color: wsConnected ? V.success : V.danger, fontSize: '12px', fontWeight: 700 }}>
            {wsConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { label: 'Tracked Vehicles', value: isLoading ? '…' : String(locationList.length), color: V.primary },
          { label: 'Ignition On', value: isLoading ? '…' : String(locationList.filter(l => l.ignitionOn).length), color: V.success },
          { label: 'Currently Rented', value: isLoading ? '…' : String(locationList.filter(l => l.rental).length), color: V.warning },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, minWidth: '140px', padding: '14px', borderRadius: '14px', background: V.card, border: `1px solid ${V.border}`, textAlign: 'center' }}>
            <p style={{ color, fontSize: '22px', fontWeight: 800, margin: 0 }}>{value}</p>
            <p style={{ color: V.textMuted, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Map + sidebar */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', overflow: 'hidden' }}>
        {/* Map */}
        <div style={{ flex: 1, borderRadius: '18px', overflow: 'hidden', border: `1px solid ${V.border}` }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <TrackingMap locations={locationList as any[]} />
        </div>

        {/* Sidebar list */}
        <div style={{ width: '260px', background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car style={{ width: '14px', height: '14px', color: V.primary }} />
            <p style={{ color: V.text, fontSize: '13px', fontWeight: 700, margin: 0 }}>Fleet ({locationList.length})</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 style={{ width: '18px', height: '18px', color: V.primary, animation: 'spin 1s linear infinite' }} />
              </div>
            )}
            {!isLoading && locationList.length === 0 && (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <Car style={{ width: '28px', height: '28px', color: V.textMuted, margin: '0 auto 8px' }} />
                <p style={{ color: V.textMuted, fontSize: '12px' }}>No live data</p>
                <p style={{ color: V.textMuted, fontSize: '11px', marginTop: '4px' }}>Vehicles will appear when GPS data is received</p>
              </div>
            )}
            {locationList.map((loc) => (
              <div key={loc.carId} style={{ padding: '12px 16px', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <p style={{ color: V.text, fontSize: '12px', fontWeight: 700, margin: 0 }}>
                    {loc.car?.registrationNumber ?? loc.carId.slice(0, 8)}
                  </p>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '5px', background: loc.ignitionOn ? 'rgba(0,194,122,0.12)' : 'rgba(255,255,255,0.06)', color: loc.ignitionOn ? V.success : V.textMuted }}>
                    {loc.ignitionOn ? 'ON' : 'OFF'}
                  </span>
                </div>
                {loc.car && (
                  <p style={{ color: V.textMuted, fontSize: '11px', margin: 0 }}>{loc.car.make} {loc.car.model}</p>
                )}
                <p style={{ color: V.textSec, fontSize: '11px', marginTop: '2px' }}>
                  {loc.speedKmh} km/h · hdg {loc.heading}°
                </p>
                {loc.rental?.customer && (
                  <p style={{ color: V.warning, fontSize: '10.5px', marginTop: '3px' }}>
                    {loc.rental.customer.firstName} {loc.rental.customer.lastName}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
