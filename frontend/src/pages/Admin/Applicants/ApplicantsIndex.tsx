import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Users, CreditCard, Search, ArrowUpDown,
  ShieldCheck, RefreshCw, Download, Inbox, CheckCircle2
} from "lucide-react";
import MetricCard from "@/components/SubComponents/MetricCard";
import ApplicantsTable from "@/components/ApplicantsTable";
import { getApplicantsReport } from "@/api/students";
import { type ApplicantCard } from "@/types/card";

import ApplicantDetailsModal from "@/components/Modals/ApplicantDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ApplicantSkeleton } from "@/components/TableSkeleton";
import { useQuery } from "@tanstack/react-query";


const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'date', label: 'Date Added' },
  { value: 'course', label: 'Course' },
  { value: 'status', label: 'ID Status' },
] as const;

const ApplicantsIndex: React.FC = () => {
  const [query, setQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantCard | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filters
  const [statusFilter, setStatusFilter] = useState(() => {
    const f = searchParams.get('filter');
    return f === 'recently-issued' ? 'recently-issued' : '';
  });
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const {
    data: reportData,
    isLoading: loading,
    isFetching: isRefreshing,
    refetch,
  } = useQuery({
    queryKey: ['applicantsReport'],
    queryFn: getApplicantsReport,
  });

  const report = reportData ? {
    total: reportData.applicantsReport || 0,
    pending: reportData.pendingCount || 0,
    issued: reportData.issuedCount || 0,
  } : null;

  const handleRefresh = () => refetch();

  const handleSortChange = (value: string) => {
    if (value === sortBy) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(value);
      setSortDir('asc');
    }
  };

  const toggleRecentlyIssued = () => {
    const next = statusFilter === 'recently-issued' ? '' : 'recently-issued';
    setStatusFilter(next);
    if (next) setSearchParams({ filter: next });
    else setSearchParams({});
  };

  const activeSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Default';

  return (
    <div className="flex-1 bg-background text-foreground font-sans selection:bg-primary/10 transition-colors duration-300 flex flex-col min-h-full">
      <div className="px-6 py-2">

        {/* ── PAGE HEADER ────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <h1 className="text-3xl font-black tracking-tight text-foreground">All Students</h1>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold uppercase tracking-[0.1em]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/reports/export')}
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
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID number…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-10 border-border bg-card shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary rounded-lg"
            />
          </div>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-10 bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
              >
                <ArrowUpDown className="h-4 w-4" />
                Sort: {activeSortLabel}
                {sortBy && (
                  <span className="text-[9px] font-bold text-muted-foreground uppercase ml-1">
                    {sortDir === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortBy} onValueChange={handleSortChange}>
                {SORT_OPTIONS.map(opt => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                    {sortBy === opt.value && (
                      <span className="ml-auto text-[9px] font-bold text-primary uppercase">
                        {sortDir}
                      </span>
                    )}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              {sortBy && (
                <>
                  <DropdownMenuSeparator />
                  <button
                    onClick={() => { setSortBy(''); setSortDir('asc'); }}
                    className="w-full px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded text-left"
                  >
                    Clear Sort
                  </button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Recently Issued chip */}
          <button
            onClick={toggleRecentlyIssued}
            className={cn(
              "gap-1.5 h-10 px-4 text-[11px] font-bold rounded-lg transition-all flex items-center border whitespace-nowrap",
              statusFilter === 'recently-issued'
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-card text-muted-foreground border-border hover:text-primary hover:bg-primary/5 hover:border-primary/20'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Recently Issued
          </button>
        </div>

        {loading && !report ? (
          <ApplicantSkeleton />
        ) : (
          <div className="space-y-10">
            {/* SUMMARY CARDS */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                icon={ShieldCheck}
                title="ID Completion"
                value={`${report?.total ? Math.round((report.issued / report.total) * 100) : 0}%`}
                color="blue"
                trend="up"
                trendLabel="Students with IDs"
              />
              <MetricCard
                icon={Inbox}
                title="Waiting for ID"
                value={report?.pending || 0}
                color="amber"
                trend="neutral"
                trendLabel="Not yet printed"
              />
              <MetricCard
                icon={CreditCard}
                title="IDs Printed"
                value={report?.issued || 0}
                color="emerald"
                trend="up"
                trendLabel="Cards completed"
              />
            </section>

            {/* DATA TABLE */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Student List</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm shadow-primary/5">
                <ApplicantsTable
                  query={query}
                  statusFilter={statusFilter}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onViewDetails={(applicant: ApplicantCard) => setSelectedApplicant(applicant)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedApplicant && (
        <ApplicantDetailsModal
          data={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
        />
      )}
    </div>
  );
};

export default ApplicantsIndex;