import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  chartData?: any[];
  trendLabel?: string;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  chartData,
  trendLabel,
  subtitle
}) => {
  const getChartColor = () => {
    return 'hsl(var(--primary))';
  };

  const strokeColor = getChartColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card glass-card rounded-xl p-6 flex flex-col h-full transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group relative overflow-hidden"
    >
      {/* Background Decor */}
      <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.05] transition-opacity ${color}`} />

      {/* Header Section */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">
            {title}
          </p>
          <div className="text-3xl font-bold text-foreground tracking-tight flex items-baseline gap-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {subtitle && <span className="text-xs font-medium text-muted-foreground lowercase"> {subtitle}</span>}
          </div>
        </div>

        {/* Icon Badge */}
        <div className={`p-2.5 rounded-lg flex items-center justify-center transition-all group-hover:scale-110 flex-shrink-0 ml-3 bg-secondary`}>
          <Icon className="w-5 h-5 text-foreground" />
        </div>
      </div>

      {/* Chart Section */}
      {chartData && chartData.length > 0 && (
        <div className="h-16 w-full mb-4 -mx-1 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#gradient-${title})`}
                isAnimationActive={true}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer Trend Label */}
      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border relative z-10">
        <div className={`w-1.5 h-1.5 rounded-full ${color} animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {trendLabel || 'Live Status'}
        </span>
      </div>
    </motion.div>
  );
};

export default MetricCard;
