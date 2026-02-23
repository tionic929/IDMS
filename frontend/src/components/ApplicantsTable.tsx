import React, { useState, useEffect, useCallback } from "react";
import { getFullName, type Students } from "@/types/students";
import { getPaginatedApplicants } from "@/api/students";
import { ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Eye } from "lucide-react";
import type { ApplicantCard } from "@/types/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ApplicantsTableProps {
  query: string;
  onViewDetails: (applicant: ApplicantCard) => void;
}

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
      // Small delay for better UX transition
      setTimeout(() => setLoading(false), 400);
    }
  }, [query]);

  const handleDetailClick = (s: Students) => {
    const applicantData: ApplicantCard = {
      ...s,
      id: s.id,
      fullName: getFullName(s),
      idNumber: s.id_number,
    };
    onViewDetails(applicantData);
  };

  useEffect(() => {
    const handler = setTimeout(() => fetchApplicants(1), 500);
    return () => clearTimeout(handler);
  }, [query, fetchApplicants]);

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100">
              <TableHead className="w-[140px] pl-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">ID Number</TableHead>
              <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Student Name</TableHead>
              <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Status</TableHead>
              <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Course</TableHead>
              <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4 text-center">Enrolled</TableHead>
              <TableHead className="text-right pr-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell className="pl-8 py-5"><div className="h-4 w-20 bg-slate-50 rounded" /></TableCell>
                  <TableCell className="py-5"><div className="h-4 w-40 bg-slate-50 rounded" /></TableCell>
                  <TableCell className="py-5"><div className="h-6 w-16 bg-slate-50 rounded-full" /></TableCell>
                  <TableCell className="py-5"><div className="h-4 w-32 bg-slate-50 rounded" /></TableCell>
                  <TableCell className="py-5"><div className="h-4 w-24 mx-auto bg-slate-50 rounded" /></TableCell>
                  <TableCell className="text-right pr-8 py-5"><div className="ml-auto h-8 w-8 bg-slate-50 rounded" /></TableCell>
                </TableRow>
              ))
            ) : students.length > 0 ? (
              students.map((s) => (
                <TableRow key={s.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                  <TableCell className="pl-8 font-mono text-[11px] font-bold text-primary">
                    {s.id_number}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary text-[10px] font-bold">
                        {s.first_name[0]}{s.last_name[0]}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{getFullName(s)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                      s.has_card
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    )}>
                      {s.has_card ? "Issued" : "Pending"}
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    {s.course}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-700">{s.formatted_date}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-70">{s.formatted_time}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDetailClick(s)}
                      className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all font-bold"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-60 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] italic">
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between px-8 py-5 bg-slate-50/30 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Page {page} of {lastPage}
          </span>
          <div className="h-1 w-1 rounded-full bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            {students.length} Records Shown
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || loading}
            onClick={() => fetchApplicants(page - 1)}
            className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider bg-white border-slate-200 text-slate-600 hover:text-primary transition-all shadow-sm"
          >
            <ChevronLeft className="mr-2 h-3 w-3" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page === lastPage || loading}
            onClick={() => fetchApplicants(page + 1)}
            className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider bg-white border-slate-200 text-slate-600 hover:text-primary transition-all shadow-sm"
          >
            Next <ChevronRight className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantsTable;