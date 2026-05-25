'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const fallbackData = [
  { month: 'Nov', revenue: 128000 },
  { month: 'Dec', revenue: 145000 },
  { month: 'Jan', revenue: 142000 },
  { month: 'Feb', revenue: 158000 },
  { month: 'Mar', revenue: 171000 },
  { month: 'Apr', revenue: 184000 },
  { month: 'May', revenue: 212000 },
];

function fmtK(v: number) {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v}`;
}

type DataItem = { month: string; revenue: number };

// Compute a 3-month moving average for the line overlay
function withTrend(data: DataItem[]) {
  return data.map((d, i) => {
    const slice = data.slice(Math.max(0, i - 2), i + 1);
    const avg = slice.reduce((s, x) => s + x.revenue, 0) / slice.length;
    return { ...d, trend: Math.round(avg) };
  });
}

export function RevenueChart({ data = fallbackData }: { data?: DataItem[] }) {
  const chartData = withTrend(data);
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle>Revenue trend</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">Monthly revenue vs. moving average</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary/70" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-px w-5 bg-amber-500" />
            Avg trend
          </span>
        </div>
      </CardHeader>
      <CardContent className="h-[280px] pb-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ left: -14, right: 6, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="revBarFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="var(--primary)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              tickFormatter={fmtK}
              tickLine={false}
              axisLine={false}
              width={46}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <Tooltip
              cursor={{ fill: 'color-mix(in oklab, var(--primary) 8%, transparent)', radius: 6 }}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                fontSize: 12,
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              }}
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`,
                name === 'trend' ? 'Moving avg' : 'Revenue',
              ]}
            />
            <Bar
              dataKey="revenue"
              fill="url(#revBarFill)"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
            <Line
              type="monotone"
              dataKey="trend"
              stroke="var(--warning)"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

