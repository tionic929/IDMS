/**
 * DistributionDetailModal
 * Full-size pie/table breakdown of department distribution.
 */
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DashboardModal } from './DashboardModal';
import type { Department } from '../../types/analytics';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#e11d48', '#7c3aed', '#0891b2'];

export const DistributionDetailModal: React.FC<{
    open: boolean;
    onClose: () => void;
    data: Department[];
}> = ({ open, onClose, data }) => {
    if (!data?.length) return null;

    const sorted = [...data].sort((a, b) => b.total - a.total);
    const total = sorted.reduce((s, d) => s + d.total, 0);

    return (
        <DashboardModal
            open={open}
            onClose={onClose}
            title="Distribution Analysis"
            subtitle={`Distribution across ${sorted.length} sections · ${total.toLocaleString()} total`}
            size="xl"
        >
            <div className="flex flex-col lg:flex-row gap-10">
                {/* Pie chart */}
                <div className="lg:w-80 flex-shrink-0">
                    <div className="relative h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sorted}
                                    innerRadius={75}
                                    outerRadius={105}
                                    paddingAngle={4}
                                    dataKey="total"
                                    stroke="transparent"
                                    animationDuration={1500}
                                >
                                    {sorted.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill="#00928a"
                                            fillOpacity={1 - (i * 0.08)}
                                            className="hover:opacity-60 transition-all duration-300"
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
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}
                                    formatter={(v: any, _: any, p: any) => [
                                        `${v.toLocaleString()} students`,
                                        p.payload.name,
                                    ]}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center total */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                            <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">{total.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Technical legend */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {sorted.slice(0, 10).map((d, i) => (
                            <div key={d.name} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00928a', opacity: 1 - (i * 0.08) }} />
                                <span className="text-[9px] font-bold text-slate-400 uppercase truncate tracking-widest">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 border border-slate-100 rounded-2xl overflow-hidden self-start bg-white shadow-sm">
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-widest">Section</th>
                                <th className="px-4 py-3 text-right font-bold text-slate-400 uppercase tracking-widest">Total</th>
                                <th className="px-4 py-3 text-right font-bold text-slate-400 uppercase tracking-widest">Percentage</th>
                                <th className="px-4 py-3 text-slate-400 font-bold uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sorted.map((d, i) => (
                                <tr key={d.name} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00928a', opacity: 1 - (i * 0.08) }} />
                                            <span className="font-bold text-slate-700 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{d.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right font-black text-slate-900 tabular-nums">
                                        {d.total.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="font-bold text-slate-400 tabular-nums uppercase">{d.percentage}%</span>
                                    </td>
                                    <td className="px-4 py-4 w-32">
                                        <div className="h-[2px] bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-1000"
                                                style={{
                                                    width: `${d.percentage}%`,
                                                    opacity: 1 - (i * 0.08)
                                                }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50/50 border-t border-slate-100">
                                <td className="px-4 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Total Overall</td>
                                <td className="px-4 py-4 text-right font-black text-primary tabular-nums text-lg">
                                    {total.toLocaleString()}
                                </td>
                                <td className="px-4 py-4 text-right font-bold text-slate-400 uppercase tracking-widest">Verified</td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </DashboardModal>
    );
};
