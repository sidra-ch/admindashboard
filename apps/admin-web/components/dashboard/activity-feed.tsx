'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  RotateCcw,
  ShieldAlert,
  TruckIcon,
  Wrench,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ActivityEvent = {
  id: string;
  type: 'booking' | 'payment' | 'overdue' | 'return' | 'maintenance' | 'completed' | 'alert';
  title: string;
  subtitle: string;
  time: string; // ISO string
};

// ── Icon + color map ──────────────────────────────────────────────────────────
const META = {
  booking:     { Icon: TruckIcon,     bg: 'bg-blue-500/15',    text: 'text-blue-600    dark:text-blue-400'    },
  payment:     { Icon: CreditCard,    bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  overdue:     { Icon: AlertTriangle, bg: 'bg-red-500/15',     text: 'text-red-600     dark:text-red-400'     },
  return:      { Icon: RotateCcw,     bg: 'bg-violet-500/15',  text: 'text-violet-600  dark:text-violet-400'  },
  maintenance: { Icon: Wrench,        bg: 'bg-amber-500/15',   text: 'text-amber-600   dark:text-amber-400'   },
  completed:   { Icon: CheckCircle2,  bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  alert:       { Icon: ShieldAlert,   bg: 'bg-rose-500/15',    text: 'text-rose-600    dark:text-rose-400'    },
} satisfies Record<ActivityEvent['type'], { Icon: React.FC<{ className?: string }>; bg: string; text: string }>;

// ── Relative time ─────────────────────────────────────────────────────────────
function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 2)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
        <CheckCircle2 className="size-8 opacity-30" />
        <p>All clear — no recent activity</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {/* Vertical timeline line */}
      <span className="pointer-events-none absolute left-[19px] top-2 bottom-2 w-px bg-border/60" aria-hidden />

      {events.map((event, i) => {
        const { Icon, bg, text } = META[event.type];
        return (
          <motion.li
            key={event.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex gap-4 pb-5 last:pb-0"
          >
            {/* Icon dot */}
            <div className={cn(
              'relative z-10 flex size-[38px] shrink-0 items-center justify-center rounded-xl',
              bg,
            )}>
              <Icon className={cn('size-4', text)} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-1.5">
              <p className="text-sm font-medium leading-tight">{event.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{event.subtitle}</p>
            </div>

            {/* Time */}
            <span className="shrink-0 pt-1.5 text-xs text-muted-foreground">{relativeTime(event.time)}</span>
          </motion.li>
        );
      })}
    </ol>
  );
}
