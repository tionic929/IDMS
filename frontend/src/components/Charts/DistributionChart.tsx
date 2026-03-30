import React, { memo, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from './ChartContainer';

const LIGHT_COLORS = ['#00928a', '#6366f1', '#f59e0b', '#3b82f6', '#10b981', '#64748b'];

// --- Sub-components ---

const CustomTooltip = memo(({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="bg-card/95 backdrop-blur-md p-3 rounded-xl border border-border shadow-2xl pointer-events-none">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.payload.fill || entry.color }} />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{entry.name}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-foreground">Total Count</span>
          <span className="text-xs font-black text-primary">{entry.value.toLocaleString()} items</span>
        </div>
      </div>
    );
  }
  return null;
});

// --- Main Component ---

const DistributionChartComponent: React.FC<{
  title?: string;
  data: any[];
  onViewDetails?: () => void;
  onSliceClick?: (deptName: string) => void;
  isTransitioning?: boolean; 
}> = ({ title = "Share Overview", data, onViewDetails, onSliceClick }) => {

  const totalCount = useMemo(() =>
    data.reduce((sum, item) => sum + (item.total || 0), 0)
    , [data]);

  if (!data || data.length === 0) {
    return (
      <ChartContainer title={title}>
        <div className="h-full flex items-center justify-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">No Data</p>
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer title={title}>
      <div className="flex flex-col h-full justify-between gap-4 px-2 py-1 overflow-hidden relative">
        <div className="h-[180px] w-full relative overflow-hidden">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <PieChart>
              <Pie
                data={data}
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="total"
                stroke="transparent"
                isAnimationActive={false} // DISABLED: Fixes stuttering
                labelLine={false}
              >
                {data.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={LIGHT_COLORS[i % LIGHT_COLORS.length]}
                    className="hover:opacity-80 transition-all cursor-pointer outline-none"
                    onClick={() => onSliceClick?.(data[i]?.name)}
                  />
                ))}
              </Pie>
              <Tooltip 
                content={<CustomTooltip />} 
                isAnimationActive={false} // DISABLED: Fixes stuttering
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total</span>
            <span className="text-xl font-black text-foreground tabular-nums tracking-tighter">{totalCount.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-1.5 px-1 pb-1">
          {data.slice(0, 3).map((item, i) => (
            <div
              key={item.name}
              className="flex items-center justify-between group/legend cursor-pointer"
              onClick={() => onSliceClick?.(item.name)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: LIGHT_COLORS[i % LIGHT_COLORS.length] }} />
                <span className="text-[9px] font-bold text-muted-foreground uppercase truncate tracking-tight group-hover/legend:text-primary transition-colors">
                  {item.name}
                </span>
              </div>
              <span className="text-[9px] font-bold text-foreground tabular-nums">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border flex items-center justify-between mt-auto">
          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            {data.length > 3 ? `+${data.length - 3} Sections` : 'All Sections'}
          </span>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-[8px] font-bold text-primary hover:text-primary/70 transition-all uppercase tracking-widest"
            >
              Details ↗
            </button>
          )}
        </div>
      </div>
    </ChartContainer>
  );
};

export const DistributionChart = memo(DistributionChartComponent);
