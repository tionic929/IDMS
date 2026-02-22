import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer } from './ChartContainer';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export const DistributionChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <ChartContainer title="Distribution">
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-slate-400">No data available</p>
        </div>
      </ChartContainer>
    );
  }

  const totalCount = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <ChartContainer title="Inventory Share">
      <div className="flex flex-col h-full justify-between gap-6">

        {/* Chart Section */}
        <div className="h-[180px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Background track */}
              <Pie
                data={[{ value: 1 }]}
                innerRadius={60}
                outerRadius={75}
                fill="#f1f5f9"
                dataKey="value"
                isAnimationActive={false}
                stroke="none"
              />
              {/* Main pie chart */}
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={75}
                paddingAngle={3}
                dataKey="total"
                stroke="#ffffff"
                strokeWidth={2}
                animationBegin={200}
                animationDuration={1000}
              >
                {data.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={COLORS[i % COLORS.length]}
                    className="hover:saturate-150 transition-all cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '8px 12px'
                }}
                formatter={(value) => {
                  const percentage = totalCount > 0 ? ((value / totalCount) * 100).toFixed(1) : '0';
                  return [`${value} (${percentage}%)`, 'Count'];
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</span>
            <span className="text-2xl font-black text-slate-900 mt-1 tracking-tighter">{totalCount}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t border-slate-100 pt-4">
          <div className="grid grid-cols-2 gap-x-2 gap-y-3">
            {data.slice(0, 4).map((item, i) => (
              <div key={item.name} className="group flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                {/* Color Indicator */}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-tight truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black text-slate-900">
                      {item.percentage}%
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {item.total}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show more indicator if needed */}
          {data.length > 4 && (
            <div className="mt-3 text-xs text-slate-400 font-semibold text-center py-2 border-t border-slate-100">
              +{data.length - 4} more
            </div>
          )}
        </div>

      </div>
    </ChartContainer>
  );
};