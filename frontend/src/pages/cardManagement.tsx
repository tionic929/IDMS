import React, { useState, useMemo, useCallback, Suspense, lazy, useEffect } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useSearchParams } from 'react-router-dom';
import {
    Search, Trash2, Printer, RefreshCw, CheckCircle2,
    Database, CheckSquare, Square, ZoomIn, ZoomOut, RotateCcw,
    CreditCard, X, Camera, MapPin, User as UserIcon, Receipt,
} from 'lucide-react';

import { toast } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';
import { archiveApplicant, deleteApplicant, confirmApplicant } from '@/api/students';

import type { Students } from '@/types/students';
import { type ApplicantCard } from '@/types/card';

import IDCardPreview from '@/components/IDCardPreview';
import CardManagementSkeleton from '@/components/skeletons/CardManagementSkeleton';
import { Button } from '@/components/ui/button';
import { MIN_ZOOM, MAX_ZOOM } from '@/constants/dimensions';
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { useStudents } from '@/context/StudentContext';
import { useTemplates } from '@/context/TemplateContext';

const PrintPreviewModal = lazy(() => import('@/components/PrintPreviewModal'));
const PaymentProofModal = lazy(() => import('@/components/PaymentProofModal'));

const VITE_API_URL = import.meta.env.VITE_API_URL;

// ─── helpers ─────────────────────────────────────────────────────────────────
const getUrl = (path: string | null) =>
    !path ? '' : path.startsWith('http') ? path : `${VITE_API_URL}/storage/${path}`;

const toCard = (s: Students): ApplicantCard => ({
    id: s.id,
    fullName: `${s.first_name} ${s.last_name}`,
    manual_full_name: s.manual_full_name,
    idNumber: s.id_number,
    course: s.course,
    photo: getUrl(s.id_picture),
    signature: getUrl(s.signature_picture),
    guardian_name: s.guardian_name,
    guardian_contact: s.guardian_contact,
    address: s.address,
    email: s.email,
});

// ─── Resizers ──────────────────────────────────────────────────────────────────
const VResizeHandle = () => (
    <PanelResizeHandle className="w-1.5 bg-border/40 hover:bg-primary/50 active:bg-primary transition-colors cursor-col-resize flex items-center justify-center -mx-0.5 z-10">
        <div className="w-0.5 h-8 bg-muted-foreground/30 rounded-full" />
    </PanelResizeHandle>
);

const HResizeHandle = () => (
    <PanelResizeHandle className="h-1.5 bg-border/40 hover:bg-primary/50 active:bg-primary transition-colors cursor-row-resize flex items-center justify-center -my-0.5 z-10">
        <div className="h-0.5 w-8 bg-muted-foreground/30 rounded-full" />
    </PanelResizeHandle>
);

// ─── Zoom strip ───────────────────────────────────────────────────────────────
const ZoomStrip = ({ scale, onIn, onOut, onReset }: {
    scale: number; onIn: () => void; onOut: () => void; onReset: () => void;
}) => (
    <div className="flex items-center bg-muted/50 border border-border rounded-lg overflow-hidden divide-x divide-border">
        <button onClick={onOut} className="p-1.5 hover:bg-muted text-muted-foreground transition-colors"><ZoomOut size={12} /></button>
        <span className="px-2.5 text-[9px] font-black text-muted-foreground tabular-nums select-none min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
        <button onClick={onIn} className="p-1.5 hover:bg-muted text-muted-foreground transition-colors"><ZoomIn size={12} /></button>
        <button onClick={onReset} className="p-1.5 hover:bg-muted text-muted-foreground transition-colors"><RotateCcw size={11} /></button>
    </div>
);

