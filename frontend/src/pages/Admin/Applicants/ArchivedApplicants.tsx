import React, { useState } from "react";
import { getArchivedApplicants, deleteApplicant } from "@/api/students";
import { type Students, getFullName } from "@/types/students";
import { Trash2, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, ArchiveX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ArchivedApplicants: React.FC = () => {
  const [page, setPage] = useState(1);
  const [applicantToDelete, setApplicantToDelete] = useState<Students | null>(null);
  const queryClient = useQueryClient();

  const {
    data: paginatedData,
    isLoading: loading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['archivedApplicants', page],
    queryFn: () => getArchivedApplicants(page),
  });

  const students = paginatedData?.data || [];
  const currentPage = paginatedData?.current_page || 1;
  const lastPage = paginatedData?.last_page || 1;

  const deleteMutation = useMutation({
    mutationFn: (studentId: number) => deleteApplicant(studentId),
    onSuccess: () => {
      toast.success("Applicant permanently deleted.");
      queryClient.invalidateQueries({ queryKey: ['archivedApplicants'] });
      setApplicantToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete applicant.");
    },
  });

  const confirmDelete = async () => {
    if (!applicantToDelete) return;
    deleteMutation.mutate(applicantToDelete.id);
  };

  return (
    <div className="flex-1 bg-background text-foreground font-sans transition-colors duration-300 flex flex-col min-h-full">
      <div className="px-6 py-6 max-w-7xl mx-auto w-full">
        {/* PAGE HEADER */}
        <div className="mb-8">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Reports / Archived</span>
          <div className="flex items-center justify-between mt-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <ArchiveX className="w-8 h-8 text-destructive/80" />
              Archived Applicants
            </h1>
            <Button
              variant="default"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2 h-9 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[11px]"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            These applicants have been rejected / archived. You can permanently remove them from the system below.
          </p>
        </div>

        {/* DATA TABLE */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b border-border">
                  <TableHead className="w-[140px] pl-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">ID Number</TableHead>
                  <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">Student Name</TableHead>
                  <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">Course</TableHead>
                  <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">Status</TableHead>
                  <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4 text-center">Archived Date</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground/50 text-[11px] font-bold uppercase tracking-widest">
                      Loading records...
                    </TableCell>
                  </TableRow>
                ) : students.length > 0 ? (
                  students.map((s) => (
                    <TableRow key={s.id} className="group hover:bg-destructive/5 transition-colors border-b border-border/50">
                      <TableCell className="pl-6 font-mono text-[11px] font-bold text-muted-foreground">
                        {s.id_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-foreground">{getFullName(s)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                        {s.course}
                      </TableCell>
                      <TableCell>
                         <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border bg-destructive/10 text-destructive border-destructive/20">
                            Archived
                         </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {s.archived_at ? new Date(s.archived_at).toLocaleDateString() : 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setApplicantToDelete(s)}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all font-bold"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-60 text-center text-muted-foreground/40 text-[11px] font-black uppercase tracking-[0.2em] italic">
                      No archived records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION */}
          {students.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 bg-muted/20 border-t border-border">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Page {currentPage} of {lastPage || 1}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1 || loading}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all shadow-sm rounded-lg"
                  >
                    <ChevronLeft className="mr-2 h-3 w-3" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === lastPage || loading || lastPage === 0}
                    onClick={() => setPage(p => p + 1)}
                    className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all shadow-sm rounded-lg"
                  >
                    Next <ChevronRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!applicantToDelete} onOpenChange={(open) => !open && !deleteMutation.isPending && setApplicantToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-card rounded-2xl p-6 sm:p-8 border border-destructive/20 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
          <DialogHeader className="mb-2">
            <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-5 text-destructive border border-destructive/20 shadow-inner">
              <AlertTriangle size={28} />
            </div>
            <DialogTitle className="text-xl font-black text-center text-foreground tracking-tight uppercase">Permanent Deletion</DialogTitle>
            <DialogDescription className="text-center pt-3 text-muted-foreground font-medium leading-relaxed">
              Are you absolutely sure you want to permanently delete <strong className="text-foreground">{applicantToDelete ? getFullName(applicantToDelete) : ''}</strong> from the database?
              <br />
              <span className="text-xs text-destructive font-black block mt-4 uppercase tracking-[0.1em] p-2 bg-destructive/5 rounded-lg border border-destructive/10">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setApplicantToDelete(null)}
              className="w-full sm:w-1/2 rounded-xl h-11 text-muted-foreground font-bold border-border hover:bg-accent hover:text-foreground uppercase tracking-wider text-[11px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
              className="w-full sm:w-1/2 rounded-xl h-11 bg-destructive hover:bg-destructive/90 font-black text-destructive-foreground flex items-center justify-center gap-2 uppercase tracking-wider text-[11px] shadow-lg shadow-destructive/20"
            >
              {deleteMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleteMutation.isPending ? 'Erasing...' : 'Delete Forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArchivedApplicants;
