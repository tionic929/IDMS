import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Users, Award, Package, Inbox, CheckCircle2, Zap, Activity, ShieldCheck,
  Calendar, Download, RefreshCw, AlertCircle, TrendingUp, Clock, Eye,
  Filter, ChevronDown
} from 'lucide-react';
import { fetchDashboardData, exportDashboardAsCSV, type DashboardFilters } from '../api/analytics';
import { type DashboardData } from '../types/analytics';
import MetricCard from '../components/SubComponents/MetricCard';
import { VelocityChart } from '../components/Charts/VelocityChart';
import { DistributionChart } from '../components/Charts/DistributionChart';
import { TallyChart } from '../components/Charts/TallyChart';
import { MetricDetailModal, type MetricModalMeta } from '../components/dashboard/MetricDetailModal';
import { TallyDetailModal } from '../components/dashboard/TallyDetailModal';
import { VelocityDetailModal } from '../components/dashboard/VelocityDetailModal';
import { DistributionDetailModal } from '../components/dashboard/DistributionDetailModal';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

const SkeletonLoader = ({ width = 'w-full', height = 'h-12', count = 1 }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className={`${width} ${height} bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-lg animate-pulse`}
        style={{
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite',
        }}
      />
    ))}
  </div>
);

const ErrorBoundary = ({ error, retry }) => (
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

const DataFreshness = ({ timestamp, isLoading }) => {
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
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
      <Clock size={12} />
      <span>{isLoading ? 'updating...' : timeAgo}</span>
    </div>
  );
};