// ─── Pending row ──────────────────────────────────────────────────────────────
const PendingRow = React.memo(({
    student, isActive, isSelected, onSelect, onView, courses,
}: {
    student: Students; isActive: boolean; isSelected: boolean;
    onSelect: (id: number) => void; onView: (id: number) => void; courses: any;
}) => (
    <TableRow
        onClick={() => onView(student.id)}
        className={cn(
            'group cursor-pointer transition-colors select-none',
            isActive ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-accent/40'
        )}
    >
        <TableCell className="pl-3 w-8 py-2" onClick={e => { e.stopPropagation(); onSelect(student.id); }}>
            {isSelected
                ? <CheckSquare size={13} className="text-primary" />
                : <Square size={13} className="opacity-20 group-hover:opacity-50 transition-opacity" />}
        </TableCell>
        <TableCell className="py-2 min-w-[200px]">
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <span className="text-[7px] text-primary/70 font-bold uppercase leading-tight mb-0.5 tracking-wider">Full Name</span>
                    <p className="text-[10px] font-black uppercase leading-tight text-primary">
                        {student.manual_full_name || `${student.first_name} ${student.middle_initial ? `${student.middle_initial} ` : ''}${student.last_name}`}
                    </p>
                </div>
            </div>
        </TableCell>
        <TableCell className="py-2 font-mono text-[9px] font-bold text-muted-foreground">{student.id_number}</TableCell>
        <TableCell className="py-2">
            <span className={cn('text-[8px] font-black uppercase px-1.5 py-0.5 rounded border',
                courses[student.course]?.border || 'border-zinc-200',
                courses[student.course]?.color || 'text-zinc-500'
            )}>{student.course}</span>
        </TableCell>
        <TableCell className="py-2 pr-2 text-right">
            <span className="text-amber-500 text-[8px] font-black uppercase flex items-center gap-1 justify-end">
                <RefreshCw size={9} className="animate-spin" /> Queued
            </span>
        </TableCell>
    </TableRow>
));

// ─── Confirmed row ────────────────────────────────────────────────────────────
const ConfirmedRow = React.memo(({
    student, isActive, onView, onPrint, onArchive, onDelete, courses,
}: {
    student: Students; isActive: boolean;
    onView: (id: number) => void; onPrint: (s: Students) => void;
    onArchive: (id: number) => void; onDelete: (id: number) => void; courses: any;
}) => (
    <TableRow
        onClick={() => onView(student.id)}
        className={cn(
            'group cursor-pointer transition-colors select-none',
            isActive ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-accent/40'
        )}
    >
        <TableCell className="pl-4 py-2 min-w-[200px]">
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <span className="text-[7px] text-primary/70 font-bold uppercase leading-tight mb-0.5 tracking-wider">Full Name</span>
                    <p className="text-[10px] font-black uppercase leading-tight text-primary">
                        {student.manual_full_name || `${student.first_name} ${student.middle_initial ? `${student.middle_initial} ` : ''}${student.last_name}`}
                    </p>
                </div>
            </div>
        </TableCell>
        <TableCell className="py-2 font-mono text-[9px] font-bold text-muted-foreground">{student.id_number}</TableCell>
        <TableCell className="py-2">
            <span className={cn('text-[8px] font-black uppercase px-1.5 py-0.5 rounded border',
                courses[student.course]?.border || 'border-zinc-200',
                courses[student.course]?.color || 'text-zinc-500'
            )}>{student.course}</span>
        </TableCell>
        <TableCell className="py-2 pr-2">
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={e => { e.stopPropagation(); onArchive(student.id); }}
                    className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    title="Archive"><Database size={10} /></button>
                <button onClick={e => { e.stopPropagation(); onDelete(student.id); }}
                    className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    title="Delete"><Trash2 size={10} /></button>
                <button onClick={e => { e.stopPropagation(); onPrint(student); }}
                    className="h-5 px-2 flex items-center gap-1 rounded bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[8px] uppercase transition-all shadow-sm shadow-primary/20"
                    title="Print"><Printer size={9} /> Print</button>
            </div>
        </TableCell>
    </TableRow>
));

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ label, icon: Icon = Database, colSpan = 5 }: {
    label: string; icon?: React.ElementType; colSpan?: number;
}) => (
    <TableRow className="hover:bg-transparent">
        <TableCell colSpan={colSpan} className="py-10 text-center">
            <div className="flex flex-col items-center gap-2 opacity-20">
                <Icon size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </div>
        </TableCell>
    </TableRow>
);

