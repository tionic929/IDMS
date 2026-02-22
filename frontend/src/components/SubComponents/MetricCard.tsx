import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;        // bg-* class for tint
  chartData?: any[];
  trendLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const COLOR_MAP: Record<string, { stroke: string; ring: string; bar: string; text: string }> = {
  indigo: { stroke: '#6366f1', ring: 'ring-indigo-100', bar: 'bg-indigo-500', text: 'text-indigo-600' },
  emerald: { stroke: '#10b981', ring: 'ring-emerald-100', bar: 'bg-emerald-500', text: 'text-emerald-600' },
  amber: { stroke: '#f59e0b', ring: 'ring-amber-100', bar: 'bg-amber-500', text: 'text-amber-600' },
  blue: { stroke: '#3b82f6', ring: 'ring-blue-100', bar: 'bg-blue-500', text: 'text-blue-600' },
  violet: { stroke: '#8b5cf6', ring: 'ring-violet-100', bar: 'bg-violet-500', text: 'text-violet-600' },
  rose: { stroke: '#f43f5e', ring: 'ring-rose-100', bar: 'bg-rose-500', text: 'text-rose-600' },
};

function resolveColor(colorClass: string) {
  for (const key of Object.keys(COLOR_MAP)) {
    if (colorClass.includes(key)) return COLOR_MAP[key];
  }
  return { stroke: '#64748b', ring: 'ring-slate-100', bar: 'bg-slate-400', text: 'text-slate-600' };
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  chartData,
  trendLabel,
  trend = 'neutral',
}) => {
  const c = resolveColor(color);

  return (
    <div
      className={`relative bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col h-full
        transition-all duration-200 hover:shadow-md hover:border-zinc-300 group cursor-pointer`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${c.bar}`} />

      <div className="px-5 pt-5 pb-4 flex-1 flex flex-col">
        {/* Top row: label + icon */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">
            {title}
          </span>
          <div className={`w-8 h-8 rounded-lg ${c.ring} ring-1 flex items-center justify-center flex-shrink-0`}>
            <Icon size={15} style={{ color: c.stroke }} />
          </div>
        </div>

        {/* Value */}
        <div className="text-[28px] font-black text-zinc-900 tracking-tight leading-none mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {/* Trend label */}
        {trendLabel && (
          <div className="flex items-center gap-1 mt-1">
            {trend === 'up' && <TrendingUp size={11} className="text-emerald-500" />}
            {trend === 'down' && <TrendingDown size={11} className="text-red-500" />}
            <span className={`text-[10px] font-semibold ${trend === 'up' ? 'text-emerald-600'
                : trend === 'down' ? 'text-red-500'
                  : 'text-zinc-400'
              }`}>
              {trendLabel}
            </span>
          </div>
        )}

        {/* Sparkline */}
        {chartData && chartData.length > 0 && (
          <div className="h-12 w-full mt-auto pt-3 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`mc-grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c.stroke} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={c.stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={c.stroke}
                  strokeWidth={2}
                  fill={`url(#mc-grad-${title})`}
                  dot={false}
                  isAnimationActive
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bottom hover hint */}
      <div className="px-5 py-2 border-t border-zinc-100 bg-zinc-50/50">
        <span className={`text-[9px] font-bold uppercase tracking-widest ${c.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
          Click to expand ↗
        </span>
      </div>
    </div>
  );
};

export default MetricCard;