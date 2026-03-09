import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Users, Award, Package, Inbox, CheckCircle2, Zap, Activity, ShieldCheck,
  Calendar, Download, RefreshCw, AlertCircle, TrendingUp, Clock, Eye,
  Filter, ChevronDown, MoreHorizontal, BookOpen
} from 'lucide-react';
import { fetchDashboardData, type DashboardFilters } from '@/api/analytics';
import { useNavigate } from 'react-router-dom';
import { type DashboardData } from '@/types/analytics';
import { type Students } from '@/types/students';
import MetricCard from '@/components/SubComponents/MetricCard';
import { VelocityChart } from '@/components/Charts/VelocityChart';
import { DistributionChart } from '@/components/Charts/DistributionChart';
import { TallyChart } from '@/components/Charts/TallyChart';
import { MetricDetailModal, type MetricModalMeta } from '@/components/dashboard/MetricDetailModal';
import { TallyDetailModal } from '@/components/dashboard/TallyDetailModal';
import { VelocityDetailModal } from '@/components/dashboard/VelocityDetailModal';
import { DistributionDetailModal } from '@/components/dashboard/DistributionDetailModal';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useStudents } from '@/context/StudentContext';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

const ErrorBoundary = ({ error, retry }: { error: any; retry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
    <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
    <div className="flex-1">
      <h3 className="font-semibold text-red-900 mb-1">Failed to load dashboard</h3>
      <p className="text-sm text-red-800 mb-3">
        {error?.message || 'An unexpected error occurred while fetching dashboard data'}
      </p>
      <button
        onClick={retry}
        className="text-sm font-medium px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);

const DataFreshness = ({ timestamp, isLoading }: { timestamp: Date | null; isLoading: boolean }) => {
  const [timeAgo, setTimeAgo] = useState('just now');

  useEffect(() => {
    if (!timestamp) return;
    const updateTimeAgo = () => {
      const diff = Date.now() - new Date(timestamp).getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      if (minutes < 1) setTimeAgo('just now');
      else if (minutes < 60) setTimeAgo(`${minutes}m ago`);
      else setTimeAgo(`${hours}h ago`);
    };
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
      <Clock size={12} />
      <span>{isLoading ? 'updating...' : timeAgo}</span>
    </div>
  );
};

const DateRangePicker = ({ onRangeChange, currentRange }: { onRangeChange: (r: any) => void; currentRange: any }) => {
  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'Last 1 year', days: 365 },
  ];

  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const applyCustomRange = () => {
    if (customStart && customEnd) {
      onRangeChange({
        days: 0,
        label: `${customStart} — ${customEnd}`,
        startDate: customStart,
        endDate: customEnd,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[180px] truncate">{currentRange.label || 'Date Range'}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Quick Presets</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={currentRange.days?.toString() || ''}
          onValueChange={(val) => {
            const days = parseInt(val);
            setShowCustom(false);
            onRangeChange({ days, label: presets.find(p => p.days === days)?.label });
          }}
        >
          {presets.map(preset => (
            <DropdownMenuRadioItem key={preset.days} value={preset.days.toString()}>
              {preset.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Custom Range</DropdownMenuLabel>
        <div className="px-2 pb-2 space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase w-10 shrink-0">From</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="flex-1 h-8 px-2 text-xs border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase w-10 shrink-0">To</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="flex-1 h-8 px-2 text-xs border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <Button
            size="sm"
            className="w-full h-8 text-[10px] font-bold uppercase tracking-widest"
            disabled={!customStart || !customEnd}
            onClick={applyCustomRange}
          >
            Apply Range
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DepartmentFilter = ({ departments, selectedDept, onChange }: { departments: string[]; selectedDept: string | null; onChange: (d: string | null) => void }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span>{selectedDept || 'All Departments'}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Departments</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={selectedDept || "all"}
          onValueChange={(val) => onChange(val === "all" ? null : val)}
        >
          <DropdownMenuRadioItem value="all">
            All Departments
          </DropdownMenuRadioItem>
          {departments?.map(dept => (
            <DropdownMenuRadioItem key={dept} value={dept}>
              {dept}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Dashboard = () => {
  const { allStudents, loading: studentsLoading } = useStudents();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<any>({ label: 'Last 30 days', days: 30 });
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [availableDepts, setAvailableDepts] = useState<string[]>([]);
  const [visibleMetrics, setVisibleMetrics] = useState({
    totalRecords: true,
    newThisWeek: true,
    issuedCards: true,
    userGrowth: true,
  });

  const [metricModal, setMetricModal] = useState<MetricModalMeta | null>(null);
  const [tallyModalOpen, setTallyModalOpen] = useState(false);
  const [tallyFocusDept, setTallyFocusDept] = useState<string | null>(null);
  const [velocityModalOpen, setVelocityModalOpen] = useState(false);
  const [distModalOpen, setDistModalOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);

      abortControllerRef.current = new AbortController();

      const filters: DashboardFilters = {
        days: dateRange.days,
        ...(selectedDept && { department: selectedDept }),
      };

      const response = await fetchDashboardData(filters);

      if (!response?.summary) {
        throw new Error('Invalid data format received from server');
      }

      setData(response);
      setLastUpdate(new Date());
      setError(null);

      const depts = response.departments.full_list.map(d => d.name);
      setAvailableDepts(depts);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        console.error('Dashboard fetch failed:', err);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange.days, selectedDept]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleDateRangeChange = (range: { days: number; label: string }) => {
    setDateRange(range);
  };

  const handleDepartmentChange = (dept: string | null) => {
    setSelectedDept(dept);
  };

  const handleExport = () => {
    navigate('/reports/export');
  };

  const toggleMetricVisibility = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  const recentStudents = useMemo(() => {
    if (!allStudents) return [];
    return [...allStudents]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [allStudents]);

  if (error) {
    return (
      <div className="p-8 bg-zinc-50 min-h-screen">
        <ErrorBoundary error={error} retry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-950 font-sans selection:bg-primary/10">
      <div className="px-2 py-2 lg:px-6 lg:py-6 max-w-[1600px] mx-auto">

        {/* ── PAGE HEADER ────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80">Overview</span>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80">Reports</span>
            </div>
            <div className="flex items-center gap-5">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Dashboard</h1>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-[0.1em]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DataFreshness timestamp={lastUpdate} isLoading={isRefreshing} />
            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-lg group hover:border-primary/50 transition-all">
              <ShieldCheck className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

        {/* ── TOOLBAR ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-10 p-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <DateRangePicker onRangeChange={handleDateRangeChange} currentRange={dateRange} />
            <DepartmentFilter
              departments={availableDepts}
              selectedDept={selectedDept}
              onChange={handleDepartmentChange}
            />
          </div>

          <div className="flex items-center gap-2 md:ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={loading}
              className="gap-2 h-9 bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Reports
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 h-9 px-6 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider text-[10px]"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Updating...' : 'Refresh'}
            </Button>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900 hover:bg-slate-50">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200 text-slate-950">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest opacity-40">Display Options</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                {([
                  { key: 'totalRecords' as const, label: 'Total Students' },
                  { key: 'newThisWeek' as const, label: 'New activity' },
                  { key: 'issuedCards' as const, label: 'Cards Printed' },
                  { key: 'userGrowth' as const, label: 'Growth' },
                ]).map(({ key, label }) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => toggleMetricVisibility(key)}
                    className="flex items-center justify-between text-xs font-semibold py-2 hover:bg-slate-50"
                  >
                    {label}
                    {visibleMetrics[key] && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── DASHBOARD CONTENT ───────────────────────────────────── */}
        {loading ? (
          <DashboardSkeleton />
        ) : data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {visibleMetrics.totalRecords && (
                <MetricCard
                  title="Total Students"
                  value={data.summary.total_records}
                  icon={Users}
                  color="blue"
                  chartData={data.trends}
                  trendLabel="Records"
                  trend="up"
                  onClick={() => setMetricModal({
                    key: 'totalRecords', title: 'Total Students',
                    value: data.summary.total_records, trendLabel: 'Total count',
                    strokeColor: '#3b82f6', trends: data.trends,
                    distribution: data.departments.full_list.map(d => ({ name: d.name, value: d.total })),
                  })}
                />
              )}
              {visibleMetrics.newThisWeek && (
                <MetricCard
                  title="New Activity"
                  value={data.summary.new_this_week}
                  icon={Inbox}
                  color="amber"
                  chartData={data.trends.slice(-3)}
                  trendLabel="New this week (Mon–Today)"
                  trend="up"
                  onClick={() => setMetricModal({
                    key: 'newThisWeek', title: 'New Activity',
                    value: data.summary.new_this_week, trendLabel: 'Weekly growth',
                    strokeColor: '#f59e0b', trends: data.trends,
                    distribution: data.departments.full_list.map(d => ({ name: d.name, value: Math.round(d.total * 0.15) })), // Mocking periodic activity
                  })}
                />
              )}
              {visibleMetrics.issuedCards && (
                <MetricCard
                  title="Cards Printed"
                  value={data.summary.issued_cards}
                  icon={Award}
                  color="emerald"
                  chartData={data.trends}
                  trendLabel="Status"
                  trend="neutral"
                  onClick={() => navigate('/applicants?filter=recently-issued')}
                />
              )}
              {visibleMetrics.userGrowth && (
                <MetricCard
                  title="Growth"
                  value={data.summary.user_growth}
                  icon={TrendingUp}
                  color="indigo"
                  chartData={data.trends}
                  trendLabel="Trend"
                  trend="up"
                  onClick={() => setMetricModal({
                    key: 'userGrowth', title: 'Growth',
                    value: data.summary.user_growth, trendLabel: 'Growth trend',
                    strokeColor: '#6366f1', trends: data.trends,
                  })}
                />
              )}
            </div>

            <div className="flex items-center gap-4 mb-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Activity & Stats</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-10">
              <div className="lg:col-span-5 h-[340px]">
                <VelocityChart
                  title="Student Activity"
                  data={data.trends}
                  onViewDetails={() => setVelocityModalOpen(true)}
                />
              </div>
              <div className="lg:col-span-5 h-[340px]">
                <TallyChart
                  title="Departments"
                  data={data.departments.full_list}
                  onViewDetails={() => { setTallyFocusDept(null); setTallyModalOpen(true); }}
                  onBarClick={(dept) => { setTallyFocusDept(dept); setTallyModalOpen(true); }}
                />
              </div>
              <div className="lg:col-span-2 h-[340px]">
                <DistributionChart
                  title="Share"
                  data={data.departments.full_list}
                  onViewDetails={() => setDistModalOpen(true)}
                  onSliceClick={(deptName) => navigate(`/departments?dept=${encodeURIComponent(deptName)}`)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Recent Applicants</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <Card className="border-slate-200 overflow-hidden shadow-sm shadow-slate-100">
              <CardContent className="p-0">
                <div className="overflow-x-auto text-slate-900 font-sans">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Number</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applied on</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentsLoading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-50 rounded" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-50 rounded" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-50 rounded" /></td>
                          </tr>
                        ))
                      ) : recentStudents.length > 0 ? (
                        recentStudents.map((student: Students) => (
                          <tr
                            key={student.id}
                            onClick={() => {
                              if (!student.has_card) {
                                navigate(`/card-management?select=${encodeURIComponent(student.id_number)}`);
                              } else {
                                navigate(`/applicants?search=${encodeURIComponent(student.id_number)}`);
                              }
                            }}
                            className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                  {student.first_name[0]}{student.last_name[0]}
                                </div>
                                <span className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors">{student.first_name} {student.last_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{student.id_number}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${student.has_card
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                {student.has_card ? 'Issued' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-bold text-primary uppercase">
                              {new Date(student.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-xs font-bold text-slate-300 uppercase italic">
                            No recent activity found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <MetricDetailModal
        open={!!metricModal}
        onClose={() => setMetricModal(null)}
        meta={metricModal}
      />
      <VelocityDetailModal
        open={velocityModalOpen}
        onClose={() => setVelocityModalOpen(false)}
        data={data?.trends ?? []}
        auditLog={allStudents || []}
      />
      <TallyDetailModal
        open={tallyModalOpen}
        onClose={() => { setTallyModalOpen(false); setTallyFocusDept(null); }}
        data={data?.departments.full_list ?? []}
        focusDept={tallyFocusDept}
      />
      <DistributionDetailModal
        open={distModalOpen}
        onClose={() => setDistModalOpen(false)}
        data={data?.departments.full_list ?? []}
      />

    </div>
  );
};

export default Dashboard;
