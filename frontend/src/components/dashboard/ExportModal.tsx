import React, { useState, useEffect } from 'react';
import {
    X, Download, FileSpreadsheet, Calendar, Filter,
    ArrowUpDown, BarChart3, Users, Loader2, ListOrdered
} from 'lucide-react';
import { exportSpreadsheet } from '@/api/analytics';
import type { DashboardFilters } from '@/api/analytics';

interface ExportModalProps {
    open: boolean;
    onClose: () => void;
    departments: string[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ open, onClose, departments }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [department, setDepartment] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [exporting, setExporting] = useState<'summary' | 'full' | 'students' | null>(null);

    // Set default dates on open
    useEffect(() => {
        if (open) {
            const now = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            setEndDate(now.toISOString().split('T')[0]);
            setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
        }
    }, [open]);

    // Escape key
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Scroll lock
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const handleExport = async (type: 'summary' | 'full' | 'students') => {
        setExporting(type);
        try {
            const filters: DashboardFilters & { type?: string; sortBy?: string; sortDir?: string } = {
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                department: department || undefined,
            };

            // Build query params manually to include type, sort_by, sort_dir
            const params = new URLSearchParams();
            params.append('type', type);
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (department) params.append('department', department);
            params.append('sort_by', sortBy);
            params.append('sort_dir', sortDir);

            // Direct API call via import
            const { default: api } = await import('@/api/axios');
            const response = await api.get('/analytics/export', {
                params: Object.fromEntries(params.entries()),
                responseType: 'blob',
                headers: {
                    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });

            // Check for JSON error response
            const contentType = response.headers['content-type'] || '';
            if (contentType.includes('application/json')) {
                const text = await (response.data as Blob).text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.error || 'Server returned an error');
            }

            const disposition = response.headers['content-disposition'];
            const typeLabel = type === 'summary' ? 'Summary' : type === 'students' ? 'Students' : 'Report';
            let fileName = `IDMS-${typeLabel}-${new Date().toISOString().split('T')[0]}.xlsx`;
            if (disposition) {
                const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match?.[1]) fileName = match[1].replace(/['"]/g, '');
            }

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export spreadsheet. Check that the backend is running.');
        } finally {
            setExporting(null);
        }
    };

    const quickRange = (days: number | 'all') => {
        if (days === 'all') {
            setStartDate('');
            setEndDate('');
            return;
        }
        const now = new Date();
        const from = new Date();
        from.setDate(now.getDate() - days);
        setStartDate(from.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg bg-card rounded-lg shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden animate-[modal-in_0.18s_ease-out]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border flex-shrink-0 bg-muted/50">
                    <div>
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            <h2 className="text-base font-bold text-foreground uppercase tracking-wider">Export Spreadsheet</h2>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Configure and download your report</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    {/* Date Range */}
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                            <Calendar className="h-3 w-3 inline mr-1.5" />
                            Date Range
                        </label>
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="flex-1 h-9 px-3 text-xs border border-border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                            <span className="text-[10px] font-bold text-muted-foreground/30 uppercase">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="flex-1 h-9 px-3 text-xs border border-border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {[
                                { label: '7d', days: 7 as number | 'all' },
                                { label: '30d', days: 30 as number | 'all' },
                                { label: '90d', days: 90 as number | 'all' },
                                { label: '6mo', days: 180 as number | 'all' },
                                { label: '1yr', days: 365 as number | 'all' },
                                { label: 'All-time', days: 'all' as number | 'all' },
                            ].map(p => (
                                <button
                                    key={String(p.days)}
                                    onClick={() => quickRange(p.days)}
                                    className="flex-1 min-w-[48px] h-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 border border-border rounded-md hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Department */}
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                            <Filter className="h-3 w-3 inline mr-1.5" />
                            Department
                        </label>
                        <select
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            className="w-full h-9 px-3 text-xs border border-border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
                        >
                            <option value="">All Departments</option>
                            {departments.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                            <ArrowUpDown className="h-3 w-3 inline mr-1.5" />
                            Sort By
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="flex-1 h-9 px-3 text-xs border border-border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
                            >
                                <option value="name">Name (Last, First)</option>
                                <option value="date">Date Applied</option>
                                <option value="course">Course / Department</option>
                                <option value="status">Status</option>
                            </select>
                            <select
                                value={sortDir}
                                onChange={e => setSortDir(e.target.value)}
                                className="w-28 h-9 px-3 text-xs border border-border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
                            >
                                <option value="asc">A → Z</option>
                                <option value="desc">Z → A</option>
                            </select>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Choose Export Type</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Export Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Summary Export */}
                        <button
                            onClick={() => handleExport('summary')}
                            disabled={!!exporting}
                            className="group relative flex flex-col items-center gap-2.5 p-4 rounded-lg border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {exporting === 'summary' ? (
                                <Loader2 className="h-7 w-7 text-primary animate-spin" />
                            ) : (
                                <BarChart3 className="h-7 w-7 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            )}
                            <div className="text-center">
                                <div className="text-[11px] font-bold text-foreground uppercase tracking-wider">Summary</div>
                                <div className="text-[9px] text-muted-foreground mt-0.5">Stats & tally</div>
                            </div>
                        </button>

                        {/* Students Only Export */}
                        <button
                            onClick={() => handleExport('students')}
                            disabled={!!exporting}
                            className="group relative flex flex-col items-center gap-2.5 p-4 rounded-lg border-2 border-border bg-card hover:border-emerald-500 hover:bg-emerald-500/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {exporting === 'students' ? (
                                <Loader2 className="h-7 w-7 text-emerald-500 animate-spin" />
                            ) : (
                                <ListOrdered className="h-7 w-7 text-muted-foreground/40 group-hover:text-emerald-500 transition-colors" />
                            )}
                            <div className="text-center">
                                <div className="text-[11px] font-bold text-foreground uppercase tracking-wider">Students</div>
                                <div className="text-[9px] text-muted-foreground mt-0.5">Flat student list</div>
                            </div>
                        </button>

                        {/* Full Report Export */}
                        <button
                            onClick={() => handleExport('full')}
                            disabled={!!exporting}
                            className="group relative flex flex-col items-center gap-2.5 p-4 rounded-lg border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {exporting === 'full' ? (
                                <Loader2 className="h-7 w-7 text-primary animate-spin" />
                            ) : (
                                <Users className="h-7 w-7 text-primary/60 group-hover:text-primary transition-colors" />
                            )}
                            <div className="text-center">
                                <div className="text-[11px] font-bold text-foreground uppercase tracking-wider">Full Report</div>
                                <div className="text-[9px] text-muted-foreground mt-0.5">All + per-dept</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
        </div>
    );
};
