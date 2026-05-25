'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, getApiOrigin } from '@/lib/api-client';
import { getStoredSession } from '@/lib/auth-storage';
import { MapPin, Navigation, Zap, Battery, Fuel, Radio, Car, X, Clock } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';

const V = {
  bg: '#0B1020', surface: '#121A2F', card: '#18233D',
  border: 'rgba(255,255,255,0.08)', primary: '#4DA2FF', secondary: '#00D1FF',
  success: '#00C27A', warning: '#FFB547', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

const LiveTrackingMap = dynamic(() => import('@/components/maps/live-tracking-map'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: V.surface, borderRadius: '14px' }}>
      <div style={{ textAlign: 'center', color: V.textMuted }}>
        <MapPin style={{ width: '36px', height: '36px', margin: '0 auto 12px', opacity: 0.4 }} />
        <p style={{ fontSize: '13px' }}>Loading satellite map…</p>
      </div>
    </div>
  ),
});

type LiveLocation = {
  carId: string;
  car: {
    id: string;
    registrationNumber: string;
    make: string;
    model: string;
    status: string;
  };
  lat: number;
  lng: number;
  speedKmh?: number;
  heading?: number;
  ignitionOn: boolean;
  batteryVoltage?: number;
  fuelLevelPercent?: number;
  recordedAt: string;
  rental?: {
    id: string;
    customer: {
      firstName: string;
      lastName: string;
    };
    expectedReturnAt: string;
  };
};

