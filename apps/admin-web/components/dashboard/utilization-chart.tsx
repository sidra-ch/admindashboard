'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

type StatusItem = { label: string; value: number };

const STATUS_META: Record<string, { color: string; bg: string; dot: string }> = {
  Available:   { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/12', dot: 'bg-emerald-500' },
  Rented:      { color: 'text-blue-600    dark:text-blue-400',    bg: 'bg-blue-500/12',    dot: 'bg-blue-500'    },
  Maintenance: { color: 'text-amber-600   dark:text-amber-400',   bg: 'bg-amber-500/12',   dot: 'bg-amber-500'   },
  Reserved:    { color: 'text-violet-600  dark:text-violet-400',  bg: 'bg-violet-500/12',  dot: 'bg-violet-500'  },
};
const PALETTE = ['var(--success)', 'var(--primary)', 'var(--warning)', 'var(--muted-foreground)'];

const fallbackData: StatusItem[] = [
  { label: 'Available',   value: 221 },
  { label: 'Rented',      value: 184 },
  { label: 'Maintenance', value:  41 },
  { label: 'Reserved',    value:  54 },
];

export function UtilizationChart({ data = fallbackData }: { data?: StatusItem[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const utilization = total > 0
    ? Math.round(((data.find(d => d.label === 'Rented')?.value ?? 0) / total) * 100)
    : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Fleet utilization</CardTitle>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{utilization}%</span> utilization rate &bull; {total} vehicles total
        </p>
      </CardHeader>
      <CardContent>
        {/* Donut */}
        <div className="relative h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={82}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={entry.label} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  fontSize: 12,
                }}
                formatter={(value: number, _n, item) => [
                  `${value} vehicles (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                  item.payload.label,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold">{utilization}%</p>
            <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">In Use</p>
          </div>
        </div>

        {/* Legend rows with mini progress bars */}
        <div className="mt-3 space-y-2.5">
          {data.map((item, i) => {
            const meta = STATUS_META[item.label];
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span className={cn('flex size-[7px] shrink-0 rounded-full', meta?.dot ?? 'bg-muted-foreground')} />
                <span className="w-24 text-xs text-muted-foreground">{item.label}</span>
                {/* Progress bar */}
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%`, backgroundColor: PALETTE[i % PALETTE.length] }}
                  />
                </div>
                <span className={cn('w-8 text-right text-xs font-semibold', meta?.color ?? 'text-muted-foreground')}>
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

