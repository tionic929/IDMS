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
}

const Tooltip_ = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-xs">
            <p className="text-slate-400 mb-1">{label}</p>
            <p className="font-bold text-slate-900 text-base">{payload[0].value?.toLocaleString()}</p>
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
            <div className="flex items-end gap-3 mb-6">
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {stats && (
                    <span className={`flex items-center gap-1 pb-1.5 text-sm font-bold ${stats.positive ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                        {stats.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {stats.positive ? '+' : ''}{stats.pct}% vs last period
                    </span>
                )}
            </div>

            {/* Stats grid */}
            {stats && (
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Total (period)', val: stats.sum.toLocaleString() },
                        { label: 'Monthly avg', val: stats.avg.toLocaleString() },
                        { label: 'Peak', val: stats.max.toLocaleString() },
                        { label: 'Low', val: stats.min.toLocaleString() },
                    ].map(s => (
                        <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                            <p className="text-lg font-black text-slate-900">{s.val}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Full trend chart */}
            <div className="h-64 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 4, right: 4, left: -10, bottom: 20 }}>
                        <defs>
                            <linearGradient id={`m-fill-${meta.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.18} />
                                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
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
                            width={36}
                        />
                        {stats && (
                            <ReferenceLine
                                y={stats.avg}
                                stroke={strokeColor}
                                strokeDasharray="4 3"
                                strokeOpacity={0.4}
                                label={{ value: 'avg', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }}
                            />
                        )}
                        <Tooltip content={<Tooltip_ active={undefined} payload={undefined} label={undefined} />} />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke={strokeColor}
                            strokeWidth={2.5}
                            fill={`url(#m-fill-${meta.key})`}
                            dot={false}
                            activeDot={{ r: 5, fill: strokeColor, stroke: '#fff', strokeWidth: 2 }}
                            animationDuration={700}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Month-by-month breakdown table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Period</th>
                            <th className="px-4 py-2.5 text-right font-semibold text-slate-500 uppercase tracking-wider">Count</th>
                            <th className="px-4 py-2.5 text-right font-semibold text-slate-500 uppercase tracking-wider">vs Prev</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {[...trends].reverse().map((t, i, arr) => {
                            const prev = arr[i + 1]?.count;
                            const diff = prev != null ? t.count - prev : null;
                            const pos = diff != null && diff >= 0;
                            return (
                                <tr key={t.month} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-2.5 font-medium text-slate-700">{t.month}</td>
                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 tabular-nums">{t.count.toLocaleString()}</td>
                                    <td className="px-4 py-2.5 text-right tabular-nums">
                                        {diff != null ? (
                                            <span className={`inline-flex items-center gap-0.5 font-semibold ${pos ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {pos ? <ArrowUpRight size={10} /> : <ArrowUpRight size={10} className="rotate-90" />}
                                                {pos ? '+' : ''}{diff.toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300">—</span>
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
