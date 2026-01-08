import React, { useState, useEffect, useCallback } from "react";
import { getFullName, type Students } from "../../../types/students";
import { getPaginatedApplicants, getApplicantsReport } from "../../../api/students";
import { BsPerson } from "react-icons/bs";
import { CgDetailsMore } from "react-icons/cg";

// Metric Card component
const MetricCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex items-center justify-between">
    <div className="flex flex-col">
      <span className="text-sm font-medium text-gray-500">{title}</span>
      <span className="text-3xl font-bold text-gray-900 mt-1">{value}</span>
    </div>
    <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
    </div>
  </div>
);

// Skeleton Row matching the new fixed widths
const TableSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-10 py-6"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
    <td className="px-10 py-6"><div className="h-4 w-40 bg-slate-200 rounded" /></td>
    <td className="px-10 py-6"><div className="h-6 w-20 bg-slate-200 rounded-full" /></td>
    <td className="px-10 py-6"><div className="h-5 w-16 bg-slate-200 rounded-lg" /></td>
    <td className="px-10 py-6">
      <div className="space-y-2">
        <div className="h-3 w-20 bg-slate-200 rounded" />
        <div className="h-2 w-12 bg-slate-100 rounded" />
      </div>
    </td>
    <td className="px-10 py-6"><div className="h-9 w-9 bg-slate-200 rounded-2xl" /></td>
  </tr>
);

const ApplicantsIndex: React.FC = () => {
  const [students, setStudents] = useState<Students[]>([]);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [reportLoading, setReportLoading] = useState(true);

  const fetchTotalApplicants = useCallback(async () => {
    setReportLoading(true);
    try {
      const data = await getApplicantsReport();
      setTotalApplicants(data.applicantsReport);
    } catch (err) { console.error(err); } 
    finally { setReportLoading(false); }
  }, []);

  const fetchApplicants = useCallback(
    async (p = 1, q = query) => {
      setLoading(true);
      try {
        const res = await getPaginatedApplicants(q, p);
        setStudents(res.data);
        setPage(res.current_page);
        setLastPage(res.last_page);
      } catch (err) {
        console.error(err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
     fetchTotalApplicants();
  }, [fetchTotalApplicants]);

  useEffect(() => {
    const handler = setTimeout(() => { fetchApplicants(1, query); }, 1000);
    return () => clearTimeout(handler);
  }, [query, fetchApplicants]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= lastPage) {
      fetchApplicants(newPage, query);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 px-6 py-10">
      <div className="mx-auto space-y-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 uppercase">Applicants</h1>
          <p className="mt-2 text-xs font-bold tracking-[0.3em] uppercase text-slate-400">Student Applications</p>
        </div>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {reportLoading ? (
            <div className="h-[88px] w-full bg-white rounded-xl border border-gray-200 animate-pulse p-6" />
          ) : (
            <MetricCard icon={BsPerson} title="Total Applicants" value={totalApplicants.toLocaleString()} color="bg-indigo-500" />
          )}
          
        </section>
          <div className="flex justify-end items-end col-span-full lg:col-span-1">
            <input
              type="text"
              placeholder="Search by name or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-80 rounded-xl border px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

        <div className="overflow-hidden rounded-2xl border border-white bg-white/60 shadow-xl shadow-slate-200/60">
          <div className="overflow-x-auto">
            {/* 1. Added table-fixed to prevent width jumping */}
            <table className="w-full border-separate border-spacing-0 text-left table-fixed">
              <thead>
                <tr className="bg-slate-100/70 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  {/* 2. Explicitly defined widths for every column */}
                  <th className="px-10 py-5 border-b border-slate-200 w-[15%]">ID Number</th>
                  <th className="px-10 py-5 border-b border-slate-200 w-[25%]">Full Name</th>
                  <th className="px-10 py-5 border-b border-slate-200 w-[15%]">Status</th>
                  <th className="px-10 py-5 border-b border-slate-200 w-[15%]">Course</th>
                  <th className="px-10 py-5 border-b border-slate-200 w-[15%]">Registered</th>
                  <th className="px-10 py-5 border-b border-slate-200 w-[15%]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(5)].map((_, i) => <TableSkeleton key={i} />)
                ) : students.length > 0 ? (
                  students.map((s) => (
                    <tr key={s.id} className="group transition-colors hover:bg-white">
                      {/* Using truncate/overflow-hidden to prevent text from pushing fixed columns */}
                      <td className="px-10 py-6 font-mono text-sm font-bold text-slate-600 truncate">{s.id_number}</td>
                      <td className="px-10 py-6 text-sm font-semibold text-slate-900 truncate">{getFullName(s)}</td>
                      <td className="px-10 py-6">
                        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest
                          ${s.has_card ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100" : "bg-rose-50 text-rose-500 ring-1 ring-rose-100"}`}>
                          {s.has_card ? "Issued" : "No ID"}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-500 truncate inline-block w-full text-center">{s.course}</span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{s.formatted_date}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{s.formatted_time}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                         <button className="border rounded-2xl p-2 bg-slate-300/5 hover:bg-slate-100 transition-colors">
                            <CgDetailsMore size={20} />
                          </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-10 py-12 text-center text-gray-500 italic">No applicants found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="flex justify-end items-center gap-4 mt-4">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Page {page} of {lastPage}</span>
          <div className="flex gap-2">
            <button 
                disabled={page === 1 || loading} 
                onClick={() => handlePageChange(page - 1)} 
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
                Prev
            </button>
            <button 
                disabled={page === lastPage || loading} 
                onClick={() => handlePageChange(page + 1)} 
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
                Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantsIndex;