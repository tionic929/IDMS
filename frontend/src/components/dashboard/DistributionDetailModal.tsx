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
            title="Inventory Share"
            subtitle={`Distribution across ${sorted.length} departments · ${total.toLocaleString()} total`}
            size="xl"
        >
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Pie chart */}
                <div className="lg:w-80 flex-shrink-0">
                    <div className="relative h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sorted}
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={2}
                                    dataKey="total"
                                    stroke="#fff"
                                    strokeWidth={2}
                                    animationDuration={800}
                                >
                                    {sorted.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                                    formatter={(v: any, _: any, p: any) => [
                                        `${v.toLocaleString()} (${p.payload.percentage}%)`,
                                        p.payload.name,
                                    ]}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center total */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                            <span className="text-2xl font-black text-slate-900 tabular-nums">{total.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Color legend */}
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                        {sorted.slice(0, 10).map((d, i) => (
                            <div key={d.name} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                <span className="text-[10px] font-semibold text-slate-500 truncate">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 border border-slate-100 rounded-xl overflow-hidden self-start">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Dept</th>
                                <th className="px-4 py-2.5 text-right font-semibold text-slate-400 uppercase tracking-wider">Students</th>
                                <th className="px-4 py-2.5 text-right font-semibold text-slate-400 uppercase tracking-wider">Share</th>
                                <th className="px-4 py-2.5 text-slate-400 font-semibold uppercase tracking-wider">Bar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sorted.map((d, i) => (
                                <tr key={d.name} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                            <span className="font-semibold text-slate-700">{d.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 tabular-nums">
                                        {d.total.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <span className="font-bold text-slate-800">{d.percentage}%</span>
                                    </td>
                                    <td className="px-4 py-2.5 w-28">
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${d.percentage}%`,
                                                    background: COLORS[i % COLORS.length],
                                                }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50 border-t border-slate-200">
                                <td className="px-4 py-2.5 font-bold text-slate-600 text-xs">Total</td>
                                <td className="px-4 py-2.5 text-right font-black text-slate-900 tabular-nums">
                                    {total.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right font-black text-slate-900">100%</td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </DashboardModal>
    );
};
