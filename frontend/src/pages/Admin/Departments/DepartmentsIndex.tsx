import React, { useEffect, useState } from 'react';
import { getDepartmentsWithStudents } from '../../../api/departments';
import { getFullName } from '../../../types/students';
import { 
    Loader2, Users, GraduationCap, MapPin, Search, 
    CheckCircle2, AlertCircle,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { BsPerson } from "react-icons/bs";
import { CgDetailsMore } from "react-icons/cg";
import type { DepartmentSidebarItem } from '../../../types/departments';

// for tanstack
import { keepPreviousData, useQuery } from '@tanstack/react-query';

// --- LOGO IMPORTS ---
import ncLogo from '../../../assets/nc_logo.png';
import abLogo from '../../../assets/dept_logo/ab.webp';
import becLogo from '../../../assets/dept_logo/bec.webp';
import bsbaLogo from '../../../assets/dept_logo/bsba.webp';
import bscrimLogo from '../../../assets/dept_logo/bscrim.webp';
import bsedLogo from '../../../assets/dept_logo/bsed.webp';
import bsgeLogo from '../../../assets/dept_logo/bsge.webp';
import bshmLogo from '../../../assets/dept_logo/bshm.webp';
import bsitLogo from '../../../assets/dept_logo/bsit.webp';
import bsnLogo from '../../../assets/dept_logo/bsn.webp';
import colaLogo from '../../../assets/dept_logo/cola.webp';
import masteralLogo from '../../../assets/dept_logo/masteral.webp';
import midwiferyLogo from '../../../assets/dept_logo/midwifery.webp';

const LOGO_MAP: Record<string, string> = {
    'AB': abLogo, 'BEC': becLogo, 'BSBA': bsbaLogo, 'BSCRIM': bscrimLogo,
    'BSED': bsedLogo, 'BSGE': bsgeLogo, 'BSHM': bshmLogo, 'BSIT': bsitLogo,
    'BSN': bsnLogo, 'JD': colaLogo, 'MASTERAL': masteralLogo,
    'MIDWIFERY': midwiferyLogo, 'EMPLOYEE': ncLogo,
};

// --- SKELETONS ---
const NavItemSkeleton = () => (
  <div className="flex items-center justify-between px-4 py-4 rounded-2xl animate-pulse bg-slate-50">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-200" />
      <div className="h-3 w-24 bg-slate-200 rounded" />
    </div>
    <div className="w-6 h-4 bg-slate-200 rounded" />
  </div>
);

const MetricSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between animate-pulse">
    <div className="space-y-3">
      <div className="h-2 w-20 bg-slate-100 rounded" />
      <div className="h-8 w-16 bg-slate-200 rounded" />
    </div>
    <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
  </div>
);

const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-10 py-7"><div className="h-4 bg-slate-100 rounded w-24" /></td>
    <td className="px-10 py-7"><div className="space-y-2"><div className="h-4 bg-slate-200 rounded w-40" /><div className="h-3 bg-slate-100 rounded w-20" /></div></td>
    <td className="px-10 py-7"><div className="h-7 bg-slate-100 rounded-xl w-20 mx-auto" /></td>
    <td className="px-10 py-7"><div className="space-y-2"><div className="h-3 bg-slate-200 rounded w-32" /><div className="h-2 bg-slate-100 rounded w-48" /></div></td>
    <td className="px-10 py-7"><div className="h-11 w-11 bg-slate-100 rounded-2xl mx-auto" /></td>
  </tr>
);

const MetricCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md hover:border-indigo-100">
    <div className="flex flex-col">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
      <span className="text-3xl font-black text-slate-900 mt-1">{value}</span>
    </div>
    <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
    </div>
  </div>
);

