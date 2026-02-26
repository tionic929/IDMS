import { useEffect, useState, useCallback } from "react";
import {
  Users, Clock, CreditCard, Search, Filter, ChevronDown,
  ShieldCheck, RefreshCw, Download, MoreHorizontal, Inbox
} from "lucide-react";
import MetricCard from "@/components/SubComponents/MetricCard";
import ApplicantsTable from "@/components/ApplicantsTable";
import { getApplicantsReport } from "@/api/students";
import { type ApplicantCard } from "@/types/card";

import ApplicantDetailsModal from "@/components/Modals/ApplicantDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ApplicantSkeleton } from "@/components/TableSkeleton";

const ApplicantsIndex: React.FC = () => {
  const [report, setReport] = useState<{ total: number; pending: number; issued: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantCard | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReport = useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      else setLoading(true);

      const data = await getApplicantsReport();
      setReport({
        total: data.applicantsReport || 0,
        pending: data.pendingCount || 0,
        issued: data.issuedCount || 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleRefresh = () => fetchReport(true);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans selection:bg-primary/10">
      <div className="px-6 py-8 lg:px-12 lg:py-12 max-w-[1600px] mx-auto">

        {/* ── PAGE HEADER ────────────────────────────────────────── */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 relative">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80">Registry</span>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80">Applicants</span>
            </div>
            <div className="flex items-center gap-5">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Applicant Records</h1>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-[0.1em]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-lg group hover:border-primary/50 transition-all">
              <ShieldCheck className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

        {/* ── TOOLBAR ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-10 p-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Find applicant by name or ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-10 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-700 placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 md:ml-auto">
            <Button
              variant={isFilterOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "gap-2 h-9",
                isFilterOpen ? "bg-primary text-white" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Filter className="h-4 w-4" />
              Categorize
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

            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900 hover:bg-slate-50">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading && !report ? (
          <ApplicantSkeleton />
        ) : (
          <div className="space-y-10">
            {/* WORKFLOW METRICS */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                icon={ShieldCheck}
                title="Issuance Rate"
                value={`${report?.total ? Math.round((report.issued / report.total) * 100) : 0}%`}
                color="blue"
                trend="up"
                trendLabel="Completion ratio"
              />
              <MetricCard
                icon={Inbox}
                title="Pending Backlog"
                value={report?.pending || 0}
                color="amber"
                trend="neutral"
                trendLabel="Awaiting Review"
              />
              <MetricCard
                icon={CreditCard}
                title="Daily Production"
                value={report?.issued || 0}
                color="emerald"
                trend="up"
                trendLabel="Cards Printed Today"
              />
            </section>

            {/* FILTERS PANEL */}
            {isFilterOpen && (
              <Card className="border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Filter by Unit</label>
                    <Select defaultValue="all">
                      <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Card Status</label>
                    <Select defaultValue="all">
                      <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Records</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* DATA TABLE */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Recent Activity</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm shadow-slate-100">
                <ApplicantsTable
                  query={query}
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