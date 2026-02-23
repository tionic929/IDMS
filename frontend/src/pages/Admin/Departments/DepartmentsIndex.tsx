import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getDepartmentsWithStudents } from '@/api/departments';
import { getFullName } from '@/types/students';
import {
  Loader2, Users, GraduationCap, MapPin, Search,
  CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, Eye, RefreshCw, ShieldCheck
} from 'lucide-react';
import type { DepartmentSidebarItem } from '@/types/departments';

// shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import MetricCard from "@/components/SubComponents/MetricCard";

// for tanstack
import { keepPreviousData, useQuery } from '@tanstack/react-query';

// --- LOGO IMPORTS ---
import ncLogo from '@/assets/nc_logo.png';
import abLogo from '@/assets/dept_logo/ab.webp';
import becLogo from '@/assets/dept_logo/bec.webp';
import bsbaLogo from '@/assets/dept_logo/bsba.webp';
import bscrimLogo from '@/assets/dept_logo/bscrim.webp';
import bsedLogo from '@/assets/dept_logo/bsed.webp';
import bsgeLogo from '@/assets/dept_logo/bsge.webp';
import bshmLogo from '@/assets/dept_logo/bshm.webp';
import bsitLogo from '@/assets/dept_logo/bsit.webp';
import bsnLogo from '@/assets/dept_logo/bsn.webp';
import colaLogo from '@/assets/dept_logo/cola.webp';
import masteralLogo from '@/assets/dept_logo/masteral.webp';
import midwiferyLogo from '@/assets/dept_logo/midwifery.webp';

const LOGO_MAP: Record<string, string> = {
  'AB': abLogo, 'BEC': becLogo, 'BSBA': bsbaLogo, 'BSCRIM': bscrimLogo,
  'BSED': bsedLogo, 'BSGE': bsgeLogo, 'BSHM': bshmLogo, 'BSIT': bsitLogo,
  'BSN': bsnLogo, 'JD': colaLogo, 'MASTERAL': masteralLogo,
  'MIDWIFERY': midwiferyLogo, 'EMPLOYEE': ncLogo,
};

// --- SKELETONS ---
const NavItemSkeleton = () => (
  <div className="flex items-center justify-between px-4 py-3 rounded-xl animate-pulse bg-slate-50 border border-slate-100 mb-1">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100" />
      <div className="h-2 w-20 bg-slate-100 rounded" />
    </div>
    <div className="w-5 h-3 bg-slate-100 rounded" />
  </div>
);

const MetricSkeleton = () => (
  <Card className="h-28 overflow-hidden bg-white border-slate-100 shadow-sm animate-pulse">
    <CardContent className="p-6 flex items-center justify-between">
      <div className="space-y-3">
        <div className="h-2 w-20 bg-slate-100 rounded" />
        <div className="h-8 w-16 bg-slate-100 rounded-lg" />
      </div>
      <div className="w-12 h-12 bg-slate-50 rounded-xl" />
    </CardContent>
  </Card>
);

const TableRowSkeleton = () => (
  <TableRow className="animate-pulse">
    <TableCell className="pl-8 py-6"><div className="h-3 bg-slate-50 rounded w-20" /></TableCell>
    <TableCell className="py-6"><div className="space-y-2"><div className="h-3 bg-slate-50 rounded w-40" /><div className="h-2 bg-slate-50 rounded w-24" /></div></TableCell>
    <TableCell className="py-6"><div className="h-6 bg-slate-50 rounded-md w-16 mx-auto" /></TableCell>
    <TableCell className="py-6"><div className="space-y-2"><div className="h-2 bg-slate-50 rounded w-32" /><div className="h-1 bg-slate-50 rounded w-48" /></div></TableCell>
    <TableCell className="pr-8 py-6"><div className="h-8 w-8 bg-slate-50 rounded-lg ml-auto" /></TableCell>
  </TableRow>
);