const DepartmentList: React.FC = () => {
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedDeptName, setSelectedDeptName] = useState<string>("EMPLOYEE");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input to avoid spamming the API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCursor(null); // Reset pagination on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data,
    isLoading,
    isFetching,
    isPlaceholderData,
    error
  } = useQuery({
    queryKey: ['departments', selectedDeptName, cursor, debouncedSearch],
    queryFn: () => getDepartmentsWithStudents(selectedDeptName, cursor || '', debouncedSearch),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  // Derived Data
  const sidebarDepts = (data?.sidebar ? (Array.isArray(data.sidebar) ? data.sidebar : [data.sidebar]) : []) as DepartmentSidebarItem[];
  const students = data?.students || [];
  const selectedDeptObj = sidebarDepts.find(d => d.department === selectedDeptName);
  
  // Pagination details from response
  const nextCursor = data?.pagination?.next_cursor || null;
  const prevCursor = data?.pagination?.prev_cursor || null;
  const hasMore = data?.pagination?.has_more || false;

  const handleDeptChange = (name: string) => {
    setSelectedDeptName(name);
    setCursor(null);
  };

  const handleNext = () => nextCursor && setCursor(nextCursor);
  const handlePrev = () => prevCursor && setCursor(prevCursor);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm border border-rose-100">
          <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-black text-slate-800 uppercase">Error Occurred</h3>
          <p className="text-slate-500 text-sm mt-2 font-medium">Failed to load department data.</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-rose-500 text-white rounded-2xl font-bold uppercase text-xs tracking-widest">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50/60 overflow-hidden">
      <aside className="w-[320px] bg-white border-r border-slate-200 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 pt-2 pb-8 custom-scrollbar">
          {isLoading ? (
             [...Array(8)].map((_, i) => <NavItemSkeleton key={i} />)
          ) : (
            sidebarDepts.map((dept) => {
                const isActive = selectedDeptName === dept.department;
                const deptLogo = LOGO_MAP[dept.department.toUpperCase()];

                return (
                  <button
                    key={dept.department}
                    onClick={() => handleDeptChange(dept.department)}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 relative group
                      ${isActive 
                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden transition-colors shadow-sm
                        ${isActive ? "bg-white" : "bg-slate-100 group-hover:bg-white"}`}>
                        {deptLogo ? (
                            <img src={deptLogo} alt={dept.department} className="w-full h-full object-cover p-1.5" />
                        ) : (
                            <GraduationCap size={18} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                        )}
                      </div>
                      <span className="text-sm font-black truncate w-36 text-left tracking-tight">{dept.department}</span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all
                      ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>
                      {dept.applicant_count}
                    </div>
                  </button>
                );
            })
          )}
        </nav>
      </aside>

      <main className="flex-1 h-screen p-10 space-y-10 overflow-y-auto custom-scrollbar">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-6xl font-black tracking-tighter text-slate-900 uppercase">{selectedDeptName}</h1>
            <p className="text-xs font-bold tracking-[0.4em] uppercase text-slate-400 pl-1">applicants</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Filter by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-96 p-4 rounded-2xl border-none bg-white px-14 py-4.5 text-sm font-bold shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-300 transition-all"
            />
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
             <><MetricSkeleton /><MetricSkeleton /><div className="h-32 bg-slate-100 rounded-2xl animate-pulse" /></>
          ) : (
            <>
              <MetricCard icon={BsPerson} title="Total Applicants" value={selectedDeptObj?.applicant_count.toString() || "0"} color="bg-indigo-600" />
              <MetricCard icon={Users} title="Current Page" value={students.length.toString()} color="bg-emerald-500" />
              <div className="bg-indigo-900 p-6 rounded-2xl shadow-xl flex flex-col justify-center relative overflow-hidden">
                  <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Active Selection</span>
                    <p className="text-white font-black text-xl mt-1 tracking-tight">{selectedDeptName} Records</p>
                  </div>
                  {LOGO_MAP[selectedDeptName.toUpperCase()] ? (
                     <img 
                        src={LOGO_MAP[selectedDeptName.toUpperCase()]} 
                        className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 grayscale brightness-200" 
                        alt="" 
                     />
                  ) : (
                    <GraduationCap className="absolute -right-4 -bottom-4 text-white/10" size={100} />
                  )}
              </div>
            </>
          )}
        </section>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white bg-white/70 shadow-2xl shadow-slate-200/60">
          
          {/* REPLACEMENT 1: Using isFetching & isPlaceholderData 
              Show overlay loader when fetching new data (pagination/search) 
          */}
          {(isFetching && isPlaceholderData) && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
          )}
          
          <div className={`overflow-x-auto custom-scrollbar transition-opacity duration-300 ${isPlaceholderData ? 'opacity-50' : 'opacity-100'}`}>
            <table className="w-full border-separate border-spacing-0 text-left table-fixed">
              <thead>
                <tr className="bg-slate-100/50 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  <th className="px-10 py-6 border-b border-slate-200 w-[20%]">ID Number</th>
                  <th className="px-10 py-6 border-b border-slate-200 w-[30%]">Full Name</th>
                  <th className="px-10 py-6 border-b border-slate-200 w-[15%] text-center">Status</th>
                  <th className="px-10 py-6 border-b border-slate-200 w-[25%]">Contact & Address</th>
                  <th className="px-10 py-6 border-b border-slate-200 w-[10%] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  [...Array(6)].map((_, i) => <TableRowSkeleton key={i} />)
                ) : students.length > 0 ? (
                  students.map((s: any) => (
                    <tr key={s.id} className="group transition-all hover:bg-white">
                      <td className="px-10 py-7 font-mono text-sm font-bold text-slate-500">{s.id_number}</td>
                      <td className="px-10 py-7">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">{getFullName(s)}</span>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{s.course}</span>
                        </div>
                      </td>
                      <td className="px-10 py-7 text-center">
                        <span className={`inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-widest
                          ${s.has_card ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100" : "bg-rose-50 text-rose-500 ring-1 ring-rose-100"}`}>
                          {s.has_card ? <CheckCircle2 size={10} /> : null}
                          {s.has_card ? "Issued" : "No ID"}
                        </span>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-700 truncate">{s.guardian_name}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold uppercase italic">
                            <MapPin size={10} className="text-indigo-300" /> {s.address || 'Unset'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-7 text-center">
                        <button className="w-11 h-11 border border-slate-100 rounded-2xl bg-white shadow-sm hover:border-indigo-200 transition-all flex items-center justify-center mx-auto group/btn">
                          <CgDetailsMore size={22} className="text-slate-400 group-hover/btn:text-indigo-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="py-32 text-center bg-slate-50/30"><p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">No Applicants Found</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50/50 px-10 py-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isFetching ? 'Syncing...' : 'All data up to date'}
            </div>
            <div className="flex items-center gap-3">
                <button 
                    // REPLACEMENT 2: Disable buttons while fetching
                    disabled={!prevCursor || isFetching}
                    onClick={handlePrev}
                    className="p-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <button 
                    // REPLACEMENT 3: Disable buttons while fetching
                    disabled={!hasMore || isFetching}
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-lg shadow-indigo-100"
                >
                    Next <ChevronRight size={18} />
                </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DepartmentList;