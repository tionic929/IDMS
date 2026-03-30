import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getDepartmentsWithStudents } from '@/api/departments';
import { getFullName } from '@/types/students';
import {
  Loader2, Users, GraduationCap, MapPin, Search,
  CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, Eye, RefreshCw, ShieldCheck, Download
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
  <div className="flex items-center justify-between px-4 py-3 rounded-lg animate-pulse bg-muted border border-border mb-1">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-md bg-muted-foreground/10" />
      <div className="h-2 w-20 bg-muted-foreground/10 rounded" />
    </div>
    <div className="w-5 h-3 bg-muted-foreground/10 rounded" />
  </div>
);

const MetricSkeleton = () => (
  <Card className="h-28 overflow-hidden bg-card border-border shadow-sm animate-pulse">
    <CardContent className="p-6 flex items-center justify-between">
      <div className="space-y-3">
        <div className="h-2 w-20 bg-muted rounded" />
        <div className="h-8 w-16 bg-muted rounded-md" />
      </div>
      <div className="w-12 h-12 bg-muted rounded-lg" />
    </CardContent>
  </Card>
);

const TableRowSkeleton = () => (
  <TableRow className="animate-pulse">
    <TableCell className="pl-8 py-6"><div className="h-3 bg-muted rounded w-20" /></TableCell>
    <TableCell className="py-6"><div className="space-y-2"><div className="h-3 bg-muted rounded w-40" /><div className="h-2 bg-muted rounded w-24" /></div></TableCell>
    <TableCell className="py-6"><div className="h-6 bg-muted rounded-md w-16 mx-auto" /></TableCell>
    <TableCell className="py-6"><div className="space-y-2"><div className="h-2 bg-muted rounded w-32" /><div className="h-1 bg-muted rounded w-48" /></div></TableCell>
    <TableCell className="pr-8 py-6"><div className="h-8 w-8 bg-muted rounded-lg ml-auto" /></TableCell>
  </TableRow>
);

