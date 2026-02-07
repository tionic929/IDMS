import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  chartData?: any[];
  trendLabel?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  chartData, 
  trendLabel 
}) => {
  const getChartColor = () => {
    if (color.includes('indigo')) return '#6366f1';
    if (color.includes('emerald')) return '#10b981';
    if (color.includes('amber')) return '#f59e0b';
    if (color.includes('blue')) return '#3b82f6';
    return '#64748b';
  };

  const strokeColor = getChartColor();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col h-full transition-all hover:shadow-md hover:border-slate-300 group">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            {title}
          </p>
          <div className="text-3xl font-black text-slate-950 tracking-tighter">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
        </div>
        
        {/* Icon Badge */}
        <div className={`${color} bg-opacity-15 p-3 rounded-lg flex items-center justify-center transition-all group-hover:scale-105 flex-shrink-0 ml-3`}>
          <Icon className="w-5 h-5" style={{ color: strokeColor }} />
        </div>
      </div>

      {/* Chart Section */}
      {chartData && chartData.length > 0 && (
        <div className="h-16 w-full mb-4 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke={strokeColor}
                strokeWidth={2.5}
                fill={`url(#gradient-${color})`}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer Trend Label */}
      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100/80">
        <div className={`w-1.5 h-1.5 rounded-full ${color} animate-pulse`} />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {trendLabel || 'Real-time'}
        </span>
      </div>
    </div>
  );
};

export default MetricCard;