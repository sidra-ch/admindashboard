'use client';

import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

// ── Animated number counter ──────────────────────────────────────────────────
function useAnimatedNumber(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1300;
    const raf = requestAnimationFrame(function step(ts) {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
      setValue(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

// ── Color tokens ──────────────────────────────────────────────────────────────
type KpiColor = 'blue' | 'emerald' | 'violet' | 'red' | 'amber' | 'cyan' | 'rose' | 'indigo' | 'default';

const colorMap: Record<KpiColor, { icon: string; badge: { up: string; down: string } }> = {
  blue:    { icon: 'bg-blue-500/15   text-blue-600   dark:text-blue-400',   badge: { up: 'bg-blue-500/12   text-blue-700   dark:text-blue-300',   down: 'bg-red-500/12  text-red-700  dark:text-red-300'  } },
  emerald: { icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', badge: { up: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', down: 'bg-red-500/12  text-red-700  dark:text-red-300'  } },
  violet:  { icon: 'bg-violet-500/15  text-violet-600  dark:text-violet-400',  badge: { up: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', down: 'bg-red-500/12  text-red-700  dark:text-red-300'  } },
  red:     { icon: 'bg-red-500/15     text-red-600     dark:text-red-400',     badge: { up: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', down: 'bg-red-500/12  text-red-700  dark:text-red-300'  } },
  amber:   { icon: 'bg-amber-500/15   text-amber-600   dark:text-amber-400',   badge: { up: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', down: 'bg-amber-500/12 text-amber-700 dark:text-amber-300' } },
  cyan:    { icon: 'bg-cyan-500/15    text-cyan-600    dark:text-cyan-400',    badge: { up: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', down: 'bg-red-500/12  text-red-700  dark:text-red-300'  } },
  rose:    { icon: 'bg-rose-500/15    text-rose-600    dark:text-rose-400',    badge: { up: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', down: 'bg-rose-500/12  text-rose-700  dark:text-rose-300'  } },
  indigo:  { icon: 'bg-indigo-500/15  text-indigo-600  dark:text-indigo-400',  badge: { up: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', down: 'bg-red-500/12  text-red-700  dark:text-red-300'  } },
  default: { icon: 'bg-primary/12     text-primary',                           badge: { up: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', down: 'bg-red-500/12  text-red-700  dark:text-red-300'  } },
};

// ── Props ─────────────────────────────────────────────────────────────────────
export interface KpiCardProps {
  title: string;
  /** Numeric value – will be animated from 0 to target. Ignored when displayValue is set. */
  numericValue?: number;
  /** Formatted string override (e.g. currency). Skips animated counter. */
  displayValue?: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color?: KpiColor;
  /** Prefix shown before the number (e.g. "$") */
  prefix?: string;
  /** Suffix shown after the number (e.g. "%") */
  suffix?: string;
  /** Live green dot indicator */
  isLive?: boolean;
  /** Framer Motion stagger delay in seconds */
  delay?: number;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function KpiCard({
  title,
  numericValue = 0,
  displayValue,
  change,
  trend,
  icon: Icon,
  color = 'default',
  prefix = '',
  suffix = '',
  isLive = false,
  delay = 0,
  className,
}: KpiCardProps) {
  const animated = useAnimatedNumber(numericValue);
  const { icon: iconCls, badge } = colorMap[color];
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;
  const badgeCls = trend === 'up' ? badge.up : badge.down;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group relative overflow-hidden rounded-[1.35rem] border bg-card/80 p-5 backdrop-blur-xl',
        'transition-all duration-300 hover:-translate-y-[3px] hover:shadow-2xl hover:shadow-black/8 cursor-default',
        className,
      )}
    >
      {/* Subtle inner shimmer on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[1.35rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'radial-gradient(circle at 70% 20%, color-mix(in oklab, white 7%, transparent), transparent 60%)' }}
      />

      <div className="relative flex items-start justify-between gap-3">
        {/* Left: text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {title}
            </p>
            {isLive && (
              <span className="flex size-[7px] rounded-full bg-emerald-500 animate-live-blink ring-[3px] ring-emerald-500/20" />
            )}
          </div>

          <p className="mt-2.5 text-[2rem] font-bold leading-none tracking-tight">
            {displayValue ?? `${prefix}${animated.toLocaleString()}${suffix}`}
          </p>

          <div className="mt-3">
            {trend !== 'neutral' ? (
              <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-semibold', badgeCls)}>
                <TrendIcon className="size-3" />
                {change}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{change}</span>
            )}
          </div>
        </div>

        {/* Right: icon */}
        <div className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
          iconCls,
        )}>
          <Icon className="size-5" />
        </div>
      </div>
    </motion.div>
  );
}

