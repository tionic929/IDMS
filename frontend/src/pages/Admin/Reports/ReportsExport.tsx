import React, { useState, useEffect } from 'react';
import {
    FileSpreadsheet, Calendar, Filter, ArrowUpDown,
    BarChart3, Users, Loader2, ListOrdered, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


interface ExportFilters {
    startDate: string;
    endDate: string;
    department: string;
    sortBy: string;
    sortDir: string;
}

function ReportsExport() {
    const [filters, setFilters] = useState<ExportFilters>({
        startDate: '',
        endDate: '',
        department: '',
        sortBy: 'name',
        sortDir: 'asc',
    });
    const [departments, setDepartments] = useState<string[]>([]);
    const [exporting, setExporting] = useState<'summary' | 'full' | 'students' | null>(null);

    // Set default dates
    useEffect(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        setFilters(f => ({
            ...f,
            endDate: now.toISOString().split('T')[0],
            startDate: thirtyDaysAgo.toISOString().split('T')[0],
        }));
    }, []);

    // Fetch departments
    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const { default: api } = await import('@/api/axios');
                const res = await api.get('/analytics/dashboard');
                const depts = res.data?.departments?.full_list?.map((d: any) => d.name) || [];
                setDepartments(depts);
            } catch {
                // silent
            }
        };
        fetchDepts();
    }, []);

    const quickRange = (days: number | 'all') => {
        if (days === 'all') {
            setFilters(f => ({ ...f, startDate: '', endDate: '' }));
            return;
        }
        const now = new Date();
        const from = new Date();
        from.setDate(now.getDate() - days);
        setFilters(f => ({
            ...f,
            startDate: from.toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0],
        }));
    };

    const handleExport = async (type: 'summary' | 'full' | 'students') => {
        setExporting(type);
        try {
            const params = new URLSearchParams();
            params.append('type', type);
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            if (filters.department) params.append('department', filters.department);
            params.append('sort_by', filters.sortBy);
            params.append('sort_dir', filters.sortDir);

            const { default: api } = await import('@/api/axios');
            const response = await api.get('/analytics/export', {
                params: Object.fromEntries(params.entries()),
                responseType: 'blob',
                headers: {
                    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });

            // Check for JSON error
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

    const rangePresets: { label: string; days: number | 'all' }[] = [
        { label: '7d', days: 7 },
        { label: '30d', days: 30 },
        { label: '90d', days: 90 },
        { label: '6mo', days: 180 },
        { label: '1yr', days: 365 },
        { label: 'All-time', days: 'all' },
    ];

    return (
        <div className="max-w-[1400px] mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Reports / Export</span>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Export Reports</h1>
                    <p className="text-muted-foreground font-medium text-sm">Generate and download formatted spreadsheet reports.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT — FILTERS */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-xl shadow-primary/5 bg-gradient-to-b from-card to-muted/20">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold">Report Filters</CardTitle>
                            <CardDescription className="text-xs">Configure date range, department, and sort order.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Date Range */}
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                                    <Calendar className="h-3 w-3 inline mr-1.5" />
                                    Date Range
                                </label>
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                        className="flex-1 h-9 px-3 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">to</span>
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                                        className="flex-1 h-9 px-3 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {rangePresets.map(p => (
                                        <button
                                            key={String(p.days)}
                                            onClick={() => quickRange(p.days)}
                                            className="flex-1 min-w-[48px] h-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 border border-border rounded-md hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
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
                                    value={filters.department}
                                    onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}
                                    className="w-full h-9 px-3 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
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
                                        value={filters.sortBy}
                                        onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                                        className="flex-1 h-9 px-3 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
                                    >
                                        <option value="name">Name (Last, First)</option>
                                        <option value="date">Date Applied</option>
                                        <option value="course">Course / Department</option>
                                        <option value="status">Status</option>
                                    </select>
                                    <select
                                        value={filters.sortDir}
                                        onChange={e => setFilters(f => ({ ...f, sortDir: e.target.value }))}
                                        className="w-28 h-9 px-3 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
                                    >
                                        <option value="asc">A → Z</option>
                                        <option value="desc">Z → A</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Export Guide */}
                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardContent className="p-6 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Export Guide</h4>
                            <ul className="grid gap-2">
                                {[
                                    { title: 'Summary', desc: 'Overall stats + department breakdown tally' },
                                    { title: 'Students', desc: 'Flat list of all student records' },
                                    { title: 'Full Report', desc: 'Summary + All Students + per-department sheets' },
                                ].map((item, i) => (
                                    <li key={i} className="text-[11px] font-medium flex items-start gap-2">
                                        <div className="h-1 w-1 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                                        <div>
                                            <span className="font-bold">{item.title}</span>
                                            <span className="text-muted-foreground"> — {item.desc}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT — EXPORT ACTIONS */}
                <div className="lg:col-span-8">
                    <Card className="border-none shadow-xl shadow-primary/5 h-full">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Download className="h-5 w-5 text-primary" />
                                Download Report
                            </CardTitle>
                            <CardDescription className="text-xs">Choose the type of report to export as a formatted XLSX spreadsheet.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

                                {/* Summary */}
                                <button
                                    onClick={() => handleExport('summary')}
                                    disabled={!!exporting}
                                    className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {exporting === 'summary' ? (
                                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                    ) : (
                                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <BarChart3 className="h-8 w-8 text-primary/60 group-hover:text-primary transition-colors" />
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-foreground uppercase tracking-wider">Summary</div>
                                        <div className="text-[10px] text-muted-foreground mt-1">Stats & department tally</div>
                                        <div className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-2">1 Sheet</div>
                                    </div>
                                </button>

                                {/* Students */}
                                <button
                                    onClick={() => handleExport('students')}
                                    disabled={!!exporting}
                                    className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-emerald-500 hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {exporting === 'students' ? (
                                        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                                    ) : (
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <ListOrdered className="h-8 w-8 text-emerald-500/60 group-hover:text-emerald-500 transition-colors" />
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-foreground uppercase tracking-wider">Students</div>
                                        <div className="text-[10px] text-muted-foreground mt-1">Full student list</div>
                                        <div className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-2">1 Sheet</div>
                                    </div>
                                </button>

                                {/* Full Report */}
                                <button
                                    onClick={() => handleExport('full')}
                                    disabled={!!exporting}
                                    className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {exporting === 'full' ? (
                                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                    ) : (
                                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Users className="h-8 w-8 text-primary/60 group-hover:text-primary transition-colors" />
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-foreground uppercase tracking-wider">Full Report</div>
                                        <div className="text-[10px] text-muted-foreground mt-1">All + per-department</div>
                                        <div className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-2">3+ Sheets</div>
                                    </div>
                                </button>

                            </div>

                            {/* Current filter summary */}
                            <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Filter Preview</span>
                                </div>
                                <div className="flex flex-wrap gap-3 text-[11px] font-medium text-foreground">
                                    <span>
                                        <span className="text-muted-foreground">Date:</span>{' '}
                                        {filters.startDate && filters.endDate
                                            ? `${filters.startDate} — ${filters.endDate}`
                                            : 'All time'}
                                    </span>
                                    <span className="text-border">|</span>
                                    <span>
                                        <span className="text-muted-foreground">Dept:</span>{' '}
                                        {filters.department || 'All'}
                                    </span>
                                    <span className="text-border">|</span>
                                    <span>
                                        <span className="text-muted-foreground">Sort:</span>{' '}
                                        {filters.sortBy} ({filters.sortDir})
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default ReportsExport;
