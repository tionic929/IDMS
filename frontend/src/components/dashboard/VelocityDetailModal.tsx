/**
 * VelocityDetailModal
 * Full expanded view of the enrollment trend — bigger chart, stats,
 * and a period-comparison table.
 */
import React, { useMemo } from 'react';
import {
    AreaChart, Area, ResponsiveContainer, XAxis, YAxis,
    CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardModal } from './DashboardModal';
import type { TrendData } from '../../types/analytics';

export const VelocityDetailModal: React.FC<{
    open: boolean;
    onClose: () => void;
    data: TrendData[];
}> = ({ open, onClose, data }) => {
    const stats = useMemo(() => {
        if (!data?.length) return null;
        const vals = data.map(d => d.count);
        const sum = vals.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / vals.length);
        const max = Math.max(...vals);
        const min = Math.min(...vals);
        const last = vals[vals.length - 1] ?? 0;
        const prev = vals[vals.length - 2] ?? last;
        const pct = prev > 0 ? (((last - prev) / prev) * 100).toFixed(1) : '0';
        return { sum, avg, max, min, last, pct, positive: parseFloat(pct) >= 0 };
    }, [data]);

    return (
        <DashboardModal
            open={open}
            onClose={onClose}
            title="Production Trend"
            subtitle="Enrollment velocity over time · full dataset"
            size="xl"
        >
            {/* Summary hero */}
            {stats && (
                <>
                    <div className="flex items-end gap-4 mb-6">
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Latest period</p>
                            <p className="text-4xl font-black text-slate-900">{stats.last.toLocaleString()}</p>
                        </div>
                        <span className={`pb-2 flex items-center gap-1 text-sm font-bold ${stats.positive ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                            {stats.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {stats.positive ? '+' : ''}{stats.pct}% vs prev
                        </span>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-6">
                        {[
                            { label: 'Total', val: stats.sum.toLocaleString() },
                            { label: 'Average', val: stats.avg.toLocaleString() },
                            { label: 'Peak', val: stats.max.toLocaleString() },
                            { label: 'Lowest', val: stats.min.toLocaleString() },
                        ].map(s => (
                            <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                                <p className="text-lg font-black text-slate-900">{s.val}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Full chart */}
            <div className="h-72 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 24 }}>
                        <defs>
                            <linearGradient id="vd-fill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="month"
                            axisLine={false} tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                            angle={-35} textAnchor="end" height={50}
                        />
                        <YAxis
                            axisLine={false} tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                            width={40}
                        />
                        {stats && (
                            <ReferenceLine
                                y={stats.avg}
                                stroke="#6366f1"
                                strokeDasharray="4 3"
                                strokeOpacity={0.4}
                                label={{ value: 'avg', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }}
                            />
                        )}
                        <Tooltip
                            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                            formatter={(v: any) => [v.toLocaleString(), 'Enrollments']}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            fill="url(#vd-fill)"
                            dot={false}
                            activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                            animationDuration={700}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Period breakdown table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Period</th>
                            <th className="px-4 py-2.5 text-right font-semibold text-slate-400 uppercase tracking-wider">Count</th>
                            <th className="px-4 py-2.5 text-right font-semibold text-slate-400 uppercase tracking-wider">Change</th>
                            <th className="px-4 py-2.5 text-right font-semibold text-slate-400 uppercase tracking-wider">% Change</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {[...data].reverse().map((t, i, arr) => {
                            const prev = arr[i + 1]?.count;
                            const diff = prev != null ? t.count - prev : null;
                            const pctStr = prev != null && prev > 0
                                ? (((t.count - prev) / prev) * 100).toFixed(1)
                                : null;
                            const pos = diff != null && diff >= 0;
                            return (
                                <tr key={t.month} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-2.5 font-medium text-slate-700">{t.month}</td>
                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 tabular-nums">
                                        {t.count.toLocaleString()}
                                    </td>
                                    <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${diff == null ? 'text-slate-300' : pos ? 'text-emerald-600' : 'text-red-500'
                                        }`}>
                                        {diff != null ? `${pos ? '+' : ''}${diff.toLocaleString()}` : '—'}
                                    </td>
                                    <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${pctStr == null ? 'text-slate-300' : parseFloat(pctStr) >= 0 ? 'text-emerald-600' : 'text-red-500'
                                        }`}>
                                        {pctStr != null ? `${parseFloat(pctStr) >= 0 ? '+' : ''}${pctStr}%` : '—'}
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
