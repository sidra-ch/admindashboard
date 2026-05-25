'use client';

import { use, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../../../../../lib/api-client';
import { formatCurrency, formatDateTime } from '../../../../../../lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Button } from '../../../../../../components/ui/button';
import { Badge } from '../../../../../../components/ui/badge';
import { ArrowLeft, Calendar as CalendarIcon, Plus, Wrench, FileText, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarEvent } from '../../../../../../types/calendar';

// Dynamically import FullCalendar React component only (plugins are plain objects, not components)
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });

export default function CarCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Calculate date range (60 days) — use day-level strings so the cache key is
  // stable for the whole day and TanStack Query can return cached data on revisit.
  const { startStr, endStr } = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 15);
    const end = new Date();
    end.setDate(end.getDate() + 45);
    return {
      startStr: start.toISOString().split('T')[0],
      endStr: end.toISOString().split('T')[0],
    };
  }, []);

  const { data: car, isLoading } = useQuery({
    queryKey: ['car-calendar', id, startStr, endStr],
    queryFn: () =>
      apiClient<any>(`/cars/${id}/calendar?startDate=${startStr}&endDate=${endStr}`),
    staleTime: 5 * 60_000,
  });

  // Transform data to FullCalendar format
  const events = useMemo(() => {
    if (!car) return [];

    const calendarEvents: CalendarEvent[] = [];

    // Add bookings
    car.bookings?.forEach((booking: any) => {
      calendarEvents.push({
        id: `booking-${booking.id}`,
        title: `📅 Booked: ${booking.customer.firstName} ${booking.customer.lastName}`,
        start: booking.startDate,
        end: booking.endDate,
        backgroundColor: '#3b82f6',
        borderColor: '#1d4ed8',
        textColor: '#ffffff',
        extendedProps: {
          type: 'booking',
          status: booking.status,
          customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
          customerPhone: booking.customer.phone,
          customerEmail: booking.customer.email,
          totalAmount: booking.totalAmountCents / 100,
          data: booking,
        },
      });
    });

    // Add rentals
    car.rentals?.forEach((rental: any) => {
      const isOverdue = rental.status === 'OVERDUE';
      calendarEvents.push({
        id: `rental-${rental.id}`,
        title: `${isOverdue ? '⚠️ ' : '🚗 '}Rented: ${rental.customer.firstName} ${rental.customer.lastName}`,
        start: rental.pickupAt,
        end: rental.actualReturnAt || rental.expectedReturnAt,
        backgroundColor: isOverdue ? '#ef4444' : '#10b981',
        borderColor: isOverdue ? '#dc2626' : '#059669',
        textColor: '#ffffff',
        extendedProps: {
          type: 'rental',
          status: rental.status,
          customerName: `${rental.customer.firstName} ${rental.customer.lastName}`,
          customerPhone: rental.customer.phone,
          customerEmail: rental.customer.email,
          totalAmount: rental.totalAmountCents / 100,
          pendingAmount: rental.balanceDueCents / 100,
          paymentStatus: rental.balanceDueCents === 0 ? 'Paid' : 'Pending',
          data: rental,
        },
      });
    });

    // Add maintenance
    car.maintenanceJobs?.forEach((job: any) => {
      calendarEvents.push({
        id: `maintenance-${job.id}`,
        title: `🔧 Maintenance: ${job.type}`,
        start: job.scheduledAt,
        end: job.completedAt || new Date(new Date(job.scheduledAt).getTime() + 24 * 60 * 60 * 1000),
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        textColor: '#ffffff',
        extendedProps: {
          type: 'maintenance',
          status: job.status,
          description: job.description,
          data: job,
        },
      });
    });

    return calendarEvents;
  }, [car]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-96 gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary"
        />
        <div className="text-muted-foreground">Loading calendar...</div>
      </motion.div>
    );
  }

  if (!car) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center h-96"
      >
        <div className="text-muted-foreground">Car not found</div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="transition-all hover:scale-110"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold flex items-center gap-2"
          >
            <Sparkles className="h-6 w-6 text-primary" />
            {car.brand} {car.model}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground mt-1"
          >
            {car.registrationNumber} • {car.category?.name || 'No Category'} • {car.branch.name}
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <Badge variant={car.status === 'AVAILABLE' ? 'success' : 'default'}>{car.status}</Badge>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex flex-wrap gap-2"
      >
        {[
          { href: `/dashboard/rentals/bookings?carId=${id}`, icon: Plus, label: 'Create Booking', delay: 0.25 },
          { href: `/dashboard/rentals/active?carId=${id}`, icon: FileText, label: 'Start Rental', delay: 0.3, variant: 'outline' as const },
          { href: `/dashboard/maintenance/new?carId=${id}`, icon: Wrench, label: 'Schedule Maintenance', delay: 0.35, variant: 'outline' as const },
        ].map((action) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: action.delay, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant={action.variant || 'default'} asChild className="shadow-sm hover:shadow-md transition-shadow">
              <Link href={action.href}>
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Link>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="border-border/50 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {[
                { color: 'bg-blue-500', label: 'Booked', delay: 0.35 },
                { color: 'bg-green-500', label: 'Active Rental', delay: 0.4 },
                { color: 'bg-red-500', label: 'Overdue', delay: 0.45 },
                { color: 'bg-orange-500', label: 'Maintenance', delay: 0.5 },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: item.delay, type: 'spring', stiffness: 200 }}
                  className="flex items-center gap-2"
                >
                  <div className={`h-4 w-4 rounded ${item.color} shadow-sm`} />
                  <span>{item.label}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="border-border/50 shadow-lg overflow-hidden">
          <CardContent className="pt-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="calendar-container"
            >
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={events}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                height="auto"
                eventClick={(info) => {
                  setSelectedEvent(info.event.extendedProps);
                }}
                dateClick={(info) => {
                  console.log('Date clicked:', info.dateStr);
                }}
              />
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedEvent(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.25 }}
              className="fixed bottom-4 right-4 w-96 z-50"
            >
              <Card className="shadow-2xl border-border/50 bg-background/95 backdrop-blur-xl">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <CardTitle className="text-base">
                        {selectedEvent.type === 'booking' && '📅 Booking Details'}
                        {selectedEvent.type === 'rental' && '🚗 Rental Details'}
                        {selectedEvent.type === 'maintenance' && '🔧 Maintenance Details'}
                      </CardTitle>
                    </motion.div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEvent(null)}
                      className="hover:rotate-90 transition-transform duration-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm pt-4">
                  {selectedEvent.customerName && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <div className="text-muted-foreground text-xs">Customer</div>
                      <div className="font-medium">{selectedEvent.customerName}</div>
                      {selectedEvent.customerPhone && <div className="text-xs text-muted-foreground">{selectedEvent.customerPhone}</div>}
                    </motion.div>
                  )}
                  {selectedEvent.description && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-muted-foreground text-xs">Description</div>
                      <div className="font-medium">{selectedEvent.description}</div>
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="text-muted-foreground text-xs">Status</div>
                    <Badge variant="default" className="mt-1">{selectedEvent.status}</Badge>
                  </motion.div>
                  {selectedEvent.totalAmount && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="text-muted-foreground text-xs">Total Amount</div>
                      <div className="font-medium">{formatCurrency(selectedEvent.totalAmount * 100)}</div>
                    </motion.div>
                  )}
                  {selectedEvent.pendingAmount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <div className="text-muted-foreground text-xs">Pending Amount</div>
                      <div className="font-medium text-destructive">{formatCurrency(selectedEvent.pendingAmount * 100)}</div>
                    </motion.div>
                  )}
                  {selectedEvent.paymentStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="text-muted-foreground text-xs">Payment Status</div>
                      <Badge variant={selectedEvent.paymentStatus === 'Paid' ? 'success' : 'warning'} className="mt-1">
                        {selectedEvent.paymentStatus}
                      </Badge>
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="pt-2"
                  >
                    <Button
                      size="sm"
                      className="w-full transition-all hover:scale-105"
                      asChild
                    >
                      <Link href={`/dashboard/${selectedEvent.type === 'maintenance' ? 'maintenance' : 'rentals'}/${selectedEvent.data.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="grid gap-4 md:grid-cols-3"
      >
        {[
          { title: 'Upcoming Bookings', value: events.filter((e) => e.extendedProps?.type === 'booking').length, delay: 0.85 },
          { title: 'Active Rentals', value: events.filter((e) => e.extendedProps?.type === 'rental').length, delay: 0.9 },
          { title: 'Maintenance Jobs', value: events.filter((e) => e.extendedProps?.type === 'maintenance').length, delay: 0.95 },
        ].map((stat) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: stat.delay + 0.1, type: 'spring', stiffness: 300 }}
                  className="text-2xl font-bold"
                >
                  {stat.value}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <style jsx global>{`
        .calendar-container .fc {
          font-family: inherit;
        }
        .calendar-container .fc-theme-standard td,
        .calendar-container .fc-theme-standard th {
          border-color: hsl(var(--border));
        }
        .calendar-container .fc-scrollgrid {
          border-color: hsl(var(--border));
        }
        .calendar-container .fc-col-header-cell {
          background: hsl(var(--muted));
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .calendar-container .fc-datagrid-cell {
          background: hsl(var(--background));
        }
        .calendar-container .fc-event {
          border-radius: 6px;
          border-width: 1px;
          font-size: 0.875rem;
          padding: 2px 4px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(0);
        }
        .calendar-container .fc-event:hover {
          opacity: 0.95;
          cursor: pointer;
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 10;
        }
        .calendar-container .fc-daygrid-event {
          margin: 1px 2px;
        }
        .calendar-container .fc-button {
          transition: all 0.2s ease;
        }
        .calendar-container .fc-button:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
