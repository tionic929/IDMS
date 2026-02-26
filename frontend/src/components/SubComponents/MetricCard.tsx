import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  chartData?: any[];
  trendLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  onClick?: () => void;
}


const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  chartData,
  trendLabel,
  trend = 'neutral',
  className,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer bg-white border-slate-100",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
            <div className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          </div>
          <div className="p-2 rounded-xl border border-slate-100 bg-slate-50 transition-transform group-hover:scale-110 duration-500 text-primary">
            <Icon size={16} strokeWidth={2.5} />
          </div>
        </div>

        {/* Sparkline - Very minimal */}
        {chartData && chartData.length > 0 && (
          <div className="h-10 w-full mt-2 opacity-40 group-hover:opacity-100 transition-opacity duration-700">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="currentColor"
                  strokeWidth={2}
                  fill="transparent"
                  dot={false}
                  isAnimationActive
                  className="text-primary"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          {trendLabel && (
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1",
                trend === 'up' ? 'bg-emerald-50 text-emerald-600'
                  : trend === 'down' ? 'bg-red-50 text-red-600'
                    : 'bg-slate-50 text-slate-400'
              )}>
                {trend === 'up' && <TrendingUp size={10} />}
                {trend === 'down' && <TrendingDown size={10} />}
                {trendLabel.split(' ')[0]}
              </div>
            </div>
          )}

          <span className="text-[9px] font-bold uppercase tracking-wider transition-all duration-500 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 text-primary">
            View details ↗
          </span>
        </div>
      </CardContent>

      {/* Very subtle bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-slate-100" />
    </Card>
  );
};

export default MetricCard;
