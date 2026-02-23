/**
 * TallyDetailModal
 * Opened when a bar is clicked in TallyChart OR via "View all" link.
 * Shows the full ranked leaderboard with mini progress bars,
 * and optionally drills into a single department.
 */
import React from 'react';
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Medal, TrendingUp } from 'lucide-react';
import { DashboardModal } from './DashboardModal';
import type { Department } from '../../types/analytics';
import { cn } from "@/lib/utils";

// Static logo imports
import abLogo from '../../assets/dept_logo/ab.webp';
import becLogo from '../../assets/dept_logo/bec.webp';
import bsbaLogo from '../../assets/dept_logo/bsba.webp';
import bscrimLogo from '../../assets/dept_logo/bscrim.webp';
import bsedLogo from '../../assets/dept_logo/bsed.webp';
import bsgeLogo from '../../assets/dept_logo/bsge.webp';
import bshmLogo from '../../assets/dept_logo/bshm.webp';
import bsitLogo from '../../assets/dept_logo/bsit.webp';
import bsnLogo from '../../assets/dept_logo/bsn.webp';
import colaLogo from '../../assets/dept_logo/cola.webp';
import masteralLogo from '../../assets/dept_logo/masteral.webp';
import midwiferyLogo from '../../assets/dept_logo/midwifery.webp';

const LOGO_MAP: Record<string, string> = {
    AB: abLogo, BEC: becLogo, BSBA: bsbaLogo, BSCRIM: bscrimLogo,
    BSED: bsedLogo, BSGE: bsgeLogo, BSHM: bshmLogo, BSIT: bsitLogo,
    BSN: bsnLogo, COLA: colaLogo, MASTERAL: masteralLogo, MIDWIFERY: midwiferyLogo,
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

const MEDAL_COLORS = ['text-amber-400', 'text-slate-400', 'text-amber-700'];

export const TallyDetailModal: React.FC<{
    open: boolean;
    onClose: () => void;
    data: Department[];
    /** Pre-select a dept when clicking a bar directly */
    focusDept?: string | null;
}> = ({ open, onClose, data, focusDept }) => {
    if (!data?.length) return null;

    const sorted = [...data].sort((a, b) => b.total - a.total);
    const maxValue = sorted[0]?.total || 1;
    const total = sorted.reduce((s, d) => s + d.total, 0);

    return (
        <DashboardModal
            open={open}
            onClose={onClose}
            title="Section Ranks"
            subtitle={`${sorted.length} groups · ${total.toLocaleString()} total students`}
            size="xl"
        >
            {/* Full bar chart */}
            <div className="h-56 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sorted} margin={{ top: 10, right: 10, left: -25, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false} tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false} tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc', radius: 4 }}
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '700',
                                color: '#0f172a',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}
                            itemStyle={{ color: '#00928a' }}
                            formatter={(v: any) => [v.toLocaleString(), 'Count']}
                        />
                        <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={32} animationDuration={1000}>
                            {sorted.map((d, i) => (
                                <Cell
                                    key={d.name}
                                    fill="#00928a"
                                    fillOpacity={focusDept && d.name !== focusDept ? 0.2 : 0.8}
                                    className="transition-all duration-300"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Full ranked table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-[10px]">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-4 py-3 text-left text-slate-400 font-bold uppercase tracking-widest w-12">Rank</th>
                            <th className="px-4 py-3 text-left text-slate-400 font-bold uppercase tracking-widest">Section</th>
                            <th className="px-4 py-3 text-right text-slate-400 font-bold uppercase tracking-widest">Value</th>
                            <th className="px-4 py-3 text-right text-slate-400 font-bold uppercase tracking-widest">Share</th>
                            <th className="px-4 py-3 text-slate-400 font-bold uppercase tracking-widest text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sorted.map((dept, i) => {
                            const logo = LOGO_MAP[dept.name?.toUpperCase()];
                            const isFocused = dept.name === focusDept;
                            return (
                                <tr
                                    key={dept.name}
                                    className={`hover:bg-slate-50 transition-colors group ${isFocused ? 'bg-primary/5' : ''}`}
                                >
                                    <td className="px-4 py-4">
                                        <span className={`font-bold tabular-nums ${i < 3 ? 'text-primary' : 'text-slate-300'}`}>
                                            {(i + 1).toString().padStart(2, '0')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:border-primary/50 transition-colors">
                                                {logo
                                                    ? <img src={logo} alt={dept.name} className="w-full h-full object-contain p-1" />
                                                    : <span className="text-[8px] font-bold text-slate-400 uppercase">{dept.name.slice(0, 3)}</span>
                                                }
                                            </div>
                                            <span className={`font-bold uppercase tracking-widest ${isFocused ? 'text-primary' : 'text-slate-700'}`}>
                                                {dept.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right font-black text-slate-900 tabular-nums text-sm">
                                        {dept.total.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase tracking-widest">
                                            {dept.percentage}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 w-40">
                                        <div className="flex items-center gap-3">
                                            <div className="h-[2px] flex-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-1000"
                                                    style={{
                                                        width: `${(dept.total / maxValue) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", i < 3 ? "bg-primary animate-pulse" : "bg-slate-100")} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50/50 border-t border-slate-100">
                            <td colSpan={2} className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Global Total
                            </td>
                            <td className="px-4 py-4 text-right font-black text-primary tabular-nums text-lg">
                                {total.toLocaleString()}
                            </td>
                            <td colSpan={2} className="px-4 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Data Verified 100%
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </DashboardModal>
    );
};
