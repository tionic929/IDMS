import React, { useState, useEffect, useCallback } from "react";
import { getFullName, type Students } from "../types/students";
import { getPaginatedApplicants } from "../api/students";
import { CgDetailsMore } from "react-icons/cg";

interface ApplicantsTableProps {
  query: string;
}

const TableSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-10 py-6"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
    <td className="px-10 py-6"><div className="h-4 w-40 bg-slate-200 rounded" /></td>
    <td className="px-10 py-6"><div className="h-6 w-20 bg-slate-200 rounded-full" /></td>
    <td className="px-10 py-6"><div className="h-5 w-16 bg-slate-200 rounded-lg" /></td>
    <td className="px-10 py-6"><div className="h-3 w-20 bg-slate-200 rounded" /></td>
    <td className="px-10 py-6"><div className="h-9 w-9 bg-slate-200 rounded-2xl" /></td>
  </tr>
);

const ApplicantsTable: React.FC<ApplicantsTableProps> = ({ query }) => {
  const [students, setStudents] = useState<Students[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchApplicants = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getPaginatedApplicants(query, p);
      setStudents(res.data);
      setPage(res.current_page);
      setLastPage(res.last_page);
    } catch (err) {
      console.error(err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Handle Search Debounce and Reset to Page 1
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchApplicants(1);
    }, 600); // Optimized debounce time
    return () => clearTimeout(handler);
  }, [query, fetchApplicants]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-white bg-white/60 shadow-xl shadow-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-left table-fixed">
            <thead>
              <tr className="bg-slate-100/70 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                <th className="px-10 py-5 border-b border-slate-200 w-[15%]">ID Number</th>
                <th className="px-10 py-5 border-b border-slate-200 w-[25%]">Full Name</th>
                <th className="px-10 py-5 border-b border-slate-200 w-[15%]">Status</th>
                <th className="px-10 py-5 border-b border-slate-200 w-[15%]">Course</th>
                <th className="px-10 py-5 border-b border-slate-200 w-[15%]">Registered</th>
                <th className="px-10 py-5 border-b border-slate-200 w-[15%] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => <TableSkeleton key={i} />)
              ) : students.length > 0 ? (
                students.map((s) => (
                  <tr key={s.id} className="group transition-colors hover:bg-white">
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
                    <td className="px-10 py-6 text-right">
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

      {/* Pagination Footer - Now part of the sub-component */}
      <div className="flex justify-end items-center gap-4 mt-4">
        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Page {page} of {lastPage}</span>
        <div className="flex gap-2">
          <button 
              disabled={page === 1 || loading} 
              onClick={() => fetchApplicants(page - 1)} 
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
              Prev
          </button>
          <button 
              disabled={page === lastPage || loading} 
              onClick={() => fetchApplicants(page + 1)} 
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
              Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantsTable;