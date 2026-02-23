/**
 * MetricDetailModal
 * Shown when a user clicks a metric card on the dashboard.
 * Renders a full-height area chart, a stats summary grid, and a
 * month-by-month breakdown table — all derived from the trend data
 * already held in memory (no extra API call needed).
 */
import React, { useMemo } from 'react';
import {
    AreaChart, Area, ResponsiveContainer, XAxis, YAxis,
    CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { DashboardModal } from './DashboardModal';
import type { TrendData } from '../../types/analytics';

export interface MetricModalMeta {
    key: string;
    title: string;
    value: string | number;
    trendLabel: string;
    strokeColor: string;
    trends: TrendData[];
    distribution?: { name: string; value: number; color?: string }[];
}

const Tooltip_ = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 shadow-xl rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-wider">
            <p className="text-slate-400 mb-1">{label}</p>
            <p className="text-primary text-lg">{payload[0].value?.toLocaleString()}</p>
        </div>
    );
};

export const MetricDetailModal: React.FC<{
    open: boolean;
    onClose: () => void;
    meta: MetricModalMeta | null;
}> = ({ open, onClose, meta }) => {
    if (!meta) return null;

    const { title, value, trendLabel, strokeColor, trends } = meta;

    const stats = useMemo(() => {
        if (!trends || trends.length === 0) return null;
        const values = trends.map(t => t.count);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / values.length);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const last = values[values.length - 1] ?? 0;
        const prev = values[values.length - 2] ?? last;
        const pct = prev > 0 ? (((last - prev) / prev) * 100).toFixed(1) : '0';
        return { avg, max, min, sum, pct, positive: parseFloat(pct) >= 0 };
    }, [trends]);

    return (
        <DashboardModal
            open={open}
            onClose={onClose}
            title={title}
            subtitle={`Detailed trend · ${trendLabel}`}
            size="lg"
        >
            {/* Current value hero */}
            <div className="flex items-end gap-3 mb-8">
                <span className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {stats && (
                    <span className={`flex items-center gap-1 pb-2 text-[10px] font-bold uppercase tracking-wider ${stats.positive ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                        {stats.positive ? '▲' : '▼'} {stats.pct}% Growth
                    </span>
                )}
            </div>

            {/* Stats grid */}
            {stats && (
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Count', val: stats.sum.toLocaleString() },
                        { label: 'Average', val: stats.avg.toLocaleString() },
                        { label: 'Highest', val: stats.max.toLocaleString() },
                        { label: 'Lowest', val: stats.min.toLocaleString() },
                    ].map(s => (
                        <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <p className="text-xl font-black text-slate-900 tabular-nums">{s.val}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Full trend chart */}
            <div className="h-64 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                        <defs>
                            <linearGradient id={`m-fill-${meta.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00928a" stopOpacity={0.1} />
                                <stop offset="100%" stopColor="#00928a" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="month"
                            axisLine={false} tickLine={false}
                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false} tickLine={false}
                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                        />
                        {stats && (
                            <ReferenceLine
                                y={stats.avg}
                                stroke="#00928a"
                                strokeDasharray="4 4"
                                strokeOpacity={0.2}
                            />
                        )}
                        <Tooltip content={<Tooltip_ active={undefined} payload={undefined} label={undefined} />} />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#00928a"
                            strokeWidth={2}
                            fill={`url(#m-fill-${meta.key})`}
                            dot={false}
                            activeDot={{ r: 4, fill: '#00928a', stroke: '#fff', strokeWidth: 2 }}
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Composition / Breakdown (if provided) */}
            {meta.distribution && (
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Composition Breakdown</span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {meta.distribution.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: item.color || '#3b82f6' }}
                                    />
                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight group-hover:text-slate-900">{item.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-800 tabular-nums">
                                    {item.value.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Month-by-month breakdown table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-[10px]">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-widest">Period</th>
                            <th className="px-4 py-3 text-right font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                            <th className="px-4 py-3 text-right font-bold text-slate-400 uppercase tracking-widest">Change</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {[...trends].reverse().map((t, i, arr) => {
                            const prev = arr[i + 1]?.count;
                            const diff = prev != null ? t.count - prev : null;
                            const pos = diff != null && diff >= 0;
                            return (
                                <tr key={t.month} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-4 py-3 font-bold text-slate-600 uppercase group-hover:text-slate-900 transition-colors">{t.month}</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">{t.count.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {diff != null ? (
                                            <span className={`inline-flex items-center gap-1 font-bold ${pos ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {pos ? '▲' : '▼'} {Math.abs(diff).toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="text-slate-200">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </DashboardModal>
    );
};
