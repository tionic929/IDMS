import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, TrendingUp, Award, ArrowUpRight, 
  Download, Calendar, MoreHorizontal, Activity
} from 'lucide-react';
import api from '../api/axios';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// --- Custom Interactive Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-2xl">
        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-white">
          {payload[0].name}: <span className="text-teal-400">{payload[0].value.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/analytics/dashboard').then(res => setData(res.data));
  }, []);

  if (!data) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-2">
        <Activity className="animate-pulse text-teal-500" size={32} />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Loading Data</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 bg-[#020617] min-h-screen text-slate-200 font-sans selection:bg-teal-500/30">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-md text-xs font-medium transition-colors">
            <Calendar size={14} /> Jan 2026 - Feb 2026
          </button>
          <button className="flex items-center gap-2 bg-white hover:bg-slate-200 text-slate-950 px-4 py-2 rounded-md text-xs font-bold transition-colors">
            <Download size={14} /> Export Data
          </button>
        </div>
      </div>

      {/* KPI CARDS (Proper Hierarchy) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Records', val: data.summary.total_records, icon: Users, trend: '+12.5%', color: 'text-blue-500' },
          { label: 'New Applicants', val: data.summary.new_this_week, icon: ArrowUpRight, trend: '+4.3%', color: 'text-teal-500' },
          { label: 'ID Cards Issued', val: data.summary.issued_cards, icon: Award, trend: '+18.1%', color: 'text-purple-500' },
          { label: 'Platform Users', val: data.summary.user_growth, icon: TrendingUp, trend: '+2.4%', color: 'text-orange-500' },
        ].map((card, i) => (
          <div key={i} className="group bg-slate-900/40 border border-slate-800/60 p-5 rounded-xl hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${card.color}`}>
                <card.icon size={18} />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">{card.trend}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{card.val.toLocaleString()}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        
        {/* GROWTH CHART (L-SPAN 4) */}
        <div className="lg:col-span-4 bg-slate-900/20 border border-slate-800/60 rounded-xl p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Applicant Growth</h3>
              <p className="text-xs text-slate-500 uppercase tracking-tighter">Historical trend over the last 6 months</p>
            </div>
            <MoreHorizontal className="text-slate-600 cursor-pointer hover:text-white transition-colors" />
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                    dataKey="month" 
                    stroke="#475569" 
                    fontSize={11} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{dy: 10}}
                />
                <YAxis stroke="#475569" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                    name="Applicants"
                    type="monotone" 
                    dataKey="count" 
                    stroke="#2dd4bf" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#chartGradient)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DISTRIBUTION (L-SPAN 2) */}
        <div className="lg:col-span-2 bg-slate-900/20 border border-slate-800/60 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-1">Department Share</h3>
          <p className="text-xs text-slate-500 uppercase mb-8">Overall distribution</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.departments.full_list}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="total"
                  stroke="none"
                >
                  {data.departments.full_list.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
             {data.departments.full_list.slice(0, 3).map((dept: any, i: number) => (
               <div key={i} className="flex justify-between items-center text-xs">
                 <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                    {dept.name}
                 </div>
                 <span className="font-bold text-white">{dept.percentage}%</span>
               </div>
             ))}
          </div>
        </div>

        {/* BAR CHART (L-SPAN 3) */}
        <div className="lg:col-span-3 bg-slate-900/20 border border-slate-800/60 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Performance by Course</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departments.full_list}>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} hide />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b'}} />
                <Bar name="Total" dataKey="total" fill="#3b82f6" radius={[4, 4, 4, 4]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* INSIGHTS BOX (L-SPAN 3) */}
        <div className="lg:col-span-3 grid grid-cols-1 gap-4">
            <div className="bg-slate-900/40 border-l-4 border-l-emerald-500 p-6 rounded-r-xl border border-slate-800/60">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Top Performer</p>
                <h4 className="text-xl font-bold mt-2 text-white">{data.departments.highest.name}</h4>
                <div className="mt-4 bg-slate-950 rounded-full h-1.5 w-full">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${data.departments.highest.percentage}%`}} />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 uppercase italic">{data.departments.highest.total} Active records</p>
            </div>

            <div className="bg-slate-900/40 border-l-4 border-l-blue-500 p-6 rounded-r-xl border border-slate-800/60">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">System Health</p>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                   Currently processing <span className="text-white font-bold">{data.summary.new_this_week}</span> new applications this cycle. 
                   <span className="text-blue-400 font-bold ml-1">{data.departments.highest.name}</span> leads the volume with {data.departments.highest.percentage}% of the total database.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;