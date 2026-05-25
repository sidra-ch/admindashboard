import {
  BarChart3,
  Bell,
  BrainCircuit,
  Calendar,
  CarFront,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  MapPinned,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react';

export const sidebarSections = [
  {
    title: 'Command Center',
    items: [
      { title: 'Dashboard',         href: '/dashboard',                    icon: Gauge        },
      { title: 'Operations',        href: '/dashboard/operations',         icon: LayoutDashboard },
    ],
  },
  {
    title: 'Fleet Intelligence',
    items: [
      { title: 'Vehicles',          href: '/dashboard/fleet/cars',         icon: CarFront     },
      { title: 'Maintenance',       href: '/dashboard/maintenance',        icon: Wrench       },
      { title: 'Documents',         href: '/dashboard/documents',          icon: FileText     },
      { title: 'Live Tracking',     href: '/dashboard/tracking/live-map',  icon: MapPinned    },
    ],
  },
  {
    title: 'Bookings & Rentals',
    items: [
      { title: 'Calendar',          href: '/dashboard/rentals/calendar',   icon: Calendar     },
      { title: 'Active Rentals',    href: '/dashboard/rentals/active',     icon: ClipboardList },
      { title: 'All Bookings',      href: '/dashboard/rentals/bookings',   icon: ClipboardList },
    ],
  },
  {
    title: 'Finance',
    items: [
      { title: 'Payments',          href: '/dashboard/payments',           icon: CreditCard   },
      { title: 'Revenue Analytics', href: '/dashboard/payments/revenue',   icon: TrendingUp   },
      { title: 'Reports',           href: '/dashboard/reports',            icon: BarChart3    },
    ],
  },
  {
    title: 'CRM',
    items: [
      { title: 'Customers',         href: '/dashboard/customers',          icon: Users        },
      { title: 'Notifications',     href: '/dashboard/notifications',      icon: Bell         },
    ],
  },
  {
    title: 'Administration',
    items: [
      { title: 'Staff & Security',  href: '/dashboard/staff/users',        icon: ShieldCheck  },
      { title: 'Audit Logs',        href: '/dashboard/audit-logs',         icon: History      },
      { title: 'Settings',          href: '/dashboard/settings/company',   icon: Settings     },
    ],
  },
] as const;