const DepartmentList: React.FC = () => {
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedDeptName, setSelectedDeptName] = useState<string>("EMPLOYEE");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Auto-select department from URL param (e.g., navigating from dashboard donut)
  useEffect(() => {
    const deptParam = searchParams.get('dept');
    if (deptParam) {
      setSelectedDeptName(deptParam);
    }
  }, [searchParams]);

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
      <div className="flex h-screen items-center justify-center p-8 bg-background">
        <Card className="max-w-md w-full border-destructive/10 shadow-xl rounded-[2.5rem] bg-card">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-destructive/10">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Sync Failed</h3>
              <p className="text-muted-foreground text-sm font-medium">Failed to establish connection with department records.</p>
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
    <div className="flex h-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary/10">
      {/* SIDEBAR */}
      <aside className="w-[320px] bg-card border-r border-border flex flex-col h-full z-10 shadow-sm relative">
        <div className="p-8 border-b border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-80">Registry</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-80">Units</span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Directory</h2>
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
                      "w-full flex items-center justify-between p-3.5 rounded-lg transition-all duration-300 group text-left relative overflow-hidden",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10 border-none"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0 z-10">
                      <div className={cn(
                        "w-9 h-9 shrink-0 rounded-md flex items-center justify-center overflow-hidden transition-all duration-300",
                        isActive ? "bg-primary-foreground shadow-sm scale-105" : "bg-muted border border-border"
                      )}>
                        {deptLogo ? (
                          <img src={deptLogo} alt={dept.department} className={cn("w-full h-full object-contain p-1", !isActive && "opacity-60")} />
                        ) : (
                          <GraduationCap size={18} className={cn(!isActive && "text-muted-foreground")} />
                        )}
                      </div>
                      <span className="text-[11px] font-bold truncate uppercase tracking-tight">{dept.department}</span>
                    </div>
                    <div className={cn(
                      "px-2.5 py-1 rounded-md text-[9px] font-black shrink-0 z-10 tabular-nums shadow-sm",
                      isActive ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground"
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
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Reports / Departments</span>
              <div className="flex items-baseline gap-4">
                <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase leading-none">{selectedDeptName}</h1>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/5 text-primary text-[9px] font-bold uppercase tracking-[0.1em]">
                  {selectedDeptObj?.applicant_count} ACTIVE RECORDS
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-96 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <Input
                  placeholder="Find record by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-border bg-card shadow-sm shadow-primary/5 focus-visible:ring-primary/20 focus-visible:border-primary transition-all rounded-lg"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/reports/export')}
                className="h-10 px-4 rounded-lg bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all shadow-sm gap-2 text-[10px] font-bold uppercase tracking-wider"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-10 w-10 min-w-[40px] rounded-lg bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all shadow-sm"
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

                <Card className="bg-primary overflow-hidden border-none text-primary-foreground shadow-lg shadow-primary/10 rounded-lg relative group cursor-default">
                  <CardContent className="p-8 flex flex-col justify-center h-full">
                    <div className="relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">UNIT PARITY</span>
                      <p className="text-xl font-black mt-1 tracking-tight uppercase">
                        {parityPercent}% OF GLOBAL
                      </p>
                    </div>
                    <GraduationCap className="absolute -right-6 -bottom-6 text-primary-foreground/10 group-hover:scale-110 transition-transform duration-700" size={160} />
                  </CardContent>
                </Card>
              </>
            )}
          </section>

          {/* DATA TABLE */}
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Listing Log</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Card className="border border-border rounded-lg overflow-hidden shadow-sm shadow-primary/5 bg-card">
              <div className="relative overflow-hidden flex flex-col">
                {(isFetching && isPlaceholderData) && (
                  <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-20 flex items-center justify-center transition-all duration-300">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                )}

                <div className="overflow-x-auto text-slate-900 font-sans">
                  <Table>
                    <TableHeader className="bg-muted/50 border-b border-border">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-8 w-[150px] text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">ID Number</TableHead>
                        <TableHead className="w-[280px] text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">Identity</TableHead>
                        <TableHead className="text-center w-[120px] text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">Status</TableHead>
                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">Address</TableHead>
                        <TableHead className="text-right pr-8 w-[120px] text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading && !sidebarDepts.length ? (
                        [...Array(10)].map((_, i) => <TableRowSkeleton key={i} />)
                      ) : students.length > 0 ? (
                        students.map((s: any) => (
                          <TableRow key={s.id} className="group hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0">
                            <TableCell className="pl-8 font-mono text-[11px] font-bold text-primary">{s.id_number}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground text-[11px] font-bold border border-border">
                                  {s.first_name[0]}{s.last_name[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-foreground">{getFullName(s)}</span>
                                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter opacity-70">{s.course}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className={cn(
                                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                                s.has_card
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                                  : "bg-destructive/10 text-destructive border-destructive/20 dark:text-red-400"
                              )}>
                                <div className={cn("h-1.5 w-1.5 rounded-full", s.has_card ? "bg-emerald-500" : "bg-destructive")} />
                                {s.has_card ? "Issued" : "No ID"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-foreground truncate max-w-[200px]">{s.guardian_name}</span>
                                <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-medium italic opacity-80">
                                  <MapPin size={9} /> {s.address || 'Location Unknown'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all active:scale-90">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-80 text-center text-muted-foreground text-[11px] font-black uppercase tracking-[0.3em] bg-muted/5 italic">
                            No records found in this unit directory
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* FOOTER / PAGINATION */}
              <div className="bg-muted/50 px-10 py-5 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {isFetching ? 'Synchronizing records...' : 'Systems nominal'}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-border" />
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    {data?.pagination?.total || 0} Records Found
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!prevCursor || isFetching}
                    onClick={handlePrev}
                    className="h-10 w-10 border-border bg-card hover:text-foreground hover:bg-accent transition-all shadow-sm rounded-lg"
                  >
                    <ChevronLeft size={18} />
                  </Button>
                  <Button
                    variant="default"
                    disabled={!hasMore || isFetching}
                    onClick={handleNext}
                    className="h-10 px-8 gap-2 font-black text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10 rounded-lg"
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
          background: hsl(var(--muted-foreground) / 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.3);
        }
      `}</style>
    </div>
  );
};

export default DepartmentList;