import React, { Suspense, lazy } from 'react';
import { Panel, Group as PanelGroup } from 'react-resizable-panels';
import {
    Search, RefreshCw, CheckCircle2,
    Database, CreditCard, X, Camera, MapPin, User as UserIcon, Receipt,
    Printer, RotateCcw, AlertCircle
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

import IDCardPreview from '@/components/IDCardPreview';
import CardManagementSkeleton from '@/components/skeletons/CardManagementSkeleton';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { MIN_ZOOM, MAX_ZOOM } from '@/constants/dimensions';

import { useCardManagement } from './hooks/useCardManagement';
import { Courses } from './utils';
import { ZoomStrip } from './components/ZoomStrip';
import { VResizeHandle, HResizeHandle } from './components/ResizeHandles';
import { PendingRow, ConfirmedRow } from './components/Rows';
import { EmptyState } from './components/EmptyState';
import { OverrideField } from './components/OverrideField';

const PrintPreviewModal = lazy(() => import('@/components/PrintPreviewModal'));
const PaymentProofModal = lazy(() => import('@/components/PaymentProofModal'));

const VITE_API_URL = import.meta.env.VITE_API_URL;

const CardManagementPage: React.FC = () => {
    const { state, actions } = useCardManagement();

    if (state.studentsLoading || state.templatesLoading) {
        return <CardManagementSkeleton />;
    }

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden transition-colors duration-300">
            <Suspense fallback={<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                <RefreshCw className="animate-spin text-white" size={48} />
            </div>}>
                <AnimatePresence>
                    {state.printData && <PrintPreviewModal data={state.printData.student} layout={state.printData.layout} onClose={() => actions.setPrintData(null)} />}
                </AnimatePresence>
            </Suspense>

            <Suspense fallback={null}>
                <AnimatePresence>
                    {state.viewingPaymentProof && (
                        <PaymentProofModal
                            url={state.viewingPaymentProof}
                            onClose={() => actions.setViewingPaymentProof(null)} />
                    )}
                </AnimatePresence>
            </Suspense>

            <PanelGroup orientation="horizontal" className="w-full h-full">

                {/* ══════════════════════════════════════════════════════
                    LEFT SIDEBAR — resizable
                ══════════════════════════════════════════════════════ */}
                <Panel defaultSize={400} minSize={250} maxSize={400} className="flex flex-col bg-card border-r border-border relative z-10">

                    {/* Search */}
                    <div className="px-3 py-2.5 border-b border-border shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Applications</span>
                            <span className="text-[8px] font-bold text-muted-foreground">{state.effectiveStudents.length} total</span>
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
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Pending List</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {state.someSelected && (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                                            <button
                                                onClick={actions.handleConfirmSelected}
                                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] uppercase transition-all shadow-sm shadow-emerald-500/20"
                                            >
                                                <CheckCircle2 size={10} /> Confirm ({state.selectedIds.length})
                                            </button>
                                            <button
                                                onClick={actions.handleArchiveSelected}
                                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white font-black text-[9px] uppercase transition-all shadow-sm shadow-rose-500/20"
                                            >
                                                <X size={10} /> Reject ({state.selectedIds.length})
                                            </button>
                                        </div>
                                    )}
                                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black tabular-nums">
                                        {state.pendingStudents.length}
                                    </span>
                                </div>
                            </div>

                            {/* Pending table — scrollable */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                                <Table className="table-fixed w-full">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="pl-3 w-8 h-7 cursor-pointer py-0" onClick={actions.toggleSelectAll}>
                                                {state.allSelected
                                                    ? <CheckCircle2 size={12} className="text-primary" />
                                                    : <div className="w-3 h-3 border rounded opacity-30 hover:opacity-60 transition-opacity" />}
                                            </TableHead>
                                            <TableHead className="text-[10px] font-black uppercase h-8 py-0 w-auto text-muted-foreground/70">Student</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase h-8 py-0 w-[70px] text-center text-muted-foreground/70">ID No.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase h-8 py-0 w-[70px] text-center text-muted-foreground/70">Course</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase h-8 py-0 w-[70px] text-right pr-4 text-muted-foreground/70">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {state.pendingStudents.length === 0
                                            ? <EmptyState label="No pending applicants" colSpan={5} />
                                            : state.pendingStudents.map(s => (
                                                <PendingRow
                                                    key={s.id}
                                                    student={s}
                                                    isActive={state.previewStudent?.id === s.id && state.previewSection === 'queued'}
                                                    isSelected={state.selectedIds.includes(s.id)}
                                                    onSelect={actions.handleSelect}
                                                    onView={id => { actions.setPreviewingId(id); actions.setPreviewSection('queued'); }}
                                                    courses={Courses} />
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Panel>

                        <HResizeHandle />

                        {/* ── SECTION B: Issued / Printed */}
                        <Panel defaultSize={50} minSize={20} className="flex flex-col overflow-hidden">
                            <div className="px-3 py-2 flex items-center justify-between shrink-0 bg-muted/30 border-b border-border">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Issued / Printed</span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black tabular-nums">
                                    {state.confirmedStudents.length}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                                <Table className="table-fixed w-full">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="pl-4 text-[10px] font-black uppercase h-8 py-0 w-auto text-muted-foreground/70">Student</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase h-8 py-0 w-[70px] text-center text-muted-foreground/70">ID No.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase h-8 py-0 w-[70px] text-center text-muted-foreground/70">Course</TableHead>
                                            <TableHead className="h-8 py-0 w-[80px]" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {state.confirmedStudents.length === 0
                                            ? <EmptyState label="No issued cards yet" icon={Printer} colSpan={4} />
                                            : state.confirmedStudents.map(s => (
                                                <ConfirmedRow
                                                    key={s.id}
                                                    student={s}
                                                    isActive={state.previewStudent?.id === s.id && state.previewSection === 'confirmed'}
                                                    onView={id => { actions.setPreviewingId(id); actions.setPreviewSection('confirmed'); }}
                                                    onPrint={actions.handlePrint}
                                                    onArchive={actions.handleArchive}
                                                    onDelete={actions.handleDelete}
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
                        <Panel defaultSize={155} minSize={40} className="flex flex-col">
                            {state.previewStudent && state.previewCard && state.previewLayout ? (
                                <div className="flex-1 overflow-auto custom-scrollbar flex flex-col items-center justify-center p-8">
                                    <div className="flex items-center justify-center gap-8 mb-8">
                                        <div className="shadow-2xl rounded-sm overflow-hidden ring-1 ring-border shrink-0">
                                            <IDCardPreview data={state.previewCard} layout={state.previewLayout} side="FRONT" scale={state.previewScale} />
                                        </div>
                                        <div className="shadow-2xl rounded-sm overflow-hidden ring-1 ring-border shrink-0">
                                            <IDCardPreview data={state.previewCard} layout={state.previewLayout} side="BACK" scale={state.previewScale} />
                                        </div>
                                    </div>

                                    {/* Comparison Banner */}
                                    <div className="flex items-center gap-6 bg-card/80 backdrop-blur-sm border border-border px-8 py-4 rounded-2xl shadow-xl">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">FULL NAME</span>
                                            <p className="text-2xl font-black uppercase tracking-tight text-primary">
                                                {state.previewCard.manual_full_name || state.previewCard.originalFullName}
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
                        <Panel defaultSize={75} minSize={50} maxSize={70} className="flex flex-col bg-card border-t border-border">
                            {state.previewStudent && state.previewCard && state.previewLayout && (
                                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar px-6 py-4 flex items-center justify-between gap-4 min-h-0">
                                    {/* Zoom */}
                                    <ZoomStrip
                                        scale={state.previewScale}
                                        onOut={() => actions.setPreviewScale(p => Math.max(MIN_ZOOM, +(p - 0.1).toFixed(1)))}
                                        onIn={() => actions.setPreviewScale(p => Math.min(MAX_ZOOM, +(p + 0.1).toFixed(1)))}
                                        onReset={() => actions.setPreviewScale(0.7)}
                                    />

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => actions.handleArchive(state.previewStudent!.id)}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 active:bg-destructive text-destructive-foreground font-black text-[10px] uppercase transition-all shadow-lg shadow-destructive/20"
                                        >
                                            <X size={13} /> Reject
                                        </button>

                                        {state.previewSection === 'queued' && (
                                            <button
                                                onClick={actions.handleConfirmSelected}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase transition-all shadow-lg"
                                            >
                                                <CheckCircle2 size={13} />
                                                {state.selectedIds.length > 1 ? `Confirm (${state.selectedIds.length})` : 'Confirm'}
                                            </button>
                                        )}

                                        {state.previewStudent.payment_proof && (
                                            <button
                                                onClick={() => actions.setViewingPaymentProof(
                                                    state.previewStudent!.payment_proof!.startsWith('http')
                                                        ? state.previewStudent!.payment_proof!
                                                        : `${VITE_API_URL}/storage/${state.previewStudent!.payment_proof}`
                                                )}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted hover:bg-accent border border-border text-foreground font-black text-[10px] uppercase transition-all"
                                            >
                                                <Receipt size={13} /> Payment Proof
                                            </button>
                                        )}

                                        {state.previewSection === 'confirmed' && (
                                            <button
                                                onClick={actions.handlePrintPreview}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary text-primary-foreground font-black text-[10px] uppercase transition-all shadow-lg shadow-primary/20"
                                            >
                                                <Printer size={13} /> Print
                                            </button>
                                        )}
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
                <Panel defaultSize={150} minSize={150} maxSize={350} className="flex flex-col border-l border-border bg-card relative z-10">

                    <div className="px-3 py-3 border-b border-border flex flex-col items-center text-center shrink-0">
                        <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-1.5 shadow">
                            <Database size={15} />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-tight text-foreground">Edit Details</p>
                    </div>

                    {state.previewStudent && state.previewCard ? (
                        <>
                            <div className={cn(
                                'flex items-center justify-between px-3 py-1.5 text-[8px] font-black uppercase tracking-widest transition-all border-b',
                                state.hasOverrides
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                    : 'bg-muted/50 border-border text-muted-foreground'
                            )}>
                                <span>{state.hasOverrides ? '● Overrides' : '○ No changes'}</span>
                                {state.hasOverrides && (
                                    <button onClick={actions.resetOverrides} className="flex items-center gap-0.5 hover:text-red-500 transition-colors">
                                        <RotateCcw size={9} /> Reset
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-hide">

                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-1.5">
                                        <UserIcon size={9} className="text-muted-foreground" />
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Front Side</p>
                                    </div>
                                    <OverrideField label="Full Name" value={state.previewCard.fullName || ''} onChange={v => actions.updateOverride('fullName', v)} />
                                    <OverrideField label="Department" value={state.previewCard.course || ''} onChange={v => actions.updateOverride('course', v)} />
                                    <OverrideField label="ID Number" value={state.previewCard.idNumber || ''} onChange={v => actions.updateOverride('idNumber', v)} />
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block">Photo</span>
                                        <button onClick={() => document.getElementById('photo-input')?.click()}
                                            className="w-full h-14 bg-muted/50 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary transition-all overflow-hidden">
                                            {state.previewCard.photo
                                                ? <img src={state.previewCard.photo} className="w-full h-full object-cover" alt="" />
                                                : <><Camera size={14} className="text-muted-foreground" /><span className="text-[7px] font-black uppercase text-muted-foreground">Upload Photo</span></>
                                            }
                                        </button>
                                        <input id="photo-input" type="file" hidden accept="image/*"
                                            onChange={e => { const f = e.target.files?.[0]; if (f) actions.updateOverride('photo', URL.createObjectURL(f)); }} />
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={9} className="text-muted-foreground" />
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Back Side</p>
                                    </div>
                                    <OverrideField label="Guardian Name" value={state.previewCard.guardian_name || ''} onChange={v => actions.updateOverride('guardian_name', v)} />
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider block">Address</span>
                                        <textarea value={state.previewCard.address || ''} onChange={e => actions.updateOverride('address', e.target.value)}
                                            className="w-full bg-muted/50 border border-border rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-foreground outline-none focus:border-primary transition-colors h-12 resize-none" />
                                    </div>
                                    <OverrideField label="Guardian Contact" value={state.previewCard.guardian_contact || ''} onChange={v => actions.updateOverride('guardian_contact', v)} />
                                    <OverrideField label="Applicant Email" value={state.previewCard.email || ''} onChange={v => actions.updateOverride('email', v)} />
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block">Signature</span>
                                        <button onClick={() => document.getElementById('sig-input')?.click()}
                                            className="w-full h-14 bg-muted/50 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary transition-all overflow-hidden">
                                            {state.previewCard.signature
                                                ? <img src={state.previewCard.signature} className="w-full h-full object-contain p-1.5" alt="" />
                                                : <><RefreshCw size={14} className="text-muted-foreground" /><span className="text-[7px] font-black uppercase text-muted-foreground">Upload Sig.</span></>
                                            }
                                        </button>
                                        <input id="sig-input" type="file" hidden accept="image/*"
                                            onChange={e => { const f = e.target.files?.[0]; if (f) actions.updateOverride('signature', URL.createObjectURL(f)); }} />
                                    </div>

                                    {state.hasOverrides && (
                                        <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <Button 
                                                onClick={actions.handleSaveDetails}
                                                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 border-none rounded-xl flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw size={14} className="animate-spin-slow" />
                                                Save Overrides
                                            </Button>
                                            <button 
                                                onClick={actions.resetOverrides}
                                                className="w-full mt-2 py-2 text-[9px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors"
                                            >
                                                Discard Changes
                                            </button>
                                        </div>
                                    )}
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
            <Dialog open={state.isConfirmModalOpen} onOpenChange={actions.setIsConfirmModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-card border-border p-0 overflow-hidden rounded-2xl shadow-2xl">
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                <CheckCircle2 className="text-primary" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Approve Applicants</h3>
                                <p className="text-xs font-medium text-muted-foreground mt-1">
                                    You are about to move <span className="text-foreground font-bold">{state.idsToConfirm.length}</span> applicant(s) to the issued list.
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
                                onClick={() => actions.setIsConfirmModalOpen(false)}
                                className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all border border-border"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={actions.executeConfirmation}
                                className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/25 border-none"
                            >
                                Confirm & Move
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reject / Archive Modal */}
            <Dialog open={state.isArchiveModalOpen} onOpenChange={actions.setIsArchiveModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-card border-border p-0 overflow-hidden rounded-2xl shadow-2xl">
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0 border border-destructive/20">
                                <AlertCircle className="text-destructive" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Archive Applicants</h3>
                                <p className="text-xs font-medium text-muted-foreground mt-1">
                                    You are about to archive <span className="text-foreground font-bold">{state.idsToArchive.length}</span> applicant(s).
                                </p>
                            </div>
                        </div>

                        <div className="bg-muted/50 rounded-xl p-4 border border-border mb-6">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                Archiving these applicants will remove them from the active queue and move them to the Archive directory. They can be restored from the Archive page if needed.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => actions.setIsArchiveModalOpen(false)}
                                className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all border border-border"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={actions.executeArchive}
                                className="flex-1 h-11 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-destructive/25 border-none"
                            >
                                Confirm & Archive
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CardManagementPage;
