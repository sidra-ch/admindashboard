'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../../lib/api-client';
import { formatCurrency, formatDate, formatDateTime } from '../../../../../lib/formatters';
import {
  ArrowLeft,
  Calendar,
  Car,
  Clock,
  DollarSign,
  Gauge,
  MapPin,
  Shield,
  Wrench,
  User,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/navigation';

const CARD: React.CSSProperties = {
  background: 'oklch(0.132 0.020 265 / 0.80)',
  border: '1px solid oklch(0.248 0.020 265)',
  backdropFilter: 'blur(16px)',
  borderRadius: '16px',
  padding: '1.5rem',
};

const STATUS_CFG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  AVAILABLE: {
    color: 'oklch(0.72 0.152 145)',
    bg: 'oklch(0.72 0.152 145 / 0.12)',
    icon: <CheckCircle2 size={13} />,
  },
  RENTED: {
    color: 'oklch(0.688 0.196 256)',
    bg: 'oklch(0.688 0.196 256 / 0.12)',
    icon: <Car size={13} />,
  },
  MAINTENANCE: {
    color: 'oklch(0.78 0.14 72)',
    bg: 'oklch(0.78 0.14 72 / 0.12)',
    icon: <Wrench size={13} />,
  },
  OUT_OF_SERVICE: {
    color: 'oklch(0.70 0.18 27)',
    bg: 'oklch(0.70 0.18 27 / 0.12)',
    icon: <AlertTriangle size={13} />,
  },
};

const RENTAL_STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'oklch(0.72 0.152 145)',
  COMPLETED: 'oklch(0.50 0.010 265)',
  OVERDUE: 'oklch(0.70 0.18 27)',
  CANCELLED: 'oklch(0.40 0.008 265)',
};

