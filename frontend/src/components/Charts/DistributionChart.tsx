import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { ArrowUpRight } from 'lucide-react';

const LIGHT_COLORS = ['#00928a', '#6366f1', '#f59e0b', '#3b82f6', '#10b981', '#64748b'];

export const DistributionChart: React.FC<{
  title?: string;
  data: any[];
  onViewDetails?: () => void;
}> = ({ title = "Share Overview", data, onViewDetails }) => {
  if (!data || data.length === 0) {
    return (
      <ChartContainer title={title}>
        <div className="h-full flex items-center justify-center">
          <p className="text-[10px] font-bold uppercase text-slate-300 tracking-widest">No Data</p>
        </div>
      </ChartContainer>
    );
  }

  const totalCount = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <ChartContainer title={title}>
      <div className="flex flex-col h-full justify-between gap-4">
        <div className="h-[140px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={50}
                outerRadius={65}
                paddingAngle={4}
                dataKey="total"
                stroke="transparent"
                animationBegin={0}
                animationDuration={1500}
              >
                {data.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={LIGHT_COLORS[i % LIGHT_COLORS.length]}
                    className="hover:opacity-80 transition-all cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#0f172a',
                  padding: '8px 12px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}
                itemStyle={{ fontSize: '10px', padding: 0 }}
                formatter={(value: any) => [`${value} units`, 'Count']}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            <span className="text-xl font-black text-slate-900 tabular-nums tracking-tighter">{totalCount.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          {data.slice(0, 3).map((item, i) => (
            <div key={item.name} className="flex items-center justify-between group/legend">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: LIGHT_COLORS[i % LIGHT_COLORS.length] }} />
                <span className="text-[9px] font-bold text-slate-500 uppercase truncate tracking-tight group-hover/legend:text-slate-900 transition-colors">
                  {item.name}
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-600 tabular-nums">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {data.length > 3 ? `+${data.length - 3} More` : 'Complete'}
          </span>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-[9px] font-bold text-primary hover:text-primary/70 transition-all uppercase tracking-widest"
            >
              View all ↗
            </button>
          )}
        </div>
      </div>
    </ChartContainer>
  );
};
