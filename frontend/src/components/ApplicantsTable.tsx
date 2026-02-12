import React, { useState, useEffect, useCallback } from "react";
import { getFullName, type Students } from "../types/students";
import { getPaginatedApplicants } from "../api/students";
import { CgDetailsMore } from "react-icons/cg";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { ApplicantCard } from "../types/card";

interface ApplicantsTableProps { 
  query: string;
  onViewDetails: (applicant: ApplicantCard) => void;
}

const TableSkeleton: React.FC = () => (
  <tr className="border-b border-slate-50 last:border-0">
    <td className="px-6 py-5"><div className="h-3 w-20 bg-slate-100 rounded animate-pulse" /></td>
    <td className="px-6 py-5"><div className="h-4 w-48 bg-slate-100 rounded animate-pulse" /></td>
    <td className="px-6 py-5"><div className="h-6 w-16 bg-slate-50 rounded-full animate-pulse" /></td>
    <td className="px-6 py-5"><div className="h-4 w-32 bg-slate-50 rounded animate-pulse" /></td>
    <td className="px-6 py-5"><div className="h-4 w-24 bg-slate-50 rounded animate-pulse" /></td>
    <td className="px-6 py-5 text-right"><div className="inline-flex h-8 w-8 bg-slate-50 rounded animate-pulse" /></td>
  </tr>
);

const ApplicantsTable: React.FC<ApplicantsTableProps> = ({ query, onViewDetails }) => {
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
      setStudents([]);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  }, [query]);  

  // This maps the Student record to the ApplicantCard type used by the modal
  const handleDetailClick = (s: Students) => {
    const applicantData: ApplicantCard = {
      ...s,
      id: s.id,
      fullName: getFullName(s),
      idNumber: s.id_number, // Ensuring field name consistency
    };
    onViewDetails(applicantData);
  };

  useEffect(() => {
    const handler = setTimeout(() => fetchApplicants(1), 500);
    return () => clearTimeout(handler);
  }, [query, fetchApplicants]);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
        {loading && students.length > 0 && (
          <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[1px] flex justify-center items-start pt-32">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="min-h-[580px]">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100">ID Number</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100">Student Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100">Course</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100">Enrolled</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && students.length === 0 ? (
                  [...Array(10)].map((_, i) => <TableSkeleton key={i} />)
                ) : students.length > 0 ? (
                  students.map((s) => (
                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-[11px] font-bold text-indigo-600 uppercase tracking-tight">{s.id_number}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800 tracking-tight">{getFullName(s)}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                          s.has_card ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          <span className={`w-1 h-1 rounded-full mr-1.5 ${s.has_card ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {s.has_card ? "Issued" : "Pending"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 truncate max-w-[150px]">{s.course}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-600">{s.formatted_date}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-medium">{s.formatted_time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* FIXED: Attached the onClick handler */}
                        <button 
                          onClick={() => handleDetailClick(s)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90"
                        >
                          <CgDetailsMore size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="py-40 text-center text-slate-400 text-sm font-medium">No records matching your search query.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <p className="text-xs font-medium text-slate-500">
          Viewing page <span className="text-slate-900 font-bold">{page}</span> of <span className="text-slate-400">{lastPage}</span>
        </p>
        <div className="flex gap-2">
          <button 
            disabled={page === 1 || loading} 
            onClick={() => fetchApplicants(page - 1)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <button 
            disabled={page === lastPage || loading} 
            onClick={() => fetchApplicants(page + 1)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-sm shadow-indigo-200"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantsTable;