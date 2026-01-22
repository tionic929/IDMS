import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const getRandomNum = (min: any, max: any) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
};

const randomNum = getRandomNum(1, 30);
const randomVal = getRandomNum(2400, 10000);

const dummyData = [
  { pv: {randomVal} }, { pv: {randomVal} }, { pv: {randomVal} }, 
  { pv: {randomVal} }, { pv: {randomVal} }, { pv: {randomVal} }, { pv: {randomVal} },
];

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color }) => {
  const textColor = color.replace("bg-", "text-");
  
  // Map Tailwind colors to Hex for the Chart
  const getChartColor = () => {
    if (color.includes('indigo')) return '#6366f1';
    if (color.includes('emerald')) return '#10b981';
    if (color.includes('amber')) return '#f59e0b';
    return '#64748b'; // default slate
  };
  

  const strokeColor = getChartColor();

  return (
    <div className="bg-white p-5 rounded-lg bg-slate-200/20 border border-white shadow-md flex flex-col gap-2 transition-all hover:shadow-lg group">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-slate-400 uppercase">
            {title}
          </span>
          <span className="text-3xl font-sans text-slate-800 mt-1 tracking-tighter">
            {value}
          </span>
        </div>
        
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon className={`w-5 h-5 ${textColor}`} />
        </div>
      </div>

      {/* Sparkline Area Chart */}
      <div className="h-12 w-full -mb-2 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dummyData}>
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Area 
              type="monotone" 
              dataKey="pv" 
              stroke={strokeColor} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#gradient-${color})`} 
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-1.5 border-t border-slate-50 pt-2">
        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${color}`} />
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          +{randomNum}% since 01-{randomNum}-2026 
        </span>
      </div>
    </div>
  );
};

export default MetricCard;