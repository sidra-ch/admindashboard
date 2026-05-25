'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface Car {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'BOOKED';
  latitude: number;
  longitude: number;
  speed?: number;
  ignition?: boolean;
  fuelLevel?: number;
  lastUpdated?: string;
}

interface GoogleTrackingMapProps {
  cars: Car[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function GoogleTrackingMap({ cars, center = { lat: -33.8688, lng: 151.2093 }, zoom = 12 }: GoogleTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API key not found');
      return;
    }

    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || googleMapRef.current) return;

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });
  }, [isLoaded, center, zoom]);

  // Update markers when cars change
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return;

    const map = googleMapRef.current;
    const bounds = new google.maps.LatLngBounds();

    // Remove markers for cars that no longer exist
    const currentCarIds = new Set(cars.map((car) => car.id));
    markersRef.current.forEach((marker, carId) => {
      if (!currentCarIds.has(carId)) {
        marker.setMap(null);
        markersRef.current.delete(carId);
      }
    });

    // Add or update markers
    cars.forEach((car) => {
      const position = { lat: car.latitude, lng: car.longitude };
      bounds.extend(position);

      let marker = markersRef.current.get(car.id);

      if (!marker) {
        // Create new marker
        marker = new google.maps.Marker({
          position,
          map,
          title: `${car.make} ${car.model} (${car.registrationNumber})`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: getStatusColor(car.status),
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(car),
        });

        marker.addListener('click', () => {
          // Close all other info windows
          markersRef.current.forEach((m) => {
            const iw = (m as any).infoWindow;
            if (iw) iw.close();
          });
          infoWindow.open(map, marker);
        });

        (marker as any).infoWindow = infoWindow;
        markersRef.current.set(car.id, marker);
      } else {
        // Update existing marker
        marker.setPosition(position);
        marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: getStatusColor(car.status),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        });

        // Update info window content
        const infoWindow = (marker as any).infoWindow;
        if (infoWindow) {
          infoWindow.setContent(createInfoWindowContent(car));
        }
      }
    });

    // Fit bounds to show all markers
    if (cars.length > 0) {
      map.fitBounds(bounds);
    }
  }, [cars, isLoaded]);

  function getStatusColor(status: string): string {
    switch (status) {
      case 'AVAILABLE':
        return '#22c55e'; // green
      case 'RENTED':
        return '#3b82f6'; // blue
      case 'MAINTENANCE':
        return '#f59e0b'; // orange
      case 'BOOKED':
        return '#8b5cf6'; // purple
      default:
        return '#6b7280'; // gray
    }
  }

  function createInfoWindowContent(car: Car): string {
    return `
      <div style="padding: 8px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
          ${car.make} ${car.model}
        </h3>
        <div style="font-size: 12px; color: #666;">
          <div style="margin-bottom: 4px;">
            <strong>Rego:</strong> ${car.registrationNumber}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Status:</strong> 
            <span style="
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              background: ${getStatusColor(car.status)}20;
              color: ${getStatusColor(car.status)};
              font-weight: 500;
            ">
              ${car.status}
            </span>
          </div>
          ${car.speed !== undefined ? `
            <div style="margin-bottom: 4px;">
              <strong>Speed:</strong> ${car.speed} km/h
            </div>
          ` : ''}
          ${car.ignition !== undefined ? `
            <div style="margin-bottom: 4px;">
              <strong>Ignition:</strong> ${car.ignition ? 'ON' : 'OFF'}
            </div>
          ` : ''}
          ${car.fuelLevel !== undefined ? `
            <div style="margin-bottom: 4px;">
              <strong>Fuel:</strong> ${car.fuelLevel}%
            </div>
          ` : ''}
          ${car.lastUpdated ? `
            <div style="margin-top: 8px; font-size: 11px; color: #999;">
              Updated: ${new Date(car.lastUpdated).toLocaleString()}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p className="font-semibold">Error loading map</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p>Loading Google Maps...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={mapRef} className="w-full h-[600px] rounded-lg border shadow-sm" />
      
      {/* Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Car Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span className="text-sm">Rented</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500" />
            <span className="text-sm">Maintenance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500" />
            <span className="text-sm">Booked</span>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{cars.length}</div>
          <div className="text-sm text-muted-foreground">Total Cars</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {cars.filter((c) => c.status === 'AVAILABLE').length}
          </div>
          <div className="text-sm text-muted-foreground">Available</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {cars.filter((c) => c.status === 'RENTED').length}
          </div>
          <div className="text-sm text-muted-foreground">Rented</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {cars.filter((c) => c.status === 'MAINTENANCE').length}
          </div>
          <div className="text-sm text-muted-foreground">Maintenance</div>
        </Card>
      </div>
    </div>
  );
}