// ─── Override field ───────────────────────────────────────────────────────────
const OverrideField = ({ label, value, onChange }: {
    label: string; value: string; onChange: (v: string) => void;
}) => (
    <div className="space-y-1">
        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider block">{label}</span>
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-foreground outline-none focus:border-primary transition-colors" />
    </div>
);

// ═════════════════════════════════════════════════════════════════════════════
const Dashboard: React.FC = () => {

    // ── context ───────────────────────────────────────────────────────────────
    const { allStudents, loading: studentsLoading, refreshStudents: refetch, updateStudentLocal } = useStudents();
    const { templates: allTemplates, loading: templatesLoading } = useTemplates();
    const [searchParams] = useSearchParams();

    // ── local state ───────────────────────────────────────────────────────────
    // Local overlay on top of allStudents so confirmations feel instant
    const [localArchivedIds, setLocalArchivedIds] = useState<Set<number>>(new Set());
    const [localDeletedIds, setLocalDeletedIds] = useState<Set<number>>(new Set());

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [previewingId, setPreviewingId] = useState<number | null>(null);
    const [previewSection, setPreviewSection] = useState<'queued' | 'confirmed'>('queued');

    const [previewScale, setPreviewScale] = useState(0.7);
    const [printData, setPrintData] = useState<{ student: ApplicantCard; layout: any } | null>(null);
    const [viewingPaymentProof, setViewingPaymentProof] = useState<string | null>(null);

    // Confirmation Modal State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [idsToConfirm, setIdsToConfirm] = useState<number[]>([]);

    // Right panel overrides
    const [overrides, setOverrides] = useState<any>({});
    const [hasOverrides, setHasOverrides] = useState(false);
    const updateOverride = (key: string, value: any) => {
        setOverrides((p: any) => ({ ...p, [key]: value }));
        setHasOverrides(true);
    };
    const resetOverrides = () => { setOverrides({}); setHasOverrides(false); };

    // Auto-cleanup optimistic state when server reflects changes
    useEffect(() => {
        setLocalArchivedIds(prev => {
            if (prev.size === 0) return prev;
            const next = new Set(prev);
            allStudents.forEach(s => { if (s.is_archived) next.delete(s.id); });
            return next.size === prev.size ? prev : next;
        });
    }, [allStudents]);

    const Courses = useMemo(() => ({
        'BSGE': { color: 'text-red-600', border: 'border-red-200' },
        'BSN': { color: 'text-pink-500', border: 'border-pink-200' },
        'BSIT': { color: 'text-cyan-600', border: 'border-cyan-200' },
        'BSBA': { color: 'text-amber-600', border: 'border-amber-200' },
        'BSCRIM': { color: 'text-zinc-700', border: 'border-zinc-200' },
        'BSED': { color: 'text-violet-600', border: 'border-violet-200' },
        'BSCS': { color: 'text-blue-600', border: 'border-blue-200' },
        'HE': { color: 'text-rose-600', border: 'border-rose-200' },
        'MIDWIFERY': { color: 'text-fuchsia-600', border: 'border-fuchsia-200' },
        'ABM': { color: 'text-orange-600', border: 'border-orange-200' },
        'JD': { color: 'text-indigo-600', border: 'border-indigo-200' },
    }), []);

    // ── URL auto-select ───────────────────────────────────────────────────────
    useEffect(() => {
        const sel = searchParams.get('select');
        if (sel && allStudents.length > 0) {
            const found = allStudents.find((s: Students) => s.id_number === sel);
            if (found) { setPreviewingId(found.id); setPreviewSection(found.has_card ? 'confirmed' : 'queued'); }
        }
    }, [searchParams, allStudents]);

    // ── derived lists (merge server state + local overlay) ────────────────────
    const effectiveStudents: Students[] = useMemo(() =>
        allStudents
            .filter((s: Students) => !s.is_archived && !localArchivedIds.has(s.id) && !localDeletedIds.has(s.id)),
        [allStudents, localArchivedIds, localDeletedIds]
    );

    const pendingStudents = useMemo(() => effectiveStudents.filter(s => !s.has_card), [effectiveStudents]);
    const confirmedStudents = useMemo(() => effectiveStudents.filter(s => s.has_card), [effectiveStudents]);

    // ── layout resolver ───────────────────────────────────────────────────────
    const getLayout = useCallback((student: Students | null) => {
        if (!student || allTemplates.length === 0) return null;
        const studentCourse = student.course.trim().toUpperCase();
        console.log('[getLayout] Student course:', JSON.stringify(studentCourse));
        console.log('[getLayout] Available templates:', allTemplates.map((t: any) => ({ id: t.id, name: t.name, nameUpper: t.name.trim().toUpperCase(), is_active: t.is_active })));
        const matched = allTemplates.find((t: any) => t.name.trim().toUpperCase() === studentCourse);
        console.log('[getLayout] Matched template:', matched ? { id: matched.id, name: matched.name } : 'NONE — using fallback');
        const tpl = matched || allTemplates.find((t: any) => t.is_active) || allTemplates[0];
        console.log('[getLayout] Using template:', { id: tpl.id, name: tpl.name });
        return { front: tpl.front_config, back: tpl.back_config, previewImages: tpl.preview_images || { front: '', back: '' } };
    }, [allTemplates]);

    // ── active preview student ────────────────────────────────────────────────
    const previewStudent = useMemo(() => {
        const pool = previewSection === 'queued' ? pendingStudents : confirmedStudents;
        if (previewingId) {
            const found = pool.find(s => s.id === previewingId);
            if (found) return found;
        }
        return pool[0] || null;
    }, [previewingId, previewSection, pendingStudents, confirmedStudents]);

    const previewLayout = useMemo(() => getLayout(previewStudent), [previewStudent, getLayout]);

    // Build preview card with overrides
    const previewCard = useMemo((): (ApplicantCard & { originalFullName: string }) | null => {
        if (!previewStudent) return null;
        const base = toCard(previewStudent);
        const originalFullName = `${previewStudent.first_name} ${previewStudent.middle_initial ? `${previewStudent.middle_initial} ` : ''}${previewStudent.last_name}`;
        return {
            ...base,
            originalFullName,
            fullName: overrides.fullName ?? base.fullName,
            idNumber: overrides.idNumber ?? base.idNumber,
            course: overrides.course ?? base.course,
            photo: overrides.photo ?? base.photo,
            signature: overrides.signature ?? base.signature,
            guardian_name: overrides.guardian_name ?? base.guardian_name,
            guardian_contact: overrides.guardian_contact ?? base.guardian_contact,
            address: overrides.address ?? base.address,
            email: overrides.email ?? base.email,
        };
    }, [previewStudent, overrides]);

    // Reset overrides when switching student
    useEffect(() => { resetOverrides(); }, [previewingId]);

    // ── select-all (pending only) ─────────────────────────────────────────────
    const allPendingIds = pendingStudents.map(s => s.id);
    const allSelected = allPendingIds.length > 0 && allPendingIds.every(id => selectedIds.includes(id));
    const someSelected = selectedIds.length > 0;
    const toggleSelectAll = () => setSelectedIds(allSelected ? [] : allPendingIds);
    const handleSelect = useCallback((id: number) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]), []);

    // ── actions ───────────────────────────────────────────────────────────────

    // Confirm one or many — optimistic update, no page refresh
    const handleConfirmSelected = () => {
        console.log('[CardManagement] Confirm Selected Clicked', { selectedIds, previewingId });
        const ids = selectedIds.length > 0
            ? selectedIds.filter(id => pendingStudents.some(s => s.id === id))
            : previewStudent ? [previewStudent.id] : [];

        console.log('[CardManagement] IDs to confirm:', ids);
        if (ids.length === 0) {
            toast.info('No applicants selected');
            console.warn('[CardManagement] No IDs to confirm');
            return;
        }

        setIdsToConfirm(ids);
        setIsConfirmModalOpen(true);
    };

    const executeConfirmation = async () => {
        console.log('[CardManagement] Executing confirmation for IDs:', idsToConfirm);
        setIsConfirmModalOpen(false);
        const finalIds = idsToConfirm;
        if (finalIds.length === 0) return;

        // Dynamic update via context
        finalIds.forEach(id => updateStudentLocal(id, { has_card: true }));
        setSelectedIds([]);

        // Switch preview to confirmed section for the first one
        setPreviewSection('confirmed');
        setPreviewingId(finalIds[0]);

        // Fire API calls in background
        const results = await Promise.allSettled(finalIds.map(id => confirmApplicant(id)));
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
            console.error(`[CardManagement] ${failed} confirmations failed`);
            toast.error(`${failed} confirmation(s) failed — refreshing`);
            refetch();
        } else {
            console.log(`[CardManagement] Successfully confirmed ${finalIds.length} applicants`);
            toast.success(`${finalIds.length} applicant(s) confirmed`);
        }
    };

    const handleArchive = async (id: number) => {
        if (!window.confirm('Archive this applicant?')) return;
        setLocalArchivedIds(prev => new Set([...prev, id]));
        if (previewingId === id) setPreviewingId(null);
        try { await archiveApplicant(id); toast.success('Archived'); }
        catch { setLocalArchivedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); toast.error('Failed to archive'); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Permanently delete this applicant?')) return;
        setLocalDeletedIds(prev => new Set([...prev, id]));
        if (previewingId === id) setPreviewingId(null);
        try { await deleteApplicant(id); toast.success('Deleted'); }
        catch { setLocalDeletedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); toast.error('Failed to delete'); }
    };

    const handlePrint = (s: Students) => {
        const layout = getLayout(s);
        if (layout) setPrintData({ student: toCard(s), layout });
    };

    const handlePrintPreview = () => {
        if (previewStudent && previewCard && previewLayout)
            setPrintData({ student: previewCard, layout: previewLayout });
    };

    if (studentsLoading || templatesLoading) return <CardManagementSkeleton />;

    // ═════════════════════════════════════════════════════════════════════════
    return (
        <><div className="h-full bg-background text-foreground flex overflow-hidden transition-colors duration-300">
            <Suspense fallback={<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                <RefreshCw className="animate-spin text-white" size={48} />
            </div>}>
                <AnimatePresence>
                    {printData && <PrintPreviewModal data={printData.student} layout={printData.layout} onClose={() => setPrintData(null)} />}
                </AnimatePresence>
            </Suspense>

            <Suspense fallback={null}>
                <AnimatePresence>
                    {viewingPaymentProof && (
                        <PaymentProofModal
                            url={viewingPaymentProof}
                            onClose={() => setViewingPaymentProof(null)} />
                    )}
                </AnimatePresence>
            </Suspense>

            <PanelGroup orientation="horizontal" className="w-full h-full">

                {/* ══════════════════════════════════════════════════════
        LEFT SIDEBAR — resizable
    ══════════════════════════════════════════════════════ */}
                <Panel defaultSize={20} minSize={15} maxSize={35} className="flex flex-col bg-card border-r border-border relative z-10">

                    {/* Search */}
                    <div className="px-3 py-2.5 border-b border-border shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Applications</span>
                            <span className="text-[8px] font-bold text-muted-foreground">{effectiveStudents.length} total</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={11} />
                            <input type="text" placeholder="Search by name, ID or course…"
                                className="w-full pl-7 pr-3 py-1.5 bg-muted/50 border border-border rounded-lg outline-none text-[10px] font-bold focus:border-primary transition-colors" />
                        </div>
                    </div>

                    <PanelGroup orientation="vertical">
                        {/* ── SECTION A: Pending Queue */}
                        <Panel defaultSize={50} minSize={20} className="flex flex-col overflow-hidden">
                            {/* Section header */}
                            <div className="px-3 py-2 flex items-center justify-between shrink-0 bg-muted/30 border-b border-border">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Pending Queue</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {someSelected && (
                                        <button
                                            onClick={handleConfirmSelected}
                                            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[8px] uppercase transition-all shadow-sm shadow-primary/30"
                                        >
                                            <CheckCircle2 size={9} /> Confirm {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                                        </button>
                                    )}
                                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black tabular-nums">
                                        {pendingStudents.length}
                                    </span>
                                </div>
                            </div>

                            {/* Pending table — scrollable */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="pl-3 w-8 h-7 cursor-pointer py-0" onClick={toggleSelectAll}>
                                                {allSelected
                                                    ? <CheckSquare size={12} className="text-primary" />
                                                    : <Square size={12} className="opacity-30 hover:opacity-60 transition-opacity" />}
                                            </TableHead>
                                            <TableHead className="text-[8px] font-black uppercase h-7 py-0">Identity</TableHead>
                                            <TableHead className="text-[8px] font-black uppercase h-7 py-0">ID No.</TableHead>
                                            <TableHead className="text-[8px] font-black uppercase h-7 py-0">Course</TableHead>
                                            <TableHead className="text-[8px] font-black uppercase h-7 py-0 text-right pr-2">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingStudents.length === 0
                                            ? <EmptyState label="No pending applicants" colSpan={5} />
                                            : pendingStudents.map(s => (
                                                <PendingRow
                                                    key={s.id}
                                                    student={s}
                                                    isActive={previewStudent?.id === s.id && previewSection === 'queued'}
                                                    isSelected={selectedIds.includes(s.id)}
                                                    onSelect={handleSelect}
                                                    onView={id => { setPreviewingId(id); setPreviewSection('queued'); }}
                                                    courses={Courses} />
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Panel>

                        <HResizeHandle />

                        {/* ── SECTION B: Issued / Printed */}
                        <Panel defaultSize={50} minSize={20} className="flex flex-col overflow-hidden">
                            {/* Section header */}
                            <div className="px-3 py-2 flex items-center justify-between shrink-0 bg-muted/30 border-b border-border">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Issued / Printed</span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black tabular-nums">
                                    {confirmedStudents.length}
                                </span>
                            </div>

                            {/* Confirmed table — scrollable */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="pl-4 text-[8px] font-black uppercase h-7 py-0">Identity</TableHead>
                                            <TableHead className="text-[8px] font-black uppercase h-7 py-0">ID No.</TableHead>
                                            <TableHead className="text-[8px] font-black uppercase h-7 py-0">Course</TableHead>
                                            <TableHead className="h-7 py-0 w-28" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {confirmedStudents.length === 0
                                            ? <EmptyState label="No issued cards yet" icon={Printer} colSpan={4} />
                                            : confirmedStudents.map(s => (
                                                <ConfirmedRow
                                                    key={s.id}
                                                    student={s}
                                                    isActive={previewStudent?.id === s.id && previewSection === 'confirmed'}
                                                    onView={id => { setPreviewingId(id); setPreviewSection('confirmed'); }}
                                                    onPrint={handlePrint}
                                                    onArchive={handleArchive}
                                                    onDelete={handleDelete}
                                                    courses={Courses} />
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Panel>
                    </PanelGroup>
                </Panel>

                <VResizeHandle />

                {/* ══════════════════════════════════════════════════════
        CENTER — ID CARD PREVIEW (large)
    ══════════════════════════════════════════════════════ */}
                <Panel defaultSize={60} minSize={30} className="flex flex-col bg-background min-w-0 relative z-0">
                    <PanelGroup orientation="vertical">
                        <Panel defaultSize={85} minSize={50} className="flex flex-col">
                            {previewStudent && previewCard && previewLayout ? (
                                <div className="flex-1 overflow-auto custom-scrollbar flex flex-col items-center justify-center p-8">
                                    <div className="flex items-center justify-center gap-8 mb-8">
                                        <div className="shadow-2xl rounded-sm overflow-hidden ring-1 ring-border shrink-0">
                                            <IDCardPreview data={previewCard} layout={previewLayout} side="FRONT" scale={previewScale} />
                                        </div>
                                        <div className="shadow-2xl rounded-sm overflow-hidden ring-1 ring-border shrink-0">
                                            <IDCardPreview data={previewCard} layout={previewLayout} side="BACK" scale={previewScale} />
                                        </div>
                                    </div>

                                    {/* Comparison Banner */}
                                    <div className="flex items-center gap-6 bg-card/80 backdrop-blur-sm border border-border px-8 py-4 rounded-2xl shadow-xl">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">FULL NAME</span>
                                            <p className="text-2xl font-black uppercase tracking-tight text-primary">
                                                {previewCard.manual_full_name || previewCard.originalFullName}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-20">
                                    <CreditCard size={40} />
                                    <p className="text-[9px] font-black uppercase tracking-widest">Select an applicant to preview</p>
                                </div>
                            )}
                        </Panel>

                        <HResizeHandle />

                        {/* Bottom action bar */}
                        <Panel defaultSize={15} minSize={10} maxSize={30} className="flex flex-col bg-card border-t border-border">
                            {previewStudent && previewCard && previewLayout && (
                                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar px-6 py-4 flex items-center justify-between gap-4 min-h-0">
                                    {/* Zoom */}
                                    <ZoomStrip
                                        scale={previewScale}
                                        onOut={() => setPreviewScale(p => Math.max(MIN_ZOOM, +(p - 0.1).toFixed(1)))}
                                        onIn={() => setPreviewScale(p => Math.min(MAX_ZOOM, +(p + 0.1).toFixed(1)))}
                                        onReset={() => setPreviewScale(0.7)}
                                    />

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {/* Reject (archive) */}
                                        <button
                                            onClick={() => handleArchive(previewStudent.id)}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 active:bg-destructive text-destructive-foreground font-black text-[10px] uppercase transition-all shadow-lg shadow-destructive/20"
                                        >
                                            <X size={13} /> Reject
                                        </button>

                                        {/* Confirm — only show for pending */}
                                        {previewSection === 'queued' && (
                                            <button
                                                onClick={handleConfirmSelected}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase transition-all shadow-lg"
                                            >
                                                <CheckCircle2 size={13} />
                                                {selectedIds.length > 1 ? `Confirm (${selectedIds.length})` : 'Confirm'}
                                            </button>
                                        )}

                                        {/* Payment Proof */}
                                        {previewStudent.payment_proof && (
                                            <button
                                                onClick={() => setViewingPaymentProof(
                                                    previewStudent.payment_proof!.startsWith('http')
                                                        ? previewStudent.payment_proof!
                                                        : `${VITE_API_URL}/storage/${previewStudent.payment_proof}`
                                                )}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted hover:bg-accent border border-border text-foreground font-black text-[10px] uppercase transition-all"
                                            >
                                                <Receipt size={13} /> Payment Proof
                                            </button>
                                        )}

                                        {/* Print */}
                                        <button
                                            onClick={handlePrintPreview}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary text-primary-foreground font-black text-[10px] uppercase transition-all shadow-lg shadow-primary/20"
                                        >
                                            <Printer size={13} /> Print
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Panel>
                    </PanelGroup>
                </Panel>

                <VResizeHandle />

                {/* ══════════════════════════════════════════════════════
                    RIGHT PANEL — APPLICATION INFO (overrides)
                ══════════════════════════════════════════════════════ */}
                <Panel defaultSize={20} minSize={15} maxSize={35} className="flex flex-col border-l border-border bg-card relative z-10">

                    {/* Header */}
                    <div className="px-3 py-3 border-b border-border flex flex-col items-center text-center shrink-0">
                        <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-1.5 shadow">
                            <Database size={15} />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-tight text-foreground">Edit Details</p>
                    </div>

                    {previewStudent && previewCard ? (
                        <>
                            {/* Dirty indicator */}
                            <div className={cn(
                                'flex items-center justify-between px-3 py-1.5 text-[8px] font-black uppercase tracking-widest transition-all border-b',
                                hasOverrides
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                    : 'bg-muted/50 border-border text-muted-foreground'
                            )}>
                                <span>{hasOverrides ? '● Overrides' : '○ No changes'}</span>
                                {hasOverrides && (
                                    <button onClick={resetOverrides} className="flex items-center gap-0.5 hover:text-red-500 transition-colors">
                                        <RotateCcw size={9} /> Reset
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-hide">

                                {/* Front side */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-1.5">
                                        <UserIcon size={9} className="text-muted-foreground" />
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Front Side</p>
                                    </div>
                                    <OverrideField label="Full Name" value={previewCard.fullName || ''} onChange={v => updateOverride('fullName', v)} />
                                    <OverrideField label="Department" value={previewCard.course || ''} onChange={v => updateOverride('course', v)} />
                                    <OverrideField label="ID Number" value={previewCard.idNumber || ''} onChange={v => updateOverride('idNumber', v)} />
                                    {/* Photo */}
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block">Photo</span>
                                        <button onClick={() => document.getElementById('photo-input')?.click()}
                                            className="w-full h-14 bg-muted/50 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary transition-all overflow-hidden">
                                            {previewCard.photo
                                                ? <img src={previewCard.photo} className="w-full h-full object-cover" alt="" />
                                                : <><Camera size={14} className="text-muted-foreground" /><span className="text-[7px] font-black uppercase text-muted-foreground">Upload Photo</span></>
                                            }
                                        </button>
                                        <input id="photo-input" type="file" hidden accept="image/*"
                                            onChange={e => { const f = e.target.files?.[0]; if (f) updateOverride('photo', URL.createObjectURL(f)); }} />
                                    </div>
                                </div>

                                {/* Back side */}
                                <div className="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={9} className="text-muted-foreground" />
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Back Side</p>
                                    </div>
                                    <OverrideField label="Guardian Name" value={previewCard.guardian_name || ''} onChange={v => updateOverride('guardian_name', v)} />
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider block">Address</span>
                                        <textarea value={previewCard.address || ''} onChange={e => updateOverride('address', e.target.value)}
                                            className="w-full bg-muted/50 border border-border rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-foreground outline-none focus:border-primary transition-colors h-12 resize-none" />
                                    </div>
                                    <OverrideField label="Guardian Contact" value={previewCard.guardian_contact || ''} onChange={v => updateOverride('guardian_contact', v)} />
                                    <OverrideField label="Applicant Email" value={previewCard.email || ''} onChange={v => updateOverride('email', v)} />
                                    {/* Signature */}
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block">Signature</span>
                                        <button onClick={() => document.getElementById('sig-input')?.click()}
                                            className="w-full h-14 bg-muted/50 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary transition-all overflow-hidden">
                                            {previewCard.signature
                                                ? <img src={previewCard.signature} className="w-full h-full object-contain p-1.5" alt="" />
                                                : <><RefreshCw size={14} className="text-muted-foreground" /><span className="text-[7px] font-black uppercase text-muted-foreground">Upload Sig.</span></>
                                            }
                                        </button>
                                        <input id="sig-input" type="file" hidden accept="image/*"
                                            onChange={e => { const f = e.target.files?.[0]; if (f) updateOverride('signature', URL.createObjectURL(f)); }} />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-30">
                            <UserIcon size={20} className="mb-2" />
                            <p className="text-[8px] uppercase font-black tracking-widest">No applicant selected</p>
                        </div>
                    )}
                </Panel>
            </PanelGroup>

            {/* Confirmation Modal */}
            <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-card border-border p-0 overflow-hidden rounded-2xl shadow-2xl">
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                <CheckCircle2 className="text-primary" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Confirm Applicants</h3>
                                <p className="text-xs font-medium text-muted-foreground mt-1">
                                    You are about to move <span className="text-foreground font-bold">{idsToConfirm.length}</span> applicant(s) to the issued list.
                                </p>
                            </div>
                        </div>

                        <div className="bg-muted/50 rounded-xl p-4 border border-border mb-6">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                Proceeding will update the card status for these students and move them to the "Issued / Printed" section. This action can be reversed via the dashboard if needed.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all border border-border"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={executeConfirmation}
                                className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/25 border-none"
                            >
                                Confirm & Move
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
        </>
    );
};

export default Dashboard;