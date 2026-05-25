'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom car marker icons
const createCarIcon = (status: string, ignitionOn: boolean) => {
  const color = ignitionOn ? '#22c55e' : '#ef4444'; // Green if moving, red if parked
  const statusColor = 
    status === 'RENTED' ? '#3b82f6' :
    status === 'MAINTENANCE' ? '#f59e0b' :
    status === 'AVAILABLE' ? '#10b981' : '#6b7280';

  return L.divIcon({
    className: 'custom-car-marker',
    html: `
      <div style="
        background: ${statusColor};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
        ${ignitionOn ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 8px;
            height: 8px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

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

type RoutePoint = {
  lat: number;
  lng: number;
  speedKmh?: number;
  recordedAt: string;
};

type Geofence = {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusM: number;
  isActive: boolean;
};

interface LiveTrackingMapProps {
  locations: LiveLocation[];
  routeHistory?: RoutePoint[];
  geofences?: Geofence[];
  selectedCarId?: string;
  onCarClick?: (carId: string) => void;
  center?: [number, number];
  zoom?: number;
}

export default function LiveTrackingMap({
  locations,
  routeHistory,
  geofences,
  selectedCarId,
  onCarClick,
  center = [-33.8688, 151.2093], // Sydney, Australia
  zoom = 12,
}: LiveTrackingMapProps) {
  const [map, setMap] = useState<L.Map | null>(null);

  // Auto-fit bounds when locations change
  useEffect(() => {
    if (map && locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map((loc) => [loc.lat, loc.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, locations]);

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={setMap}
      >
        {/* OpenStreetMap Tiles (Free!) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Car Markers */}
        {locations.map((location) => (
          <Marker
            key={location.carId}
            position={[location.lat, location.lng]}
            icon={createCarIcon(location.car.status, location.ignitionOn)}
            eventHandlers={{
              click: () => onCarClick?.(location.carId),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-sm mb-2">
                  {location.car.make} {location.car.model}
                </h3>
                <div className="text-xs space-y-1">
                  <p>
                    <strong>Rego:</strong> {location.car.registrationNumber}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span
                      className={`px-2 py-0.5 rounded ${
                        location.car.status === 'RENTED'
                          ? 'bg-blue-100 text-blue-800'
                          : location.car.status === 'AVAILABLE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {location.car.status}
                    </span>
                  </p>
                  {location.speedKmh !== undefined && (
                    <p>
                      <strong>Speed:</strong> {location.speedKmh.toFixed(0)} km/h
                    </p>
                  )}
                  <p>
                    <strong>Ignition:</strong>{' '}
                    <span
                      className={`px-2 py-0.5 rounded ${
                        location.ignitionOn
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {location.ignitionOn ? 'ON' : 'OFF'}
                    </span>
                  </p>
                  {location.batteryVoltage && (
                    <p>
                      <strong>Battery:</strong> {location.batteryVoltage.toFixed(1)}V
                    </p>
                  )}
                  {location.fuelLevelPercent && (
                    <p>
                      <strong>Fuel:</strong> {location.fuelLevelPercent.toFixed(0)}%
                    </p>
                  )}
                  {location.rental && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="font-semibold">Rented by:</p>
                      <p>
                        {location.rental.customer.firstName}{' '}
                        {location.rental.customer.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {new Date(location.rental.expectedReturnAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Last update: {new Date(location.recordedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route History Polyline */}
        {routeHistory && routeHistory.length > 0 && (
          <Polyline
            positions={routeHistory.map((point) => [point.lat, point.lng])}
            color="#3b82f6"
            weight={3}
            opacity={0.7}
          />
        )}

        {/* Geofences */}
        {geofences?.map((geofence) => (
          <Circle
            key={geofence.id}
            center={[geofence.centerLat, geofence.centerLng]}
            radius={geofence.radiusM}
            pathOptions={{
              color: geofence.isActive ? '#3b82f6' : '#9ca3af',
              fillColor: geofence.isActive ? '#3b82f6' : '#9ca3af',
              fillOpacity: 0.1,
              weight: 2,
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm">{geofence.name}</h3>
                <p className="text-xs">Radius: {geofence.radiusM}m</p>
                <p className="text-xs">
                  Status:{' '}
                  <span
                    className={`px-2 py-0.5 rounded ${
                      geofence.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {geofence.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs z-[1000]">
        <h4 className="font-bold mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Rented</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Moving</span>
          </div>
        </div>
      </div>

      {/* Add pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
