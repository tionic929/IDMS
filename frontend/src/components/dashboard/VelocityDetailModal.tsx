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
import type { Students } from '../../types/students';

export const VelocityDetailModal: React.FC<{
    open: boolean;
    onClose: () => void;
    data: TrendData[];
    auditLog?: Students[];
}> = ({ open, onClose, data, auditLog }) => {
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
            title="Performance History"
            subtitle="Enrollment trends over time · Full dataset"
            size="xl"
        >
            {/* Summary hero */}
            {stats && (
                <>
                    <div className="flex items-end gap-3 mb-8">
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Rate</p>
                            <p className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">{stats.last.toLocaleString()}</p>
                        </div>
                        <span className={`pb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${stats.positive ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                            {stats.positive ? '▲' : '▼'} {stats.pct}% vs prev
                        </span>
                    </div>

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
                </>
            )}

            {/* Full chart */}
            <div className="h-72 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                        <defs>
                            <linearGradient id="vd-fill" x1="0" y1="0" x2="0" y2="1">
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
                            itemStyle={{ color: '#00928a' }}
                            formatter={(v: any) => [v.toLocaleString(), 'Rate']}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#00928a"
                            strokeWidth={2}
                            fill="url(#vd-fill)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#00928a', stroke: '#fff', strokeWidth: 2 }}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Period breakdown table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-[10px]">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-widest">Period</th>
                            <th className="px-4 py-3 text-right font-bold text-slate-400 uppercase tracking-widest">Count</th>
                            <th className="px-4 py-3 text-right font-bold text-slate-400 uppercase tracking-widest">Change</th>
                            <th className="px-4 py-3 text-right font-bold text-slate-400 uppercase tracking-widest">Trend</th>
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
                                <tr key={t.month} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-4 py-3 font-bold text-slate-600 uppercase group-hover:text-slate-900 transition-colors">{t.month}</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                                        {t.count.toLocaleString()}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold tabular-nums ${diff == null ? 'text-slate-200' : pos ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                        {diff != null ? `${pos ? '▲' : '▼'}${Math.abs(diff).toLocaleString()}` : '—'}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold tabular-nums ${pctStr == null ? 'text-slate-200' : parseFloat(pctStr) >= 0 ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                        {pctStr != null ? `${parseFloat(pctStr) >= 0 ? '▲' : '▼'}${Math.abs(parseFloat(pctStr))}%` : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {/* Audit Log (if provided) */}
            {auditLog && auditLog.length > 0 && (
                <div className="mt-12 space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Data Audit Log</span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-[9px] font-black uppercase tracking-widest text-slate-400">Identity</th>
                                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID Code</th>
                                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Unit</th>
                                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {auditLog.slice(0, 10).map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-3.5">
                                            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{s.first_name} {s.last_name}</div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <div className="text-[11px] font-mono font-bold text-primary">{s.id_number}</div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <div className="text-[10px] font-black text-slate-400 uppercase">{s.course}</div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <div className="text-[10px] font-bold text-slate-500">{new Date(s.created_at).toLocaleDateString()}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </DashboardModal>
    );
};
