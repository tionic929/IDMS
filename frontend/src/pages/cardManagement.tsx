import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Search, Trash2, Printer, RefreshCw, CheckCircle2,
    Database, CheckSquare, Square, MapPin, Phone,
    User as UserIcon, Ban,
    CreditCard
} from 'lucide-react';

import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/api/axios';
import { getStudents } from '@/api/students';

// Types
import type { Students } from '@/types/students';
import { type ApplicantCard } from '@/types/card';

// Icons & Components
import { BsPersonFill } from 'react-icons/bs';

import IDCardPreview from '@/components/IDCardPreview';
import CardManagementSkeleton from '@/components/Skeletons/CardManagementSkeleton';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";


// Lazy Load Heavy Components to reduce initial bundle size
const PrintPreviewModal = lazy(() => import('@/components/PrintPreviewModal'));

const VITE_API_URL = import.meta.env.VITE_API_URL;
type SortKey = 'created_at' | 'id_number' | 'first_name' | 'last_name';

// Memoized Table Row to prevent "Tunnel Lag" and entire table re-renders
const StudentRow = React.memo(({
    student,
    isActive,
    isSelected,
    onSelect,
    onView,
    courses
}: {
    student: Students,
    isActive: boolean,
    isSelected: boolean,
    onSelect: (id: number) => void,
    onView: (id: number) => void,
    courses: any
}) => {
    return (
        <TableRow
            onClick={() => onView(student.id)}
            className={cn(
                "group cursor-pointer",
                isActive && "bg-primary/5 hover:bg-primary/10"
            )}
        >
            <TableCell className="pl-6" onClick={(e) => {
                e.stopPropagation();
                onSelect(student.id);
            }}>
                {isSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="opacity-20 group-hover:opacity-40" />}
            </TableCell>
            <TableCell>
                <span className="text-[11px] font-black uppercase text-foreground">{student.last_name}, {student.first_name}</span>
            </TableCell>
            <TableCell className="font-mono text-[10px] font-bold text-muted-foreground">
                {student.id_number}
            </TableCell>
            <TableCell>
                <span className={cn(
                    "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                    courses[student.course]?.border || 'border-border',
                    courses[student.course]?.color || 'text-muted-foreground'
                )}>
                    {student.course}
                </span>
            </TableCell>
            <TableCell>
                {student.has_card ?
                    <div className="text-emerald-500 flex items-center gap-1.5 text-[9px] font-black uppercase">
                        <CheckCircle2 size={12} />
                        Printed
                    </div> :
                    <div className="text-amber-500 flex items-center gap-1.5 text-[9px] font-black uppercase">
                        <RefreshCw size={12} className="animate-spin" />
                        In Queue
                    </div>
                }
            </TableCell>
            <TableCell className="text-right pr-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); }}
                >
                    <Trash2 size={14} />
                </Button>
            </TableCell>
        </TableRow>
    );
});

import { useStudents } from '@/context/StudentContext';
import { useTemplates } from '@/context/TemplateContext';

