import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { ChartContainer } from './ChartContainer';
import type { Department } from '../../types/analytics';
import { Medal, TrendingUp, BarChart3 } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export const TallyChart: React.FC<{ data: Department[] }> = ({ data }) => {
  // 1. Data Sanitization & Sorting
  if (!data || data.length === 0) {
    return (
      <ChartContainer title="Departmental Tallies">
        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
          <BarChart3 size={24} className="opacity-20" />
          <p className="text-[10px] font-black uppercase tracking-widest">No Records Found</p>
        </div>
      </ChartContainer>
    );
  }

  const sortedData = [...data].sort((a, b) => b.total - a.total);
  const topPerformers = sortedData.slice(0, 2);
  const maxValue = Math.max(...data.map(d => d.total));

  return (
    <ChartContainer 
      title="Departmental Tallies"
      footer={
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <div className="flex items-center gap-2">
              <Medal size={12} className="text-amber-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Performance</span>
            </div>
            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Leaderboard</span>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {topPerformers.map((dept, idx) => (
              <div 
                key={dept.name}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 border border-transparent hover:border-slate-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-sm ${idx === 0 ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-700 uppercase leading-none mb-1">{dept.name}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Primary Division</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <div className="h-1 w-16 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-1000" 
                        style={{ width: `${(dept.total / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={10} className="text-emerald-500" />
                    <span className="text-xs font-black text-slate-900 tabular-nums">{dept.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      {/* Visual Chart Area - Optimized for 260px internal height */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 600, fill: '#cbd5e1' }}
              domain={[0, Math.ceil(maxValue * 1.1)]} // Adds headroom
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc', radius: 6 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-2xl border border-slate-800">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                      <p className="text-sm font-black tracking-tight">{payload[0].value} <span className="text-[10px] font-normal text-slate-400">Total</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="total" 
              radius={[6, 6, 2, 2]} 
              barSize={32}
              animationBegin={300}
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 0 ? '#6366f1' : '#e2e8f0'} // Highlights only the first/top bar by default or uses a consistent color
                  fillOpacity={0.9}
                  className="hover:fill-indigo-500 transition-all cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};