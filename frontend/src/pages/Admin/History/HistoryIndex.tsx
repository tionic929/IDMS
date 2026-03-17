import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Clock, Search, Download, RefreshCw,
    Shield, Info, AlertTriangle, Database,
    FileText, Zap
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import MetricCard from "@/components/SubComponents/MetricCard";
import api from "@/api/axios";

// Shared data and child components
import { logs } from './logsData';
import type { LogEntry } from './logsData';
import ActivityLogs from './components/ActivityLogs';
import SystemLogs from './components/SystemLogs';

const HistoryIndex = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (activeTab === 'system') params.type = 'system';
            else if (activeTab === 'activity') params.type = 'activity';
            
            if (searchQuery) params.query = searchQuery;

            const response = await api.get('/activity-logs', { params });
            setLogs(response.data.data);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [activeTab, searchQuery]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchLogs();
    }, [fetchLogs]);

    const metrics = useMemo(() => {
        const total = logs.length;
        const security = logs.filter(l => l.type === 'auth' || l.status === 'warning').length;
        const success = logs.filter(l => l.status === 'success').length;
        return { total, security, success };
    }, [logs]);

    const filteredLogs = logs; // Filtering is handled by API now

    return (
        <div className="flex-1 bg-background text-foreground font-sans selection:bg-primary/10 transition-colors duration-300 flex flex-col min-h-full">
            <div className="px-6 py-2">

                {/* ── PAGE HEADER ────────────────────────────────────────── */}
                <div className="mb-8">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Audit Trail / Monitoring</span>
                    <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-5">
                            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">History</h1>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-[0.1em]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Monitoring Active
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/history/export`, '_blank')}
                                className="gap-2 h-9 bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="gap-2 h-9 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[11px]"
                            >
                                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                                {isRefreshing ? 'Refreshing…' : 'Refresh'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── SEARCH + FILTER BAR ────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search logs by user, action, or date…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 border-border bg-card shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary rounded-lg"
                        />
                    </div>

                    <div className="w-full sm:w-[350px]">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid grid-cols-3 h-10 bg-card border border-border p-1 rounded-lg">
                                <TabsTrigger value="all" className="text-[10px] uppercase font-black tracking-widest">All Logs</TabsTrigger>
                                <TabsTrigger value="activity" className="text-[10px] uppercase font-black tracking-widest">Activities</TabsTrigger>
                                <TabsTrigger value="system" className="text-[10px] uppercase font-black tracking-widest">System</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* ── SUMMARY CARDS ──────────────────────────────────────── */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <MetricCard
                        icon={Clock}
                        title="Total Events"
                        value={metrics.total}
                        color="blue"
                        trend="up"
                        trendLabel="Logged today"
                    />
                    <MetricCard
                        icon={Shield}
                        title="Security Alerts"
                        value={metrics.security}
                        color="amber"
                        trend="neutral"
                        trendLabel="Auth attempts"
                    />
                    <MetricCard
                        icon={Zap}
                        title="Successful Ops"
                        value={metrics.success}
                        color="emerald"
                        trend="up"
                        trendLabel="Verified actions"
                    />
                </section>

                {/* ── LOGS DISPLAY ───────────────────────────────────────── */}
                <div className="space-y-5 mb-10">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Audit Timeline</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="min-h-[400px]">
                        {activeTab === 'system' ? (
                            <SystemLogs logs={filteredLogs} onViewDetails={setSelectedLog} />
                        ) : activeTab === 'activity' ? (
                            <ActivityLogs logs={filteredLogs} onViewDetails={setSelectedLog} />
                        ) : (
                            <ActivityLogs logs={filteredLogs} onViewDetails={setSelectedLog} />
                        )}
                    </div>
                </div>
            </div>

            {/* AUDIT DETAIL DIALOG */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="sm:max-w-xl bg-card border-border shadow-2xl rounded-xl p-0 overflow-hidden">
                    <div className="p-8 space-y-8">
                        <DialogHeader>
                            <div className="flex items-center justify-between mb-4">
                                <Badge className={cn(
                                    "text-[10px] uppercase font-black px-3 py-1",
                                    selectedLog?.status === 'success' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                    selectedLog?.status === 'warning' && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                                    selectedLog?.status === 'info' && "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                )}>
                                    {selectedLog?.status} Audit
                                </Badge>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{selectedLog?.date}</span>
                            </div>
                            <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight leading-7">
                                {selectedLog?.action}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground font-medium pt-2">
                                Transaction ID: LOG-RES-00{selectedLog?.id}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-6 bg-muted/20 p-6 rounded-lg border border-border">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Initiated By</span>
                                <p className="text-xs font-black text-foreground uppercase">{selectedLog?.user}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">IP Address</span>
                                <p className="text-xs font-bold font-mono text-primary">{selectedLog?.ip}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Category</span>
                                <p className="text-xs font-black text-foreground uppercase">{selectedLog?.type}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Source</span>
                                <p className="text-xs font-black text-foreground uppercase">ADMIN_PORTAL</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-80 flex items-center gap-2">
                                <Info size={12} className="text-primary" />
                                Action Details
                            </span>
                            <div className="bg-muted px-5 py-4 rounded-lg text-sm text-foreground font-medium border border-border/50 shadow-inner">
                                {selectedLog?.details}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button variant="outline" onClick={() => setSelectedLog(null)} className="rounded-lg h-11 px-8 text-[10px] font-black uppercase tracking-widest">
                                Close Audit
                            </Button>
                            <Button className="rounded-lg h-11 px-8 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Download size={14} className="mr-2" />
                                Download Log
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default HistoryIndex;