export default function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const carQuery = useQuery({
    queryKey: ['car', resolvedParams.id],
    queryFn: () => apiClient<any>(`/cars/${resolvedParams.id}`),
    staleTime: 2 * 60_000,
  });

  if (carQuery.isLoading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '3px solid oklch(0.248 0.020 265)',
            borderTopColor: 'oklch(0.688 0.196 256)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: 'oklch(0.50 0.010 265)', fontSize: '0.875rem' }}>Loading vehicle…</p>
      </div>
    );
  }

  if (carQuery.isError || !carQuery.data) {
    return (
      <div style={{ ...CARD, textAlign: 'center', color: 'oklch(0.70 0.18 27)' }}>
        Unable to load vehicle details.
      </div>
    );
  }

  const car = carQuery.data;
  const statusCfg = STATUS_CFG[car.status] ?? STATUS_CFG.AVAILABLE;

  return (
    <div style={{ minHeight: '100vh', background: 'oklch(0.082 0.018 265)', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'oklch(0.50 0.010 265)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          Back to Fleet
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, oklch(0.688 0.196 256), oklch(0.60 0.22 270))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Car size={26} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'oklch(0.95 0.010 265)', margin: 0 }}>
                {car.brand || car.make} {car.model}
              </h1>
              <p style={{ color: 'oklch(0.50 0.010 265)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                {car.registrationNumber}
                {car.category?.name ? ` · ${car.category.name}` : ''}
                {car.branch?.name ? ` · ${car.branch.name}` : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Status badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.875rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: statusCfg.color,
                background: statusCfg.bg,
                border: `1px solid ${statusCfg.color}`,
              }}
            >
              {statusCfg.icon}
              {car.status}
            </span>

            {/* View Calendar button */}
            <Link
              href={`/dashboard/fleet/cars/${resolvedParams.id}/calendar`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, oklch(0.688 0.196 256), oklch(0.60 0.22 270))',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              <Calendar size={15} />
              View Calendar
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Info cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Vehicle Info */}
          <div style={CARD}>
            <h2
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'oklch(0.688 0.196 256)',
                margin: '0 0 1.25rem 0',
              }}
            >
              Vehicle Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { icon: <DollarSign size={16} />, label: 'Daily Rate', value: formatCurrency(car.dailyRateCents) },
                { icon: <MapPin size={16} />, label: 'Branch', value: car.branch?.name ?? '—' },
                { icon: <Gauge size={16} />, label: 'Odometer', value: car.odometerKm != null ? `${car.odometerKm.toLocaleString()} km` : '—' },
                { icon: <Clock size={16} />, label: 'Year', value: car.year ?? '—' },
                {
                  icon: <Wrench size={16} />,
                  label: 'Next Service',
                  value: car.nextServiceDue ? formatDate(car.nextServiceDue) : 'Not scheduled',
                },
                {
                  icon: <Shield size={16} />,
                  label: 'Insurance Expiry',
                  value: car.insuranceExpiry ? formatDate(car.insuranceExpiry) : 'Not available',
                },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ color: 'oklch(0.688 0.196 256)', marginTop: '0.1rem', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'oklch(0.40 0.008 265)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'oklch(0.92 0.010 265)', fontWeight: 500, margin: '0.2rem 0 0' }}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rental History */}
          <div style={CARD}>
            <h2
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'oklch(0.688 0.196 256)',
                margin: '0 0 1.25rem 0',
              }}
            >
              Rental History
            </h2>
            {car.rentals?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {car.rentals.map((rental: any) => (
                  <div
                    key={rental.id}
                    style={{
                      background: 'oklch(0.10 0.018 265)',
                      border: '1px solid oklch(0.248 0.020 265)',
                      borderRadius: '10px',
                      padding: '0.875rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          background: 'oklch(0.688 0.196 256 / 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <User size={16} style={{ color: 'oklch(0.688 0.196 256)' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'oklch(0.92 0.010 265)', fontSize: '0.875rem', margin: 0 }}>
                          {rental.customer.firstName} {rental.customer.lastName}
                        </p>
                        <p style={{ color: 'oklch(0.50 0.010 265)', fontSize: '0.78rem', margin: '0.15rem 0 0' }}>
                          {formatDateTime(rental.pickupAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '0.25rem 0.625rem',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: RENTAL_STATUS_COLOR[rental.status] ?? 'oklch(0.50 0.010 265)',
                        background: `${RENTAL_STATUS_COLOR[rental.status] ?? 'oklch(0.50 0.010 265)'} / 0.12`,
                        border: `1px solid ${RENTAL_STATUS_COLOR[rental.status] ?? 'oklch(0.50 0.010 265)'}`,
                        flexShrink: 0,
                      }}
                    >
                      {rental.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'oklch(0.40 0.008 265)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                No rental history
              </p>
            )}
          </div>
        </div>

        {/* Right: Bookings */}
        <div style={CARD}>
          <h2
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'oklch(0.688 0.196 256)',
              margin: '0 0 1.25rem 0',
            }}
          >
            Upcoming Bookings
          </h2>
          {car.bookings?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {car.bookings.map((booking: any) => (
                <div
                  key={booking.id}
                  style={{
                    background: 'oklch(0.10 0.018 265)',
                    border: '1px solid oklch(0.248 0.020 265)',
                    borderRadius: '10px',
                    padding: '0.875rem 1rem',
                  }}
                >
                  <p style={{ fontWeight: 600, color: 'oklch(0.92 0.010 265)', fontSize: '0.875rem', margin: 0 }}>
                    {booking.customer.firstName} {booking.customer.lastName}
                  </p>
                  <p style={{ color: 'oklch(0.50 0.010 265)', fontSize: '0.78rem', margin: '0.25rem 0 0' }}>
                    {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '0.5rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'oklch(0.688 0.196 256)',
                      background: 'oklch(0.688 0.196 256 / 0.12)',
                      border: '1px solid oklch(0.688 0.196 256)',
                    }}
                  >
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'oklch(0.40 0.008 265)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
              No upcoming bookings
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
