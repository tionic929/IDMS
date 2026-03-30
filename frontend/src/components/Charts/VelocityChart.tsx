import React, { memo, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from './ChartContainer';

// --- Sub-components ---

const CustomTooltip = memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-md p-3 rounded-xl border border-border shadow-2xl pointer-events-none">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[11px] font-bold text-foreground">{entry.name}</span>
              </div>
              <span className="text-[11px] font-black text-primary">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
});

// --- Main Component ---

const VelocityChartComponent: React.FC<{
  title?: string;
  data: any[];
  onViewDetails?: () => void;
  isTransitioning?: boolean; 
}> = ({ title = "Performance Profile", data, onViewDetails }) => {
  
  // 1. Memoize Derived Data
  const growthStats = useMemo(() => {
    if (!data || data.length === 0) return { growthPercent: '0', isPositive: true };
    const latestValue = data[data.length - 1]?.count || 0;
    const previousValue = data[Math.max(0, data.length - 8)]?.count || latestValue;
    const percent = previousValue > 0
      ? (((latestValue - previousValue) / previousValue) * 100).toFixed(1)
      : '0';
    return {
      growthPercent: percent,
      isPositive: parseFloat(percent) >= 0
    };
  }, [data]);

  // 2. Memoize Static Config
  const chartMargin = useMemo(() => ({ top: 10, right: 10, left: -20, bottom: 0 }), []);
  const axisTickStyle = useMemo(() => ({ fontSize: 9, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }), []);
  const yAxisTickStyle = useMemo(() => ({ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }), []);

  if (!data || data.length === 0) {
    return (
      <ChartContainer title={title}>
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">No activity recorded</p>
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer
      title={title}
      footer={
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System Status</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold tabular-nums tracking-wider transition-colors ${growthStats.isPositive
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-red-500/10 text-red-600'
              }`}>
              {growthStats.isPositive ? '▲' : '▼'} {growthStats.growthPercent}%
            </div>
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="text-[10px] font-bold text-primary hover:text-primary/70 transition-all uppercase tracking-widest"
              >
                View details ↗
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="h-full w-full overflow-hidden relative">
        <ResponsiveContainer 
          width="100%" 
          height="100%" 
          debounce={50} // Debounce buffers the "Render Storm" during sidebar move
        >
          <AreaChart
            data={data}
            margin={chartMargin}
          >
            <defs>
              <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={axisTickStyle}
              dy={10}
              minTickGap={5}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={yAxisTickStyle}
            />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              content={<CustomTooltip />}
              isAnimationActive={false} // DISABLED: Fixes stuttering
            />
            <Area
              type="monotone"
              dataKey="count"
              name="Records"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#velocityGradient)"
              isAnimationActive={false} // DISABLED: Fixes stuttering
              dot={false}
              activeDot={{
                r: 4,
                fill: 'hsl(var(--primary))',
                stroke: 'hsl(var(--background))',
                strokeWidth: 2
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};

export const VelocityChart = memo(VelocityChartComponent);
