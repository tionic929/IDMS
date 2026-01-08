import React, { useEffect, useState, useMemo } from 'react';
import { getDepartmentsWithStudents } from '../../../api/departments';
import { type DepartmentWithStudents } from '../../../types/departments';
import { getFullName, type Students } from '../../../types/students';
import { 
    Loader2, 
    Users, 
    GraduationCap, 
    MapPin, 
    Search, 
    LayoutDashboard,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { BsPerson } from "react-icons/bs";
import { CgDetailsMore } from "react-icons/cg";

// --- SKELETON COMPONENTS ---
const NavItemSkeleton = () => (
  <div className="flex items-center justify-between px-4 py-4 rounded-2xl animate-pulse bg-slate-50">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-200" />
      <div className="space-y-2">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-2 w-12 bg-slate-100 rounded" />
      </div>
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
    <td className="px-10 py-7">
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-40" />
        <div className="h-3 bg-slate-100 rounded w-20" />
      </div>
    </td>
    <td className="px-10 py-7"><div className="h-7 bg-slate-100 rounded-xl w-20 mx-auto" /></td>
    <td className="px-10 py-7">
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded w-32" />
        <div className="h-2 bg-slate-100 rounded w-48" />
      </div>
    </td>
    <td className="px-10 py-7"><div className="h-11 w-11 bg-slate-100 rounded-2xl mx-auto" /></td>
  </tr>
);

// --- MAIN COMPONENTS ---
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
  const [data, setData] = useState<DepartmentWithStudents[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentWithStudents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getDepartmentsWithStudents();
        if (response.success && response.data.length > 0) {
          setData(response.data);
          setSelectedDept(response.data[0]);
        }
      } catch (err: any) {
        setError('Failed to load department data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!selectedDept) return [];
    return selectedDept.students.filter(s => 
      getFullName(s).toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedDept, searchQuery]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm border border-rose-100">
          <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-black text-slate-800 uppercase">Error Occurred</h3>
          <p className="text-slate-500 text-sm mt-2 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-rose-500 text-white rounded-2xl font-bold uppercase text-xs tracking-widest">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50/60 overflow-hidden">
      {/* SIDEBAR NAVIGATION - Styled Thin Scrollbar */}
      <aside className="w-85 bg-white border-r border-slate-200 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-8 bg-indigo-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.4)]" />
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Departments</h2>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 pb-8 custom-scrollbar">
          {loading ? (
             [...Array(8)].map((_, i) => <NavItemSkeleton key={i} />)
          ) : (
            data.map((dept) => {
                const isActive = selectedDept?.department === dept.department;
                return (
                  <button
                    key={dept.department}
                    onClick={() => setSelectedDept(dept)}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 relative group
                      ${isActive 
                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    {isActive && <div className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full" />}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm
                        ${isActive ? "bg-indigo-500" : "bg-slate-100 group-hover:bg-white"}`}>
                        <GraduationCap size={18} className={isActive ? "text-white" : "text-slate-400"} />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-black truncate w-36 text-left tracking-tight">{dept.department}</span>
                      </div>
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

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-slate-200' : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {loading ? 'Connecting...' : 'System Operational'}
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA - Styled Scrollbar */}
      <main className="flex-1 h-screen p-10 space-y-10 overflow-y-auto custom-scrollbar">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <LayoutDashboard size={20} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Management Portal</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-slate-900 uppercase">Applicants</h1>
            <div className="h-5 pl-1">
                {loading ? (
                    <div className="h-3 w-48 bg-slate-200 rounded animate-pulse" />
                ) : (
                    <p className="text-xs font-bold tracking-[0.4em] uppercase text-slate-400">
                        Course: <span className="text-indigo-600 font-black">{selectedDept?.department}</span>
                    </p>
                )}
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              disabled={loading}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-96 p-4 rounded-2xl border-none bg-white px-14 py-4.5 text-sm font-bold shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-300 transition-all disabled:opacity-50"
            />
          </div>
        </header>

        {/* METRICS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
             <>
               <MetricSkeleton />
               <MetricSkeleton />
               <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
             </>
          ) : (
            <>
              <MetricCard icon={BsPerson} title="Total Applicants" value={selectedDept?.applicant_count.toString() || "0"} color="bg-indigo-600" />
              <MetricCard icon={Users} title="Visible Records" value={filteredStudents.length.toString()} color="bg-emerald-500" />
              <div className="bg-indigo-900 p-6 rounded-2xl shadow-xl shadow-indigo-200/50 flex flex-col justify-center relative overflow-hidden group transition-transform hover:scale-[1.01]">
                  <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Active Selection</span>
                    <p className="text-white font-black text-xl mt-1 tracking-tight">{selectedDept?.department} Group</p>
                  </div>
                  <GraduationCap className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform" size={100} />
              </div>
            </>
          )}
        </section>

        {/* DATA TABLE - Scrollbar only on X if needed */}
        <div className="overflow-hidden rounded-[2.5rem] border border-white bg-white/70 shadow-2xl shadow-slate-200/60 mb-10">
          <div className="overflow-x-auto custom-scrollbar">
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
                {loading ? (
                  [...Array(6)].map((_, i) => <TableRowSkeleton key={i} />)
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="group transition-all hover:bg-white hover:shadow-inner">
                      <td className="px-10 py-7 font-mono text-sm font-bold text-slate-500 truncate">{s.id_number}</td>
                      <td className="px-10 py-7">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 truncate">{getFullName(s)}</span>
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
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-tighter italic">
                            <MapPin size={10} className="text-indigo-300" /> {s.address || 'Location Unset'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-7 text-center">
                        <button className="inline-flex items-center justify-center w-11 h-11 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-indigo-200 hover:text-indigo-600 transition-all group/btn">
                          <CgDetailsMore size={22} className="text-slate-400 group-hover/btn:text-indigo-600 transition-colors" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center bg-slate-50/30">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-6 bg-white rounded-full shadow-sm">
                            <Users className="text-slate-200" size={64} />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mt-4">No Matching Applicants Found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DepartmentList;