const DepartmentList: React.FC = () => {
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedDeptName, setSelectedDeptName] = useState<string>("EMPLOYEE");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCursor(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data,
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
    refetch
  } = useQuery({
    queryKey: ['departments', selectedDeptName, cursor, debouncedSearch],
    queryFn: () => getDepartmentsWithStudents(selectedDeptName, cursor || '', debouncedSearch),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  const sidebarDepts = (data?.sidebar ? (Array.isArray(data.sidebar) ? data.sidebar : [data.sidebar]) : []) as DepartmentSidebarItem[];
  const students = data?.students || [];
  const selectedDeptObj = sidebarDepts.find(d => d.department === selectedDeptName);

  const globalTotal = sidebarDepts.reduce((acc, d) => acc + d.applicant_count, 0);
  const parityPercent = (selectedDeptObj && globalTotal > 0)
    ? Math.round((selectedDeptObj.applicant_count / globalTotal) * 100)
    : 0;

  const nextCursor = data?.pagination?.next_cursor || null;
  const prevCursor = data?.pagination?.prev_cursor || null;
  const hasMore = data?.pagination?.has_more || false;

  const handleDeptChange = (name: string) => {
    setSelectedDeptName(name);
    setCursor(null);
  };

  const handleNext = () => nextCursor && setCursor(nextCursor);
  const handlePrev = () => prevCursor && setCursor(prevCursor);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-8 bg-slate-50">
        <Card className="max-w-md w-full border-red-100 shadow-xl rounded-[2.5rem] bg-white">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Sync Failed</h3>
              <p className="text-slate-500 text-sm font-medium">Failed to establish connection with department records.</p>
            </div>
            <Button onClick={handleRefresh} variant="destructive" className="w-full h-12 rounded-xl font-bold uppercase tracking-wider text-xs bg-red-600 hover:bg-red-700">
              Retry Synchronization
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-50 text-slate-950 overflow-hidden font-sans selection:bg-primary/10">
      {/* SIDEBAR */}
      <aside className="w-[320px] bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-sm relative">
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80">Registry</span>
            <span className="w-1 h-1 rounded-full bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80">Units</span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Directory</h2>
        </div>

        <ScrollArea className="flex-1 px-4 py-6 scrollbar-none">
          <div className="space-y-1 pb-10">
            {isLoading && !sidebarDepts.length ? (
              [...Array(12)].map((_, i) => <NavItemSkeleton key={i} />)
            ) : (
              sidebarDepts.map((dept) => {
                const isActive = selectedDeptName === dept.department;
                const deptLogo = LOGO_MAP[dept.department.toUpperCase()];

                return (
                  <button
                    key={dept.department}
                    onClick={() => handleDeptChange(dept.department)}
                    className={cn(
                      "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 group text-left relative overflow-hidden",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/25 border-none"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0 z-10">
                      <div className={cn(
                        "w-9 h-9 shrink-0 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300",
                        isActive ? "bg-white shadow-sm scale-105" : "bg-slate-100 border border-slate-200"
                      )}>
                        {deptLogo ? (
                          <img src={deptLogo} alt={dept.department} className={cn("w-full h-full object-contain p-1", !isActive && "opacity-60")} />
                        ) : (
                          <GraduationCap size={18} className={cn(!isActive && "text-slate-400")} />
                        )}
                      </div>
                      <span className="text-[11px] font-bold truncate uppercase tracking-tight">{dept.department}</span>
                    </div>
                    <div className={cn(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black shrink-0 z-10 tabular-nums shadow-sm",
                      isActive ? "bg-white/20 text-white" : "bg-slate-50 text-slate-400"
                    )}>
                      {dept.applicant_count}
                    </div>
                    {isActive && (
                      <div className="absolute inset-0 bg-zinc-900 opacity-50" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">

          {/* HEADER */}
          <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80">Unit</span>
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80">Profile</span>
              </div>
              <div className="flex items-baseline gap-4">
                <h1 className="text-5xl font-black tracking-tighter text-slate-950 uppercase leading-none">{selectedDeptName}</h1>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/5 text-primary text-[9px] font-bold uppercase tracking-[0.1em]">
                  {selectedDeptObj?.applicant_count} ACTIVE RECORDS
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-96 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                <Input
                  placeholder="Find record by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-slate-200 bg-white shadow-sm shadow-slate-100 focus-visible:ring-primary/20 focus-visible:border-primary transition-all rounded-xl"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-10 w-10 min-w-[40px] rounded-xl bg-white border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </header>

          {/* UNIT CONTEXT METRICS */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading && !sidebarDepts.length ? (
              <><MetricSkeleton /><MetricSkeleton /><MetricSkeleton /></>
            ) : (
              <>
                <MetricCard
                  icon={Users}
                  title={`${selectedDeptName} Census`}
                  value={selectedDeptObj?.applicant_count || 0}
                  color="blue"
                  trend="neutral"
                  trendLabel="Active Records"
                />
                <MetricCard
                  icon={ShieldCheck}
                  title="ID Coverage"
                  value={`${students.length > 0 ? Math.round((students.filter((s: any) => s.has_card).length / students.length) * 100) : 0}%`}
                  color="emerald"
                  trend="up"
                  trendLabel="Unit Completion"
                />

                <Card className="bg-primary/95 overflow-hidden border-none text-white shadow-lg shadow-primary/20 rounded-[2rem] relative group cursor-default">
                  <CardContent className="p-8 flex flex-col justify-center h-full">
                    <div className="relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">UNIT PARITY</span>
                      <p className="text-xl font-black mt-1 tracking-tight uppercase">
                        {parityPercent}% OF GLOBAL
                      </p>
                    </div>
                    <GraduationCap className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-110 transition-transform duration-700" size={160} />
                  </CardContent>
                </Card>
              </>
            )}
          </section>

          {/* DATA TABLE */}
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Listing Log</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <Card className="border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-100 bg-white">
              <div className="relative overflow-hidden flex flex-col">
                {(isFetching && isPlaceholderData) && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                )}

                <div className="overflow-x-auto text-slate-900 font-sans">
                  <Table>
                    <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-8 w-[150px] text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">ID Number</TableHead>
                        <TableHead className="w-[280px] text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Identity</TableHead>
                        <TableHead className="text-center w-[120px] text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Status</TableHead>
                        <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Location</TableHead>
                        <TableHead className="text-right pr-8 w-[120px] text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading && !sidebarDepts.length ? (
                        [...Array(10)].map((_, i) => <TableRowSkeleton key={i} />)
                      ) : students.length > 0 ? (
                        students.map((s: any) => (
                          <TableRow key={s.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                            <TableCell className="pl-8 font-mono text-[11px] font-bold text-primary">{s.id_number}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary text-[11px] font-bold border border-primary/10">
                                  {s.first_name[0]}{s.last_name[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-700">{getFullName(s)}</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter opacity-70">{s.course}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className={cn(
                                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                                s.has_card
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-red-50 text-red-600 border-red-100"
                              )}>
                                <div className={cn("h-1.5 w-1.5 rounded-full", s.has_card ? "bg-emerald-500" : "bg-red-500")} />
                                {s.has_card ? "Issued" : "No ID"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]">{s.guardian_name}</span>
                                <span className="text-[9px] text-slate-400 flex items-center gap-1 font-medium italic opacity-80">
                                  <MapPin size={9} /> {s.address || 'Location Unknown'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all active:scale-90">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-80 text-center text-slate-300 text-[11px] font-black uppercase tracking-[0.3em] bg-slate-50/20 italic">
                            No records found in this unit directory
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* FOOTER / PAGINATION */}
              <div className="bg-slate-50/50 px-10 py-5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {isFetching ? 'Synchronizing records...' : 'Systems nominal'}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    {data?.pagination?.total || 0} Records Found
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!prevCursor || isFetching}
                    onClick={handlePrev}
                    className="h-10 w-10 border-slate-200 bg-white hover:text-primary hover:border-primary/30 transition-all shadow-sm rounded-xl"
                  >
                    <ChevronLeft size={18} />
                  </Button>
                  <Button
                    variant="default"
                    disabled={!hasMore || isFetching}
                    onClick={handleNext}
                    className="h-10 px-8 gap-2 font-black text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl"
                  >
                    Next Page <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default DepartmentList;