const Dashboard: React.FC = () => {

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [selectedViewingId, setSelectedViewingId] = useState<number | null>(null);
    const [printData, setPrintData] = useState<{ student: ApplicantCard, layout: any } | null>(null);

    const { allStudents, loading: studentsLoading, refreshStudents: refetchStudents } = useStudents();


    const { templates: allTemplates, loading: templatesLoading } = useTemplates();


    const Courses = useMemo(() => ({
        'BSGE': { name: 'BSGE', color: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50' },
        'BSN': { name: 'BSN', color: 'text-pink-500', border: 'border-pink-200', bg: 'bg-pink-50' },
        'BSIT': { name: 'BSIT', color: 'text-cyan-600', border: 'border-cyan-200', bg: 'bg-cyan-50' },
        'BSBA': { name: 'BSBA', color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' },
        'BSCRIM': { name: 'BSCRIM', color: 'text-zinc-700', border: 'border-zinc-200', bg: 'bg-zinc-100' },
    }), []);

    const activeStudent = useMemo(() => {
        if (selectedViewingId) {
            return allStudents.find((s: Students) => s.id === selectedViewingId) || null;
        }
        return allStudents.find((s: Students) => !s.has_card) || allStudents[0] || null;
    }, [allStudents, selectedViewingId]);

    const currentAutoLayout = useMemo(() => {
        if (!activeStudent || allTemplates.length === 0) return null;
        const matched = allTemplates.find(
            (t: any) => t.name.trim().toUpperCase() === activeStudent.course.trim().toUpperCase()
        );
        const templateToUse = matched || allTemplates.find((t: any) => t.is_active) || allTemplates[0];
        return {
            front: templateToUse.front_config,
            back: templateToUse.back_config,
            previewImages: templateToUse.preview_images || { front: '', back: '' }
        };
    }, [activeStudent, allTemplates]);

    const previewData = useMemo((): ApplicantCard | null => {
        if (!activeStudent) return null;
        const getUrl = (path: string | null) =>
            !path ? '' : (path.startsWith('http') ? path : `${VITE_API_URL}/storage/${path}`);

        return {
            id: activeStudent.id,
            fullName: `${activeStudent.first_name} ${activeStudent.last_name}`,
            idNumber: activeStudent.id_number,
            course: activeStudent.course,
            photo: getUrl(activeStudent.id_picture),
            signature: getUrl(activeStudent.signature_picture),
            guardian_name: activeStudent.guardian_name,
            guardian_contact: activeStudent.guardian_contact,
            address: activeStudent.address
        };
    }, [activeStudent]);

    const filteredStudents = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        return allStudents
            .filter((s: Students) => {
                if (!query) return true;
                return s.id_number.toLowerCase().includes(query) ||
                    `${s.first_name} ${s.last_name}`.toLowerCase().includes(query) ||
                    s.course.toLowerCase().includes(query);
            })
            .sort((a: Students, b: Students) => {
                let aVal = sortBy === 'created_at' ? new Date(a.created_at).getTime() : a[sortBy];
                let bVal = sortBy === 'created_at' ? new Date(b.created_at).getTime() : b[sortBy];
                return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });
    }, [allStudents, searchTerm, sortBy, sortOrder]);

    const handleSelectRow = useCallback((id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }, []);

    const handleViewStudent = useCallback((id: number) => {
        setSelectedViewingId(id);
    }, []);

    const handleExport = async (studentId: number) => {
        if (currentAutoLayout && previewData) {
            setPrintData({ student: previewData, layout: currentAutoLayout });
        }
    };

    if (studentsLoading || templatesLoading) return <CardManagementSkeleton />;

    return (
        <div className="h-full bg-zinc-50 dark:bg-[#020617] text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden">
            <Suspense fallback={<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"><RefreshCw className="animate-spin text-white" size={48} /></div>}>
                <AnimatePresence>
                    {printData && (
                        <PrintPreviewModal
                            data={printData.student}
                            layout={printData.layout}
                            onClose={() => setPrintData(null)}
                        />
                    )}
                </AnimatePresence>
            </Suspense>

            <main className="flex-1 flex overflow-hidden">
                <aside className="bg-white dark:bg-zinc-950 flex flex-col border-r border-zinc-200 dark:border-zinc-900 shadow-2xl shrink-0">
                    {activeStudent && previewData && currentAutoLayout ? (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-5 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-900">
                                <div className="flex flex-row gap-4 items-center justify-center">
                                    <IDCardPreview data={previewData} layout={currentAutoLayout} side="FRONT" scale={0.9} />
                                    <IDCardPreview data={previewData} layout={currentAutoLayout} side="BACK" scale={0.9} />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase flex items-center gap-2">
                                        <BsPersonFill className="text-teal-500" /> {activeStudent.last_name}, {activeStudent.first_name}
                                    </h2>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="flex items-center gap-2 text-lg font-bold text-zinc-500"><CreditCard size={20} /> {activeStudent.id_number}</span>
                                        <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase">{activeStudent.course}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 border border-zinc-100 dark:border-zinc-900 rounded-2xl p-4 bg-zinc-50/30 dark:bg-zinc-900/20">
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Detailed Record Info</span>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1"><UserIcon size={10} /> Guardian</span>
                                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{activeStudent.guardian_name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1"><Phone size={10} /> Contact</span>
                                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{activeStudent.guardian_contact}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900">
                                        <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1"><MapPin size={10} /> Residential Address</span>
                                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{activeStudent.address}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-2 gap-3">
                                <button className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-black text-[11px] uppercase transition-all">
                                    <Ban size={14} /> Reject Entry
                                </button>
                                <button onClick={() => handleExport(activeStudent.id)} className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-black text-[11px] uppercase transition-all shadow-lg shadow-teal-500/20">
                                    <Printer size={14} /> Confirm & Print
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <Database size={40} className="text-zinc-200 dark:text-zinc-800 mb-4" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Queue Empty</h3>
                        </div>
                    )}
                </aside>

                <section className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#020617]">
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                            <input
                                type="text"
                                placeholder="Filter directory by name, ID or course..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-[11px] font-bold"
                            />
                        </div>
                        <button onClick={() => refetchStudents()} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors">
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-950">
                                <tr className="text-zinc-400 text-[9px] font-black uppercase tracking-widest">
                                    <th className="w-12 pl-6 py-4">
                                        <button
                                            className="text-indigo-600"
                                            onClick={() => setSelectedIds(selectedIds.length === filteredStudents.length ? [] : filteredStudents.map((s: Students) => s.id))}
                                        >
                                            {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? <CheckSquare size={16} className="text-teal-500" /> : <Square size={16} />}
                                        </button>
                                    </th>
                                    <th className="px-4 py-4">Identity</th>
                                    <th className="px-4 py-4">ID Number</th>
                                    <th className="px-4 py-4">Course</th>
                                    <th className="px-4 py-4">Status</th>
                                    <th className="px-4 py-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                                {filteredStudents.map((student: Students) => (
                                    <StudentRow
                                        key={student.id}
                                        student={student}
                                        isActive={activeStudent?.id === student.id}
                                        isSelected={selectedIds.includes(student.id)}
                                        onSelect={handleSelectRow}
                                        onView={handleViewStudent}
                                        courses={Courses}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
