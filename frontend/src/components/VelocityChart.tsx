import React from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { TrendingUp, ArrowUp } from 'lucide-react';

export const VelocityChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <ChartContainer title="Production Trend">
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-slate-400">No data available</p>
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
      title="Production Trend"
      footer={
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-indigo-600" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Growth Trend</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <ArrowUp size={12} className={isPositive ? 'text-emerald-600' : 'text-red-600'} />
            <span className={`text-xs font-black tracking-tight ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
              {isPositive ? '+' : ''}{growthPercent}%
            </span>
          </div>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 20, left: -15, bottom: 20 }}
        >
          <defs>
            <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="velocityLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
            opacity={0.5}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
            angle={data.length > 6 ? -45 : 0}
            textAnchor={data.length > 6 ? 'end' : 'middle'}
            height={data.length > 6 ? 60 : 30}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
            width={35}
          />
          <Tooltip
            cursor={{
              stroke: '#e2e8f0',
              strokeWidth: 1,
              opacity: 0.5
            }}
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
              fontWeight: '600',
              padding: '10px 12px'
            }}
            formatter={(value) => {
              return [`${typeof value === 'number' ? value.toLocaleString() : value}`, 'Count'];
            }}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={3}
            fill="url(#velocityGradient)"
            isAnimationActive={true}
            animationDuration={1000}
            dot={false}
            activeDot={{
              r: 5,
              fill: '#6366f1',
              stroke: '#fff',
              strokeWidth: 2
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};