const DateRangePicker = ({ onRangeChange, currentRange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];

  const handlePreset = (days) => {
    onRangeChange({ days, label: presets.find(p => p.days === days)?.label });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 bg-white"
      >
        <Calendar size={16} />
        <span>{currentRange.label || 'Date Range'}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
          <div className="p-3 space-y-2">
            {presets.map(preset => (
              <button
                key={preset.days}
                onClick={() => handlePreset(preset.days)}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-slate-700"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DepartmentFilter = ({ departments, selectedDept, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 bg-white"
      >
        <Filter size={16} />
        <span>{selectedDept || 'All Departments'}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
          <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-slate-700 font-medium"
            >
              All Departments
            </button>
            {departments?.map(dept => (
              <button
                key={dept}
                onClick={() => {
                  onChange(dept);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${selectedDept === dept
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'hover:bg-slate-50 text-slate-700'
                  }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 px-4 rounded-lg shadow-xl text-xs font-semibold">
        {payload[0].value.toLocaleString()} {payload[0].name}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({ label: 'Last 30 days', days: 30 });
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [availableDepts, setAvailableDepts] = useState<string[]>([]);
  const [visibleMetrics, setVisibleMetrics] = useState({
    totalRecords: true,
    newThisWeek: true,
    issuedCards: true,
    userGrowth: true,
  });

  // ── Modal state ────────────────────────────────────────────────────────────
  const [metricModal, setMetricModal] = useState<MetricModalMeta | null>(null);
  const [tallyModalOpen, setTallyModalOpen] = useState(false);
  const [tallyFocusDept, setTallyFocusDept] = useState<string | null>(null);
  const [velocityModalOpen, setVelocityModalOpen] = useState(false);
  const [distModalOpen, setDistModalOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch dashboard data with filters
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

      // Extract available departments from response
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

  // Initial load
  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Auto-refresh every 2 minutes
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
    if (data) {
      try {
        exportDashboardAsCSV(data);
      } catch (err) {
        console.error('Export failed:', err);
        alert('Failed to export data');
      }
    }
  };

  const toggleMetricVisibility = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  if (error) {
    return (
      <div className="p-8 bg-zinc-50 min-h-screen">
        <ErrorBoundary error={error} retry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 min-h-screen text-zinc-900 font-sans">
      <div className="px-6 py-6 lg:px-8 lg:py-8 max-w-screen-2xl mx-auto">

        {/* ── PAGE HEADER ────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

            {/* Left: breadcrumb + title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Admin</span>
                <span className="text-zinc-300">/</span>
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-zinc-950">Dashboard</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium mt-1">
                Operational Intelligence · {new Date().getFullYear()}
              </p>
            </div>

            {/* Right: status + icon */}
            <div className="flex items-center gap-3 sm:self-start">
              <DataFreshness timestamp={lastUpdate} isLoading={isRefreshing} />
              <div className="h-9 w-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                <ShieldCheck size={16} className="text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ── TOOLBAR ─────────────────────────────────────────────── */}
        <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 mb-6 flex flex-wrap items-center gap-2 shadow-sm">
          <DateRangePicker onRangeChange={handleDateRangeChange} currentRange={dateRange} />
          <DepartmentFilter
            departments={availableDepts}
            selectedDept={selectedDept}
            onChange={handleDepartmentChange}
          />

          <div className="w-px h-5 bg-zinc-200 hidden sm:block mx-1" />

          <button
            onClick={handleExport}
            disabled={loading || !data}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors text-xs font-semibold text-zinc-600 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={13} />
            Export CSV
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>

          {/* Metric visibility toggles */}
          <div className="ml-auto flex items-center gap-1.5 flex-wrap">
            {([
              { key: 'totalRecords' as const, label: 'Records' },
              { key: 'newThisWeek' as const, label: 'Weekly' },
              { key: 'issuedCards' as const, label: 'Cards' },
              { key: 'userGrowth' as const, label: 'Growth' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleMetricVisibility(key)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all border ${visibleMetrics[key]
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300'
                  }`}
              >
                {visibleMetrics[key] ? <Eye size={9} className="inline mr-1" /> : null}{label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SECTION LABEL ── */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Key Metrics</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        {/* ── METRIC CARDS ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-zinc-200 h-40">
                  <SkeletonLoader count={3} />
                </div>
              ))}
            </>
          ) : data ? (
            <>
              {visibleMetrics.totalRecords && (
                <div className="group relative">
                  <button
                    className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-xl"
                    onClick={() => setMetricModal({
                      key: 'totalRecords', title: 'Total Records',
                      value: data.summary.total_records, trendLabel: 'All-time enrollments',
                      strokeColor: '#3b82f6', trends: data.trends,
                    })}
                  >
                    <MetricCard
                      title="Total Records"
                      value={data.summary.total_records}
                      icon={Users}
                      color="bg-blue-600"
                      chartData={data.trends}
                      trendLabel="All-time records"
                      trend="up"
                    />
                  </button>
                </div>
              )}
              {visibleMetrics.newThisWeek && (
                <div className="group relative">
                  <button
                    className="w-full text-left focus:outline-none focus:ring-2 focus:ring-amber-300 rounded-xl"
                    onClick={() => setMetricModal({
                      key: 'newThisWeek', title: 'New This Week',
                      value: data.summary.new_this_week, trendLabel: 'Weekly intake',
                      strokeColor: '#f59e0b', trends: data.trends,
                    })}
                  >
                    <MetricCard
                      title="New This Week"
                      value={data.summary.new_this_week}
                      icon={Inbox}
                      color="bg-amber-500"
                      chartData={data.trends.slice(-3)}
                      trendLabel="Weekly intake"
                      trend="up"
                    />
                  </button>
                </div>
              )}
              {visibleMetrics.issuedCards && (
                <div className="group relative">
                  <button
                    className="w-full text-left focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded-xl"
                    onClick={() => setMetricModal({
                      key: 'issuedCards', title: 'Cards Issued',
                      value: data.summary.issued_cards, trendLabel: 'Production status',
                      strokeColor: '#10b981', trends: data.trends,
                    })}
                  >
                    <MetricCard
                      title="Cards Issued"
                      value={data.summary.issued_cards}
                      icon={Award}
                      color="bg-emerald-500"
                      chartData={data.trends}
                      trendLabel="Production output"
                      trend="neutral"
                    />
                  </button>
                </div>
              )}
              {visibleMetrics.userGrowth && (
                <div className="group relative">
                  <button
                    className="w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-xl"
                    onClick={() => setMetricModal({
                      key: 'userGrowth', title: 'User Growth',
                      value: data.summary.user_growth, trendLabel: 'New users this week',
                      strokeColor: '#6366f1', trends: data.trends,
                    })}
                  >
                    <MetricCard
                      title="User Growth"
                      value={data.summary.user_growth}
                      icon={TrendingUp}
                      color="bg-indigo-600"
                      chartData={data.trends}
                      trendLabel="New users this week"
                      trend="up"
                    />
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* ── SECTION LABEL ── */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Analytics</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        {/* ── CHARTS ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
            <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-zinc-200 h-80">
              <SkeletonLoader height="h-72" />
            </div>
            <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-zinc-200 h-80">
              <SkeletonLoader height="h-72" />
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-zinc-200 h-80">
              <SkeletonLoader height="h-72" />
            </div>
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
            <div className="lg:col-span-5">
              <VelocityChart
                data={data.trends}
                onViewDetails={() => setVelocityModalOpen(true)}
              />
            </div>
            <div className="lg:col-span-5">
              <TallyChart
                data={data.departments.full_list}
                onViewDetails={() => { setTallyFocusDept(null); setTallyModalOpen(true); }}
                onBarClick={(dept) => { setTallyFocusDept(dept); setTallyModalOpen(true); }}
              />
            </div>
            <div className="lg:col-span-2">
              <DistributionChart
                data={data.departments.full_list}
                onViewDetails={() => setDistModalOpen(true)}
              />
            </div>
          </div>
        ) : null}

        {/* ── STATUS BAR ──────────────────────────────────────────── */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Total Records</p>
              <p className="text-sm font-black text-white tabular-nums flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {data?.summary.total_records.toLocaleString() ?? '—'}
              </p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Departments</p>
              <p className="text-sm font-black text-blue-400 tabular-nums">
                {data?.departments.full_list.length ?? 0} active
              </p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Cards Issued</p>
              <p className="text-sm font-black text-emerald-400 tabular-nums">
                {data?.summary.issued_cards.toLocaleString() ?? '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-zinc-500">
              💡 Click any metric card for details
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest border border-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              <RefreshCw size={10} className={isRefreshing ? 'animate-spin text-white' : 'text-zinc-400'} />
              <span className="text-zinc-300">{isRefreshing ? 'Refreshing' : 'Refresh'}</span>
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      {/* ── MODALS ── */}
      <MetricDetailModal
        open={!!metricModal}
        onClose={() => setMetricModal(null)}
        meta={metricModal}
      />
      <VelocityDetailModal
        open={velocityModalOpen}
        onClose={() => setVelocityModalOpen(false)}
        data={data?.trends ?? []}
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
