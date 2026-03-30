import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useStudents } from '@/context/StudentContext';
import { useTemplates } from '@/context/TemplateContext';
import { archiveApplicant, deleteApplicant, confirmApplicant } from '@/api/students';
import type { Students } from '@/types/students';
import { type ApplicantCard } from '@/types/card';
import { toCard } from '../utils';

export const useCardManagement = () => {
    const { allStudents, loading: studentsLoading, refreshStudents: refetch, updateStudentLocal } = useStudents();
    const { templates: allTemplates, loading: templatesLoading } = useTemplates();
    const [searchParams] = useSearchParams();

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
    
    const updateOverride = useCallback((key: string, value: any) => {
        setOverrides((p: any) => ({ ...p, [key]: value }));
        setHasOverrides(true);
    }, []);
    
    const resetOverrides = useCallback(() => { 
        setOverrides({}); 
        setHasOverrides(false); 
    }, []);

    // Auto-cleanup optimistic state when server reflects changes
    useEffect(() => {
        setLocalArchivedIds(prev => {
            if (prev.size === 0) return prev;
            const next = new Set(prev);
            allStudents.forEach((s: Students) => { if (s.is_archived) next.delete(s.id); });
            return next.size === prev.size ? prev : next;
        });
    }, [allStudents]);

    // ── URL auto-select
    useEffect(() => {
        const sel = searchParams.get('select');
        if (sel && allStudents.length > 0) {
            const found = allStudents.find((s: Students) => s.id_number === sel);
            if (found) { 
                setPreviewingId(found.id); 
                setPreviewSection(found.has_card ? 'confirmed' : 'queued'); 
            }
        }
    }, [searchParams, allStudents]);

    // ── derived lists
    const effectiveStudents: Students[] = useMemo(() =>
        allStudents
            .filter((s: Students) => !s.is_archived && !localArchivedIds.has(s.id) && !localDeletedIds.has(s.id)),
        [allStudents, localArchivedIds, localDeletedIds]
    );

    const pendingStudents = useMemo(() => effectiveStudents.filter(s => !s.has_card), [effectiveStudents]);
    const confirmedStudents = useMemo(() => effectiveStudents.filter(s => s.has_card), [effectiveStudents]);

    // ── layout resolver
    const getLayout = useCallback((student: Students | null) => {
        if (!student || allTemplates.length === 0) return null;
        const studentCourse = student.course.trim().toUpperCase();
        const matched = allTemplates.find((t: any) => t.name.trim().toUpperCase() === studentCourse);
        const tpl = matched || allTemplates.find((t: any) => t.is_active) || allTemplates[0];
        return { front: tpl.front_config, back: tpl.back_config, previewImages: tpl.preview_images || { front: '', back: '' } };
    }, [allTemplates]);

    // ── active preview student
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

    // Reset overrides & revoke old object URLs when switching student
    useEffect(() => {
        return () => {
            if (overrides.photo?.startsWith('blob:')) URL.revokeObjectURL(overrides.photo);
            if (overrides.signature?.startsWith('blob:')) URL.revokeObjectURL(overrides.signature);
        };
    }, [previewingId, overrides.photo, overrides.signature]);
    
    useEffect(() => { resetOverrides(); }, [previewingId, resetOverrides]);

    const allPendingIds = pendingStudents.map(s => s.id);
    const allSelected = allPendingIds.length > 0 && allPendingIds.every(id => selectedIds.includes(id));
    const someSelected = selectedIds.length > 0;
    
    const toggleSelectAll = useCallback(() => setSelectedIds(allSelected ? [] : allPendingIds), [allSelected, allPendingIds]);
    const handleSelect = useCallback((id: number) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]), []);

    const handleConfirmSelected = useCallback(() => {
        const ids = selectedIds.length > 0
            ? selectedIds.filter(id => pendingStudents.some(s => s.id === id))
            : previewStudent ? [previewStudent.id] : [];

        if (ids.length === 0) {
            toast.info('No applicants selected');
            return;
        }

        setIdsToConfirm(ids);
        setIsConfirmModalOpen(true);
    }, [selectedIds, pendingStudents, previewStudent]);

    const executeConfirmation = useCallback(async () => {
        setIsConfirmModalOpen(false);
        const finalIds = idsToConfirm;
        if (finalIds.length === 0) return;

        finalIds.forEach((id: number) => updateStudentLocal(id, { has_card: true }));
        setSelectedIds([]);

        setPreviewSection('confirmed');
        setPreviewingId(finalIds[0]);

        const results = await Promise.allSettled(finalIds.map((id: number) => confirmApplicant(id)));
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
            toast.error(`${failed} confirmation(s) failed — refreshing`);
            refetch();
        } else {
            toast.success(`${finalIds.length} applicant(s) confirmed`);
        }
    }, [idsToConfirm, updateStudentLocal, refetch]);

    const handleArchive = useCallback(async (id: number) => {
        if (!window.confirm('Archive this applicant?')) return;
        setLocalArchivedIds(prev => new Set([...prev, id]));
        if (previewingId === id) setPreviewingId(null);
        try { await archiveApplicant(id); toast.success('Archived'); }
        catch { setLocalArchivedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); toast.error('Failed to archive'); }
    }, [previewingId]);

    const handleArchiveSelected = useCallback(async () => {
        const ids = selectedIds.filter(id => pendingStudents.some(s => s.id === id));
        if (ids.length === 0) return;
        if (!window.confirm(`Archive ${ids.length} selected applicant(s)?`)) return;

        ids.forEach(id => setLocalArchivedIds(prev => new Set([...prev, id])));
        setSelectedIds([]);
        if (previewingId && ids.includes(previewingId)) setPreviewingId(null);

        const results = await Promise.allSettled(ids.map(id => archiveApplicant(id)));
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
            toast.error(`${failed} archive(s) failed — refreshing`);
            refetch();
        } else {
            toast.success(`${ids.length} applicant(s) archived`);
        }
    }, [selectedIds, pendingStudents, previewingId, refetch]);

    const handleDelete = useCallback(async (id: number) => {
        if (!window.confirm('Permanently delete this applicant?')) return;
        setLocalDeletedIds(prev => new Set([...prev, id]));
        if (previewingId === id) setPreviewingId(null);
        try { await deleteApplicant(id); toast.success('Deleted'); }
        catch { setLocalDeletedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); toast.error('Failed to delete'); }
    }, [previewingId]);

    const handlePrint = useCallback((s: Students) => {
        const layout = getLayout(s);
        if (layout) setPrintData({ student: toCard(s), layout });
    }, [getLayout]);

    const handlePrintPreview = useCallback(() => {
        if (previewStudent && previewCard && previewLayout)
            setPrintData({ student: previewCard, layout: previewLayout });
    }, [previewStudent, previewCard, previewLayout]);

    return {
        state: {
            studentsLoading,
            templatesLoading,
            effectiveStudents,
            pendingStudents,
            confirmedStudents,
            previewStudent,
            previewCard,
            previewLayout,
            previewScale,
            printData,
            viewingPaymentProof,
            isConfirmModalOpen,
            idsToConfirm,
            overrides,
            hasOverrides,
            selectedIds,
            previewingId,
            previewSection,
            allSelected,
            someSelected
        },
        actions: {
            setPreviewScale,
            setPrintData,
            setViewingPaymentProof,
            setIsConfirmModalOpen,
            setPreviewingId,
            setPreviewSection,
            updateOverride,
            resetOverrides,
            toggleSelectAll,
            handleSelect,
            handleConfirmSelected,
            executeConfirmation,
            handleArchive,
            handleArchiveSelected,
            handleDelete,
            handlePrint,
            handlePrintPreview
        }
    };
};
