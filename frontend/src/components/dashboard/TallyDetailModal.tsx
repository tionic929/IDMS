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
            title="Departmental Breakdown"
            subtitle={`${sorted.length} departments · ${total.toLocaleString()} total students`}
            size="xl"
        >
            {/* Full bar chart */}
            <div className="h-56 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sorted} margin={{ top: 4, right: 4, left: -20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false} tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }}
                            angle={-35} textAnchor="end" height={50}
                        />
                        <YAxis
                            axisLine={false} tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            width={36}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc', radius: 4 }}
                            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                            formatter={(v: any) => [v.toLocaleString(), 'Students']}
                        />
                        <Bar dataKey="total" radius={[5, 5, 0, 0]} barSize={28} animationDuration={700}>
                            {sorted.map((d, i) => (
                                <Cell
                                    key={d.name}
                                    fill={d.name === focusDept ? '#4f46e5' : COLORS[i % COLORS.length]}
                                    fillOpacity={focusDept && d.name !== focusDept ? 0.35 : 0.9}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Full ranked table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 py-2.5 text-left text-slate-400 font-semibold uppercase tracking-wider w-8">#</th>
                            <th className="px-4 py-2.5 text-left text-slate-400 font-semibold uppercase tracking-wider">Department</th>
                            <th className="px-4 py-2.5 text-right text-slate-400 font-semibold uppercase tracking-wider">Students</th>
                            <th className="px-4 py-2.5 text-right text-slate-400 font-semibold uppercase tracking-wider">Share</th>
                            <th className="px-4 py-2.5 text-slate-400 font-semibold uppercase tracking-wider">Distribution</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sorted.map((dept, i) => {
                            const logo = LOGO_MAP[dept.name?.toUpperCase()];
                            const isFocused = dept.name === focusDept;
                            return (
                                <tr
                                    key={dept.name}
                                    className={`hover:bg-slate-50 transition-colors ${isFocused ? 'bg-indigo-50/60' : ''}`}
                                >
                                    <td className="px-4 py-3">
                                        {i < 3
                                            ? <Medal size={14} className={MEDAL_COLORS[i]} />
                                            : <span className="text-slate-300 font-bold">{i + 1}</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center flex-shrink-0">
                                                {logo
                                                    ? <img src={logo} alt={dept.name} className="w-full h-full object-contain" />
                                                    : <span className="text-[8px] font-black text-slate-400">{dept.name.slice(0, 3)}</span>
                                                }
                                            </div>
                                            <span className={`font-semibold ${isFocused ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                {dept.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                                        {dept.total.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'
                                            }`}>
                                            {dept.percentage}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 w-32">
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${(dept.total / maxValue) * 100}%`,
                                                    background: COLORS[i % COLORS.length],
                                                }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50 border-t border-slate-200">
                            <td colSpan={2} className="px-4 py-2.5 text-xs font-bold text-slate-500">
                                Total ({sorted.length} depts)
                            </td>
                            <td className="px-4 py-2.5 text-right font-black text-slate-900 tabular-nums text-sm">
                                {total.toLocaleString()}
                            </td>
                            <td colSpan={2} className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400">
                                100%
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </DashboardModal>
    );
};
