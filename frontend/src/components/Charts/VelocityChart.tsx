import React from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { TrendingUp, ArrowUp, ArrowUpRight } from 'lucide-react';

export const VelocityChart: React.FC<{
  title?: string;
  data: any[];
  onViewDetails?: () => void;
}> = ({ title = "Performance Profile", data, onViewDetails }) => {
  if (!data || data.length === 0) {
    return (
      <ChartContainer title={title}>
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-muted-foreground font-medium">No activity recorded</p>
        </div>
      </ChartContainer>
    );
  }

  // Calculate growth percentage
  const latestValue = data[data.length - 1]?.count || 0;
  const previousValue = data[Math.max(0, data.length - 8)]?.count || latestValue;
  const growthPercent = previousValue > 0
    ? (((latestValue - previousValue) / previousValue) * 100).toFixed(1)
    : '0';
  const isPositive = parseFloat(growthPercent) >= 0;

  return (
    <ChartContainer
      title={title}
      footer={
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System Status</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold tabular-nums tracking-wider ${isPositive
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-red-500/10 text-red-600'
              }`}>
              {isPositive ? '▲' : '▼'} {growthPercent}%
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
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00928a" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#00928a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="hsl(var(--border))"
            opacity={0.5}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
          />
          <Tooltip
            cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              fontSize: '10px',
              fontWeight: '700',
              color: 'hsl(var(--foreground))',
              padding: '8px 12px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
            }}
            itemStyle={{ color: '#00928a' }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#00928a"
            strokeWidth={2}
            fill="url(#velocityGradient)"
            isAnimationActive={true}
            animationDuration={1500}
            dot={false}
            activeDot={{
              r: 4,
              fill: '#00928a',
              stroke: '#fff',
              strokeWidth: 2
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
