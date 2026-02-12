import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
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
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedDept === dept
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
      <div className="p-8 bg-slate-50 min-h-screen">
        <ErrorBoundary error={error} retry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="p-6 lg:p-8 mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
                Analytics Dashboard
              </h1>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-2">
                Operational Intelligence • {new Date().getFullYear()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">System Status</p>
                <p className="text-sm font-bold text-emerald-600">Operational</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                <ShieldCheck size={20} className="text-indigo-600" />
              </div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <DateRangePicker onRangeChange={handleDateRangeChange} currentRange={dateRange} />
            <DepartmentFilter
              departments={availableDepts}
              selectedDept={selectedDept}
              onChange={handleDepartmentChange}
            />
            <button
              onClick={handleExport}
              disabled={loading || !data}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <div className="ml-auto">
              <DataFreshness timestamp={lastUpdate} isLoading={isRefreshing} />
            </div>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-slate-200">
                  <SkeletonLoader count={3} />
                </div>
              ))}
            </>
          ) : data ? (
            <>
              {visibleMetrics.totalRecords && (
                <div className="group relative">
                  <MetricCard
                    title="Total Records"
                    value={data.summary.total_records}
                    icon={Users}
                    color="bg-blue-600"
                    chartData={data.trends}
                    trendLabel="+12% growth"
                  />
                  <button
                    onClick={() => toggleMetricVisibility('totalRecords')}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-100 rounded-lg"
                    aria-label="Hide metric"
                  >
                    <Eye size={14} className="text-slate-400" />
                  </button>
                </div>
              )}

              {visibleMetrics.newThisWeek && (
                <div className="group relative">
                  <MetricCard
                    title="New This Week"
                    value={data.summary.new_this_week}
                    icon={Inbox}
                    color="bg-amber-500"
                    chartData={data.trends.slice(-3)}
                    trendLabel="Weekly trend"
                  />
                  <button
                    onClick={() => toggleMetricVisibility('newThisWeek')}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-100 rounded-lg"
                    aria-label="Hide metric"
                  >
                    <Eye size={14} className="text-slate-400" />
                  </button>
                </div>
              )}

              {visibleMetrics.issuedCards && (
                <div className="group relative">
                  <MetricCard
                    title="Issued Cards"
                    value={data.summary.issued_cards}
                    icon={Award}
                    color="bg-emerald-500"
                    chartData={data.trends}
                    trendLabel="Production status"
                  />
                  <button
                    onClick={() => toggleMetricVisibility('issuedCards')}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-100 rounded-lg"
                    aria-label="Hide metric"
                  >
                    <Eye size={14} className="text-slate-400" />
                  </button>
                </div>
              )}

              {visibleMetrics.userGrowth && (
                <div className="group relative">
                  <MetricCard
                    title="User Growth"
                    value={data.summary.user_growth}
                    icon={TrendingUp}
                    color="bg-indigo-600"
                    chartData={data.trends}
                    trendLabel="New users this week"
                  />
                  <button
                    onClick={() => toggleMetricVisibility('userGrowth')}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-100 rounded-lg"
                    aria-label="Hide metric"
                  >
                    <Eye size={14} className="text-slate-400" />
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* CHARTS */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-slate-200">
              <SkeletonLoader height="h-80" count={1} />
            </div>
            <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-slate-200">
              <SkeletonLoader height="h-80" count={1} />
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200">
              <SkeletonLoader height="h-80" count={1} />
            </div>
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-5">
              <VelocityChart data={data.trends} />
            </div>
            <div className="lg:col-span-5">
              <TallyChart data={data.departments.full_list} />
            </div>
            <div className="lg:col-span-2">
              <DistributionChart data={data.departments.full_list} />
            </div>
          </div>
        ) : null}

        {/* FOOTER STATUS BAR */}
        <div className="mt-8 p-5 bg-slate-900 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-white border border-slate-800">
          <div className="flex flex-col sm:flex-row gap-8">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Total Records
              </span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                {data?.summary.total_records.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Departments
              </span>
              <span className="text-sm font-bold text-blue-400">
                {data?.departments.full_list.length || 0} Active
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Data Status
              </span>
              <span className="text-sm font-bold text-white">Current</span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs font-bold uppercase tracking-widest border border-slate-700 px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </div>

        {/* HELPFUL TIP */}
        <div className="mt-6 text-center text-xs text-slate-400 font-medium">
          💡 Tip: Use filters to drill down into specific data by date range or department
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;