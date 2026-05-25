'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Brain, Lightbulb, Sparkles, TrendingUp, TriangleAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
export type AiInsight = {
  id: string;
  type: 'opportunity' | 'warning' | 'info' | 'trend';
  headline: string;
  detail: string;
  action?: string;
};

const META = {
  opportunity: { Icon: Lightbulb,   bg: 'bg-emerald-500/12', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', badge: 'Opportunity' },
  warning:     { Icon: TriangleAlert,bg: 'bg-amber-500/12',   border: 'border-amber-500/20',   text: 'text-amber-600  dark:text-amber-400',   badge: 'Action needed' },
  info:        { Icon: Brain,        bg: 'bg-blue-500/12',    border: 'border-blue-500/20',    text: 'text-blue-600   dark:text-blue-400',    badge: 'Insight'       },
  trend:       { Icon: TrendingUp,   bg: 'bg-violet-500/12',  border: 'border-violet-500/20',  text: 'text-violet-600 dark:text-violet-400',  badge: 'Trend'         },
} satisfies Record<AiInsight['type'], { Icon: React.FC<{ className?: string }>; bg: string; border: string; text: string; badge: string }>;

// ── Single insight card ───────────────────────────────────────────────────────
function InsightCard({ insight, delay }: { insight: AiInsight; delay: number }) {
  const { Icon, bg, border, text, badge } = META[insight.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group flex gap-3 rounded-2xl border p-4 transition-all duration-200 hover:shadow-md cursor-default',
        bg, border,
      )}
    >
      <div className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl', bg)}>
        <Icon className={cn('size-4', text)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide', bg, text)}>
            {badge}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold leading-snug">{insight.headline}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{insight.detail}</p>
        {insight.action && (
          <button className={cn(
            'mt-2 flex items-center gap-1 text-xs font-medium transition-colors hover:underline',
            text,
          )}>
            {insight.action}
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function AiInsightsPanel({ insights }: { insights: AiInsight[] }) {
  return (
    <div className="rounded-[1.35rem] border bg-card/80 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-xl bg-violet-500/15">
          <Sparkles className="size-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-semibold">AI Insights</p>
          <p className="text-[0.68rem] text-muted-foreground">Powered by fleet intelligence</p>
        </div>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-live-blink" />
          Live
        </span>
      </div>

      {insights.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No insights available — check back soon.</p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
          {insights.map((ins, i) => (
            <InsightCard key={ins.id} insight={ins} delay={i * 0.08} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Insight generator (derive from dashboard data) ────────────────────────────
export function deriveInsights(kpis: {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  carsInMaintenance: number;
  overdueRentals: number;
  pendingPayments: number;
  monthlyRevenueCents: number;
  maintenanceCostThisMonthCents: number;
  carsReturningToday: number;
}, documentExpiries: Array<{ registrationNumber: string; insuranceExpiry: string | null }>): AiInsight[] {
  const insights: AiInsight[] = [];

  // Fleet utilization
  const utilPct = kpis.totalCars > 0 ? Math.round((kpis.rentedCars / kpis.totalCars) * 100) : 0;
  if (utilPct >= 85) {
    insights.push({
      id: 'util-high',
      type: 'opportunity',
      headline: `Fleet utilization at ${utilPct}% — near capacity`,
      detail: 'Consider adding vehicles or increasing rates for peak demand periods.',
      action: 'Review pricing',
    });
  } else if (utilPct < 50) {
    insights.push({
      id: 'util-low',
      type: 'info',
      headline: `${kpis.availableCars} vehicles sitting idle`,
      detail: 'Fleet utilization is below 50%. Promotions or dynamic pricing could boost bookings.',
      action: 'Launch promotion',
    });
  } else {
    insights.push({
      id: 'util-ok',
      type: 'trend',
      headline: `Healthy fleet utilization at ${utilPct}%`,
      detail: `${kpis.rentedCars} of ${kpis.totalCars} vehicles are currently rented — within optimal range.`,
    });
  }

  // Overdue rentals
  if (kpis.overdueRentals > 0) {
    insights.push({
      id: 'overdue',
      type: 'warning',
      headline: `${kpis.overdueRentals} overdue rental${kpis.overdueRentals > 1 ? 's' : ''} require attention`,
      detail: 'Late returns affect availability and customer satisfaction. Consider automated SMS follow-ups.',
      action: 'View overdue list',
    });
  }

  // Maintenance cost vs revenue
  const maintPct = kpis.monthlyRevenueCents > 0
    ? Math.round((kpis.maintenanceCostThisMonthCents / kpis.monthlyRevenueCents) * 100)
    : 0;
  if (maintPct > 20) {
    insights.push({
      id: 'maint-cost',
      type: 'warning',
      headline: `Maintenance is ${maintPct}% of revenue this month`,
      detail: 'High maintenance-to-revenue ratio. Review vehicle servicing schedules and costs.',
      action: 'View maintenance',
    });
  }

  // Insurance expiry
  const expiringSoon = documentExpiries.filter((d) => {
    if (!d.insuranceExpiry) return false;
    const days = (new Date(d.insuranceExpiry).getTime() - Date.now()) / 86_400_000;
    return days >= 0 && days <= 30;
  });
  if (expiringSoon.length > 0) {
    insights.push({
      id: 'insurance',
      type: 'warning',
      headline: `${expiringSoon.length} vehicle${expiringSoon.length > 1 ? 's' : ''} with insurance expiring in 30 days`,
      detail: `Including: ${expiringSoon.slice(0, 2).map(d => d.registrationNumber).join(', ')}${expiringSoon.length > 2 ? ' and more' : ''}.`,
      action: 'View documents',
    });
  }

  // Pending payments
  if (kpis.pendingPayments > 3) {
    insights.push({
      id: 'pending-pay',
      type: 'info',
      headline: `${kpis.pendingPayments} payments pending collection`,
      detail: 'Send payment reminders to reduce outstanding balances and improve cash flow.',
      action: 'View payments',
    });
  }

  return insights.slice(0, 4); // max 4 insights
}
