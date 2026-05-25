'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../../../lib/api-client';
import { formatCurrency, formatDateTime } from '../../../../lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, Filter, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import type { CalendarEvent, CalendarResource } from '../../../../types/calendar';

// Dynamically import FullCalendar React component only (plugins are plain objects, not components)
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });

export default function FleetCalendarPage() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate date range based on view
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (view === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    return { startDate: start, endDate: end };
  }, [currentDate, view]);

  const { data, isLoading } = useQuery({
    queryKey: ['fleet-calendar', startDate.toISOString(), endDate.toISOString()],
    queryFn: () =>
      apiClient<any>(
        `/cars/calendar/fleet?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&pageSize=100`,
      ),
  });

  // Transform data to FullCalendar format
  const { events, resources } = useMemo(() => {
    if (!data?.cars) return { events: [], resources: [] };

    const calendarEvents: CalendarEvent[] = [];
    const calendarResources: CalendarResource[] = [];

    data.cars.forEach((car: any) => {
      // Add car as resource
      calendarResources.push({
        id: car.id,
        title: `${car.brand} ${car.model} (${car.registrationNumber})`,
        extendedProps: {
          brand: car.brand,
          model: car.model,
          registrationNumber: car.registrationNumber,
          status: car.status,
          category: car.category?.name,
        },
      });

      // Add bookings
      car.bookings?.forEach((booking: any) => {
        calendarEvents.push({
          id: `booking-${booking.id}`,
          resourceId: car.id,
          title: `Booked: ${booking.customer.firstName} ${booking.customer.lastName}`,
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
            totalAmount: booking.totalAmountCents / 100,
          },
        });
      });

      // Add rentals
      car.rentals?.forEach((rental: any) => {
        const isOverdue = rental.status === 'OVERDUE';
        calendarEvents.push({
          id: `rental-${rental.id}`,
          resourceId: car.id,
          title: `${isOverdue ? '⚠️ ' : ''}Rented: ${rental.customer.firstName} ${rental.customer.lastName}`,
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
            totalAmount: rental.totalAmountCents / 100,
            pendingAmount: rental.balanceDueCents / 100,
            paymentStatus: rental.balanceDueCents === 0 ? 'Paid' : 'Pending',
          },
        });
      });

      // Add maintenance
      car.maintenanceJobs?.forEach((job: any) => {
        calendarEvents.push({
          id: `maintenance-${job.id}`,
          resourceId: car.id,
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
          },
        });
      });
    });

    return { events: calendarEvents, resources: calendarResources };
  }, [data]);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeText = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (view === 'week') {
      const weekStart = new Date(startDate);
      const weekEnd = new Date(endDate);
      return `${weekStart.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-AU', { year: 'numeric', month: 'long' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold flex items-center gap-2"
          >
            <Sparkles className="h-6 w-6 text-primary" />
            Fleet Calendar
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground mt-1"
          >
            Visual timeline of all bookings, rentals, and maintenance
          </motion.p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="border-border/50 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  className="transition-all hover:scale-105 hover:shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="transition-all hover:scale-105 hover:shadow-sm"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  className="transition-all hover:scale-105 hover:shadow-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <motion.div
                  key={getDateRangeText()}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-4 font-medium"
                >
                  {getDateRangeText()}
                </motion.div>
              </div>

              {/* View Selector */}
              <div className="flex items-center gap-2">
                <Select value={view} onValueChange={(v: any) => setView(v)}>
                  <SelectTrigger className="w-[120px] transition-all hover:border-primary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day View</SelectItem>
                    <SelectItem value="week">Week View</SelectItem>
                    <SelectItem value="month">Month View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
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
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="border-border/50 shadow-lg overflow-hidden">
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-96 gap-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary"
                  />
                  <div className="text-muted-foreground">Loading calendar...</div>
                </motion.div>
              ) : (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5 }}
                  className="calendar-container"
                >
                  <FullCalendar
                    plugins={[resourceTimelinePlugin]}
                    initialView={view === 'day' ? 'resourceTimelineDay' : view === 'week' ? 'resourceTimelineWeek' : 'resourceTimelineMonth'}
                    resources={resources}
                    events={events}
                    headerToolbar={false}
                    height="auto"
                    slotMinWidth={50}
                    resourceAreaWidth="200px"
                    resourceAreaHeaderContent="Cars"
                    eventClick={(info) => {
                      const props = info.event.extendedProps;
                      alert(`${props.type.toUpperCase()}\n\nCustomer: ${props.customerName || 'N/A'}\nStatus: ${props.status || 'N/A'}`);
                    }}
                    eventContent={(arg) => {
                      const props = arg.event.extendedProps;
                      return (
                        <div className="px-2 py-1 text-xs overflow-hidden">
                          <div className="font-medium truncate">{arg.event.title}</div>
                          {props.paymentStatus && (
                            <div className="text-[10px] opacity-90">{props.paymentStatus}</div>
                          )}
                        </div>
                      );
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="grid gap-4 md:grid-cols-4"
        >
          {[
            { title: 'Total Cars', value: data.total, delay: 0.55 },
            { title: 'Active Bookings', value: events.filter((e) => e.extendedProps?.type === 'booking').length, delay: 0.6 },
            { title: 'Active Rentals', value: events.filter((e) => e.extendedProps?.type === 'rental').length, delay: 0.65 },
            { title: 'Maintenance Jobs', value: events.filter((e) => e.extendedProps?.type === 'maintenance').length, delay: 0.7 },
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
      )}

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
        }
        .calendar-container .fc-datagrid-cell {
          background: hsl(var(--background));
        }
        .calendar-container .fc-event {
          border-radius: 4px;
          border-width: 1px;
          font-size: 0.75rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(0);
        }
        .calendar-container .fc-event:hover {
          opacity: 0.9;
          cursor: pointer;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}