export default function LiveMapPage() {
  const session = getStoredSession();
  const [, setSocket] = useState<Socket | null>(null);
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([]);
  const [selectedCar, setSelectedCar] = useState<LiveLocation | null>(null);
  const [connected, setConnected] = useState(false);

  const { data: initialLocations } = useQuery({
    queryKey: ['tracking-live'],
    queryFn: () => apiClient<LiveLocation[]>(`/tracking/live?tenantId=${session?.user.tenantId}`),
    enabled: !!session?.user.tenantId,
  });

  useEffect(() => {
    if (initialLocations) {
      setLiveLocations(initialLocations);
    }
  }, [initialLocations]);

  useEffect(() => {
    if (!session?.user.tenantId) return;

    const newSocket = io(`${getApiOrigin()}/tracking`, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('subscribe:tenant', { tenantId: session.user.tenantId });
    });

    newSocket.on('disconnect', () => setConnected(false));

    newSocket.on('car.location.updated', (data: any) => {
      setLiveLocations((prev) => {
        const index = prev.findIndex((loc) => loc.carId === data.carId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...data };
          return updated;
        }
        return prev;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('unsubscribe:tenant', { tenantId: session.user.tenantId });
      newSocket.disconnect();
    };
  }, [session?.user.tenantId]);

  const handleCarClick = (carId: string) => {
    const car = liveLocations.find((loc) => loc.carId === carId);
    setSelectedCar(car ?? null);
  };

  const moving = liveLocations.filter(l => l.ignitionOn).length;
  const parked = liveLocations.filter(l => !l.ignitionOn).length;

  return (
    <div style={{ padding: '28px', minHeight: '100vh', background: V.bg, color: V.text }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #4DA2FF, #00D1FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin style={{ width: '18px', height: '18px', color: 'white' }} />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>Live GPS Tracking</h1>
            </div>
            <p style={{ color: V.textMuted, fontSize: '13px' }}>Real-time vehicle locations and telemetry</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: connected ? 'rgba(0,194,122,0.10)' : 'rgba(255,90,111,0.10)', border: `1px solid ${connected ? 'rgba(0,194,122,0.25)' : 'rgba(255,90,111,0.25)'}` }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: connected ? V.success : V.danger }} />
            <Radio style={{ width: '13px', height: '13px', color: connected ? V.success : V.danger }} />
            <span style={{ color: connected ? V.success : V.danger, fontSize: '12px', fontWeight: 600 }}>
              {connected ? 'WebSocket Live' : 'Reconnecting…'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginTop: '20px' }}>
          {[
            { label: 'Total Tracked', value: liveLocations.length, color: V.primary, icon: <Car style={{ width: '16px', height: '16px' }} /> },
            { label: 'Moving', value: moving, color: V.success, icon: <Zap style={{ width: '16px', height: '16px' }} /> },
            { label: 'Parked', value: parked, color: V.textSec, icon: <MapPin style={{ width: '16px', height: '16px' }} /> },
            { label: 'With Rental', value: liveLocations.filter(l => l.rental).length, color: V.warning, icon: <Navigation style={{ width: '16px', height: '16px' }} /> },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '16px 20px', borderRadius: '14px', background: V.card, border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
              <div>
                <p style={{ color: s.color, fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>{s.value}</p>
                <p style={{ color: V.textMuted, fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Map + List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin style={{ width: '16px', height: '16px', color: V.primary }} />
              <span style={{ color: V.text, fontSize: '14px', fontWeight: 600 }}>Live Map — {liveLocations.length} vehicles</span>
            </div>
            {selectedCar && (
              <button onClick={() => setSelectedCar(null)} style={{ background: 'none', border: 'none', color: V.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <X style={{ width: '13px', height: '13px' }} /> Clear selection
              </button>
            )}
          </div>
          <div style={{ padding: '16px' }}>
            <LiveTrackingMap
              locations={liveLocations}
              selectedCarId={selectedCar?.carId}
              onCarClick={handleCarClick}
              center={[-33.8688, 151.2093]}
              zoom={12}
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${V.border}` }}>
            <span style={{ color: V.text, fontSize: '14px', fontWeight: 600 }}>Active Vehicles</span>
            <span style={{ color: V.textMuted, fontSize: '12px', marginLeft: '8px' }}>({liveLocations.length})</span>
          </div>
          <div style={{ maxHeight: '620px', overflowY: 'auto', padding: '12px' }}>
            {liveLocations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: V.textMuted }}>
                <MapPin style={{ width: '32px', height: '32px', margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ fontSize: '13px' }}>No GPS-tracked vehicles</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {liveLocations.map(loc => {
                  const isSel = selectedCar?.carId === loc.carId;
                  return (
                    <motion.div key={loc.carId} onClick={() => setSelectedCar(isSel ? null : loc)} whileHover={{ scale: 1.01 }} style={{ padding: '12px 14px', borderRadius: '12px', background: isSel ? 'rgba(77,162,255,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSel ? 'rgba(77,162,255,0.35)' : V.border}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <p style={{ color: V.text, fontSize: '13px', fontWeight: 600 }}>{loc.car.make} {loc.car.model}</p>
                          <p style={{ color: V.textMuted, fontSize: '11px', marginTop: '2px' }}>{loc.car.registrationNumber}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '6px', background: loc.ignitionOn ? 'rgba(0,194,122,0.12)' : 'rgba(110,122,153,0.15)', border: `1px solid ${loc.ignitionOn ? 'rgba(0,194,122,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                          <Zap style={{ width: '11px', height: '11px', color: loc.ignitionOn ? V.success : V.textMuted }} />
                          <span style={{ color: loc.ignitionOn ? V.success : V.textMuted, fontSize: '10px', fontWeight: 600 }}>{loc.ignitionOn ? 'Moving' : 'Parked'}</span>
                        </div>
                      </div>
                      {loc.rental && (
                        <p style={{ color: V.textSec, fontSize: '11px', marginBottom: '6px' }}>
                          👤 {loc.rental.customer.firstName} {loc.rental.customer.lastName}
                        </p>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {loc.speedKmh !== undefined && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: V.textMuted, fontSize: '11px' }}>
                            <Navigation style={{ width: '11px', height: '11px' }} />
                            {loc.speedKmh.toFixed(0)} km/h
                          </div>
                        )}
                        {loc.batteryVoltage !== undefined && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: V.textMuted, fontSize: '11px' }}>
                            <Battery style={{ width: '11px', height: '11px' }} />
                            {loc.batteryVoltage.toFixed(1)}V
                          </div>
                        )}
                        {loc.fuelLevelPercent !== undefined && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: V.textMuted, fontSize: '11px' }}>
                            <Fuel style={{ width: '11px', height: '11px' }} />
                            {loc.fuelLevelPercent.toFixed(0)}% fuel
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: V.textMuted, fontSize: '11px' }}>
                          <Clock style={{ width: '11px', height: '11px' }} />
                          {new Date(loc.recordedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Selected car panel */}
      <AnimatePresence>
        {selectedCar && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ marginTop: '20px', background: V.card, border: '1px solid rgba(77,162,255,0.25)', borderRadius: '18px', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #4DA2FF, #00D1FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car style={{ width: '20px', height: '20px', color: 'white' }} />
                </div>
                <div>
                  <h3 style={{ color: V.text, fontSize: '16px', fontWeight: 700 }}>{selectedCar.car.make} {selectedCar.car.model}</h3>
                  <p style={{ color: V.textMuted, fontSize: '12px' }}>{selectedCar.car.registrationNumber}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCar(null)} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${V.border}`, borderRadius: '8px', padding: '6px 12px', color: V.textSec, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <X style={{ width: '12px', height: '12px' }} /> Close
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Coordinates', value: `${selectedCar.lat.toFixed(5)}, ${selectedCar.lng.toFixed(5)}`, color: V.primary },
                { label: 'Speed', value: selectedCar.speedKmh !== undefined ? `${selectedCar.speedKmh.toFixed(0)} km/h` : 'N/A', color: V.secondary },
                { label: 'Heading', value: selectedCar.heading !== undefined ? `${selectedCar.heading.toFixed(0)}°` : 'N/A', color: V.textSec },
                { label: 'Engine', value: selectedCar.ignitionOn ? 'ON' : 'OFF', color: selectedCar.ignitionOn ? V.success : V.textMuted },
                { label: 'Battery', value: selectedCar.batteryVoltage !== undefined ? `${selectedCar.batteryVoltage.toFixed(1)}V` : 'N/A', color: V.warning },
                { label: 'Fuel', value: selectedCar.fuelLevelPercent !== undefined ? `${selectedCar.fuelLevelPercent.toFixed(0)}%` : 'N/A', color: V.success },
                { label: 'Customer', value: selectedCar.rental ? `${selectedCar.rental.customer.firstName} ${selectedCar.rental.customer.lastName}` : '—', color: V.textSec },
                { label: 'Last Update', value: new Date(selectedCar.recordedAt).toLocaleTimeString(), color: V.textMuted },
              ].map(d => (
                <div key={d.label} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${V.border}` }}>
                  <p style={{ color: V.textMuted, fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>{d.label}</p>
                  <p style={{ color: d.color, fontSize: '13px', fontWeight: 600 }}>{d.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
