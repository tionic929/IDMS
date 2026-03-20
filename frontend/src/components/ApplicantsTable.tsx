import React, { useState, useMemo } from "react";
import { getFullName, type Students } from "@/types/students";
import { getPaginatedApplicants, deleteApplicant } from "@/api/students";
import { ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Eye, Trash2, AlertTriangle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { preloadImage } from './AuthenticatedImage';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

interface ApplicantsTableProps {
  query: string;
  statusFilter?: string;
  sortBy?: string;
  sortDir?: string;
  onViewDetails: (applicant: ApplicantCard) => void;
}

const ApplicantsTable: React.FC<ApplicantsTableProps> = ({ query, statusFilter = '', sortBy = '', sortDir = 'asc', onViewDetails }) => {
  const [page, setPage] = useState(1);
  const [applicantToDelete, setApplicantToDelete] = useState<Students | null>(null);
  const queryClient = useQueryClient();

  // Debounce the query string
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Reset page on filter/sort changes
  React.useEffect(() => { setPage(1); }, [statusFilter, sortBy, sortDir]);

  const {
    data: paginatedData,
    isLoading: loading,
  } = useQuery({
    queryKey: ['paginatedApplicants', debouncedQuery, page, statusFilter, sortBy, sortDir],
    queryFn: () => getPaginatedApplicants(debouncedQuery, page, statusFilter, sortBy, sortDir),
    placeholderData: keepPreviousData,
  });

  const students = paginatedData?.data || [];
  const currentPage = paginatedData?.current_page || 1;
  const lastPage = paginatedData?.last_page || 1;

  const deleteMutation = useMutation({
    mutationFn: (studentId: number) => deleteApplicant(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paginatedApplicants'] });
      setApplicantToDelete(null);
    },
  });

  const VITE_API_URL = import.meta.env.VITE_API_URL;
  const getImageUrl = (path: string | null | undefined) =>
    !path ? '' : (path.startsWith('http') ? path : `${VITE_API_URL}/storage/${path}`);

  const handleDetailClick = (s: Students) => {
    const applicantData: ApplicantCard = {
      ...s,
      id: s.id,
      fullName: getFullName(s),
      idNumber: s.id_number,
      photo: getImageUrl(s.id_picture),
      signature: getImageUrl(s.signature_picture),
      paymentProof: getImageUrl(s.payment_proof),
    };
    onViewDetails(applicantData);
  };

  const confirmDelete = async () => {
    if (!applicantToDelete) return;
    deleteMutation.mutate(applicantToDelete.id);
  };

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
              <TableHead className="w-[140px] pl-8 text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">ID Number</TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">Student Name</TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">Status</TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">Course</TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4 text-center">Enrolled</TableHead>
              <TableHead className="text-right pr-8 text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell className="pl-8 py-5"><div className="h-4 w-20 bg-muted rounded" /></TableCell>
                  <TableCell className="py-5"><div className="h-4 w-40 bg-muted rounded" /></TableCell>
                  <TableCell className="py-5"><div className="h-6 w-16 bg-muted rounded-full" /></TableCell>
                  <TableCell className="py-5"><div className="h-4 w-32 bg-muted rounded" /></TableCell>
                  <TableCell className="py-5"><div className="h-4 w-24 mx-auto bg-muted rounded" /></TableCell>
                  <TableCell className="text-right pr-8 py-5"><div className="ml-auto h-8 w-8 bg-muted rounded" /></TableCell>
                </TableRow>
              ))
            ) : students.length > 0 ? (
              students.map((s) => (
                <TableRow
                  key={s.id}
                  className="group hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0"
                  onMouseEnter={() => {
                    if (s.id_picture) preloadImage(getImageUrl(s.id_picture));
                    if (s.signature_picture) preloadImage(getImageUrl(s.signature_picture));
                  }}
                >
                  <TableCell className="pl-8 font-mono text-[11px] font-bold text-primary">
                    {s.id_number}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground text-[10px] font-bold border border-border">
                        {s.first_name[0]}{s.last_name[0]}
                      </div>
                      <span className="text-xs font-bold text-foreground">{getFullName(s)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border transition-colors",
                      s.has_card
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
                    )}>
                      {s.has_card ? "Issued" : "Pending"}
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    {s.course}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-foreground">{s.formatted_date}</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-70">{s.formatted_time}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDetailClick(s)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all font-bold"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setApplicantToDelete(s)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all font-bold ml-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-60 text-center text-muted-foreground/30 text-[10px] font-black uppercase tracking-[0.2em] italic">
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between px-8 py-5 bg-muted/30 border-t border-border">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Page {page} of {lastPage}
          </span>
          <div className="h-1 w-1 rounded-full bg-border" />
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            {students.length} Records Shown
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all shadow-sm rounded-lg"
          >
            <ChevronLeft className="mr-2 h-3 w-3" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page === lastPage || loading}
            onClick={() => setPage(p => p + 1)}
            className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all shadow-sm rounded-lg"
          >
            Next <ChevronRight className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </div>

      <Dialog open={!!applicantToDelete} onOpenChange={(open) => !open && !deleteMutation.isPending && setApplicantToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-card rounded-lg p-6 sm:p-8 border-border shadow-2xl">
          <DialogHeader className="mb-2">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4 text-destructive">
              <AlertTriangle size={24} />
            </div>
            <DialogTitle className="text-xl font-black text-center text-foreground tracking-tight uppercase">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-center pt-2 text-muted-foreground font-medium">
              Are you absolutely sure you want to delete <strong className="text-foreground">{applicantToDelete ? getFullName(applicantToDelete) : ''}</strong>?
              <br />
              <span className="text-xs text-destructive font-bold block mt-3 uppercase tracking-wider">This action is destructive and will remove them from the active list.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setApplicantToDelete(null)}
              className="w-full sm:w-1/2 rounded-lg text-muted-foreground border-border hover:bg-accent mt-2 sm:mt-0"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
              className="w-full sm:w-1/2 rounded-lg bg-destructive hover:bg-destructive/90 font-bold text-destructive-foreground flex items-center justify-center gap-2"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicantsTable;