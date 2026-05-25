export interface CalendarEvent {
  id: string;
  resourceId?: string;
  title: string;
  start: Date | string;
  end: Date | string;
  backgroundColor: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    type: 'booking' | 'rental' | 'maintenance';
    status?: string;
    customerName?: string;
    customerPhone?: string;
    totalAmount?: number;
    pendingAmount?: number;
    paymentStatus?: string;
    [key: string]: any;
  };
}

export interface CalendarResource {
  id: string;
  title: string;
  extendedProps?: {
    brand?: string;
    model?: string;
    registrationNumber?: string;
    status?: string;
    [key: string]: any;
  };
}

export interface AvailabilityCheckResult {
  available: boolean;
  reason?: string;
  conflict?: {
    type: 'booking' | 'rental' | 'maintenance';
    id: string;
    startAt: string;
    endAt: string;
    customerName?: string;
    status?: string;
    description?: string;
  };
  nextAvailableAfter?: string;
}
