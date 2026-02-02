import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { echo } from '../echo';
import { 
  Users, Search, Edit3, Trash2, ChevronUp, ChevronDown, 
  Layout, Printer, RefreshCw, CheckCircle2,
  XIcon, Camera, Database, Filter, CheckSquare, Square,
  MapPin, Phone, User as UserIcon, GraduationCap, ShieldAlert,
  CalendarDays, Mail, Ban,
  School2Icon,
  CardSimIcon
} from 'lucide-react';

import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { getStudents } from '../api/students';

// Types
import type { Students } from '../types/students';
import { type ApplicantCard } from '../types/card';

// Components
import PrintPreviewModal from '../components/PrintPreviewModal';
import IDCardPreview from '../components/IDCardPreview';
import { BsPersonFill } from 'react-icons/bs';
import { AiOutlineNumber } from 'react-icons/ai';

// Skeletons
import CardManagementSkeleton from '../components/skeletons/CardManagementSkeleton';

const VITE_API_URL = import.meta.env.VITE_API_URL;
type SortKey = 'created_at' | 'id_number' | 'first_name' | 'last_name';

const Dashboard: React.FC = () => {
  const [printData, setPrintData] = useState<{ student: ApplicantCard, layout: any} | null>(null);
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<Students[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedViewingId, setSelectedViewingId] = useState<number | null>(null);

  const Courses: Record<string, {name: string; color: string; border: string; bg: string}> = {
    'BSGE': { name: 'BSGE', color: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50' },
    'BSN': { name: 'BSN', color: 'text-pink-500', border: 'border-pink-200', bg: 'bg-pink-50' },
    'BSIT': { name: 'BSIT', color: 'text-cyan-600', border: 'border-cyan-200', bg: 'bg-cyan-50' },
    'BSBA': { name: 'BSBA', color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' },
    'BSCRIM': { name: 'BSCRIM', color: 'text-slate-700', border: 'border-slate-200', bg: 'bg-slate-100' },
  };

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentRes, templateRes] = await Promise.all([
        getStudents(),
        api.get('/card-layouts')
      ]);
      const combined = [ ...(studentRes.queueList || []), ...(studentRes.history || [])]; 
      setAllStudents(combined);
      setAllTemplates(templateRes.data);
    } catch (error) {
      toast.error("Failed to load records");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, []);

  useEffect(() => {
    fetchInitialData(); 
  }, [fetchInitialData]);

  const activeStudent = useMemo(() => {
    if (selectedViewingId) {
        return allStudents.find(s => s.id === selectedViewingId) || null;
    }
    const pending = allStudents.filter(s => !s.has_card);
    return [...pending].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0] || allStudents[0] || null;
  }, [allStudents, selectedViewingId]);

  const currentAutoLayout = useMemo(() => {
    if (!activeStudent || allTemplates.length === 0) return null;
    const matched = allTemplates.find(
      (t) => t.name.trim().toUpperCase() === activeStudent.course.trim().toUpperCase()
    );
    const templateToUse = matched || allTemplates.find(t => t.is_active) || allTemplates[0];
    return {
      front: templateToUse.front_config,
      back: templateToUse.back_config,
      previewImages: templateToUse.previewImages || { front: '', back: '' }
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
      .filter(s => {
        if (!query) return true;
        const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
        return s.id_number.toLowerCase().includes(query) || 
               fullName.includes(query) || 
               s.course.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        let aVal = sortBy === 'created_at' ? new Date(a.created_at).getTime() : a[sortBy];
        let bVal = sortBy === 'created_at' ? new Date(b.created_at).getTime() : b[sortBy];
        return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
  }, [allStudents, searchTerm, sortBy, sortOrder]);

  const toggleSort = useCallback((key: SortKey) => {
    setSortBy(prev => {
      if (prev === key) {
        setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortOrder('desc');
      return key;
    });
  }, []);

  const handleExport = async (studentId: number) => {
    setLoading(true);
    try {
        const targetStudent = allStudents.find(s => s.id === studentId);
        if(targetStudent && currentAutoLayout && previewData){
            setPrintData({
                student: previewData,
                layout: currentAutoLayout
            });
        }
    } finally {
        setLoading(false);
    }
  };

  const InfoGroup = ({ icon: Icon, label, value, className = "" }: any) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500">
            <Icon size={12} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <p className="text-[12px] font-bold text-slate-700 dark:text-zinc-200 leading-tight truncate">
            {value || 'N/A'}
        </p>
    </div>
  );

  if (loading) {
    return <CardManagementSkeleton />;
  }

  return (
    
    <div className="h-full bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden">
      <AnimatePresence>
        {printData && (
          <PrintPreviewModal 
              data={printData.student}
              layout={printData.layout}
              onClose={() => setPrintData(null)}
          />
        )}
      </AnimatePresence>
      <main className="flex-1 flex overflow-hidden">
        <aside className="bg-white dark:bg-zinc-950 flex flex-col border-r border-slate-200 dark:border-zinc-900 shadow-2xl shrink-0">
          {activeStudent && previewData && currentAutoLayout ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-5 bg-slate-50/50 dark:bg-zinc-900/30 border-b border-slate-200 dark:border-zinc-900">
                <div className="flex flex-col">
                    <div className="flex flex-row gap-4 items-center">
                        <IDCardPreview data={previewData} layout={currentAutoLayout} side="FRONT" scale={1} />
                        <IDCardPreview data={previewData} layout={currentAutoLayout} side="BACK" scale={1}/>
                    </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 space-y-4">
                <div>
                    <div className="flex flex-row justify-between items-center px-6 py-4">
                      <h2 className="flex-1 flex items-center text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                        <BsPersonFill size={30}/>
                        {activeStudent.last_name}, {activeStudent.first_name}
                      </h2>
                        <h2 className="flex items-center text-2xl font-bold text-white uppercase tracking-normal">
                          {activeStudent.course}
                        </h2>
                    </div>
                    <div className="flex justify-between items-center gap- px-6">
                      <span className="flex items-center text-2xl font-black ">
                        <CardSimIcon size={30} />
                        {activeStudent.id_number}
                      </span>
                    </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="space-y-4 border border-zinc-900 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-slate-100 dark:bg-zinc-800"></div>
                        <span className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.3em]">Other Information</span>
                        <div className="h-px flex-1 bg-slate-100 dark:bg-zinc-800"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 shadow-sm">
                            <InfoGroup icon={UserIcon} label="Guardian" value={activeStudent.guardian_name} />
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 shadow-sm">
                            <InfoGroup icon={Phone} label="Contact" value={activeStudent.guardian_contact} />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 shadow-sm">
                        <InfoGroup icon={MapPin} label="Residential Address" value={activeStudent.address} />
                    </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-6 bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-900 grid grid-cols-2 gap-3">
                <button 
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-black text-[11px] uppercase transition-all"
                >
                  <Ban size={14} />
                  Reject Entry
                </button>
                <button 
                  onClick={() => handleExport(activeStudent.id)}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-black text-[11px] uppercase transition-all shadow-lg shadow-teal-500/20"
                >
                  <Printer size={14} />
                  Confirm & Print
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-900 flex items-center justify-center mb-4">
                    <Database size={32} className="text-slate-200 dark:text-zinc-800" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Queue Empty</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium italic">Select a student record to begin technical verification.</p>
            </div>
          )}
        </aside>

        {/* RIGHT SIDE: DATA GRID (UNCHANGED LOGIC, JUST SCROLLING) */}
        <section className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#020617]">
            {/* ... keep your existing table and search filter here ... */}
            <div className="p-4 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                        type="text"
                        placeholder="Filter directory..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-lg outline-none text-[11px] font-bold"
                    />
                </div>
                <button onClick={fetchInitialData} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg"><RefreshCw size={14} /></button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-zinc-950">
                        <tr className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                            <th className="w-12 pl-6 py-4">
                                <button className="text-indigo-600" 
                                  onClick={(e) => {
                                  if (selectedIds.length === filteredStudents.length) setSelectedIds([]);
                                  else setSelectedIds(filteredStudents.map(s => s.id));
                                }}>
                                    {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? <CheckSquare size={16} className="text-teal-500" /> : <Square size={16} />}
                                </button>
                            </th>
                            <th className="px-4 py-4">Identity</th>
                            <th className="px-4 py-4">ID Number</th>
                            <th className="px-4 py-4">Course</th>
                            <th className="px-4 py-4">Status</th>
                            <th className="px-4 py-4 text-right pr-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                        {filteredStudents.map(student => (
                            <tr 
                                key={student.id} 
                                onClick={() => setSelectedViewingId(student.id)}
                                className={`group hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer ${activeStudent?.id === student.id ? 'bg-teal-500/5 dark:bg-teal-500/5' : ''}`}
                            >
                                <td className="pl-6 py-8" onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIds(prev => prev.includes(student.id) ? prev.filter(i => i !== student.id) : [...prev, student.id]);
                                }}>
                                    {selectedIds.includes(student.id) ? <CheckSquare size={16} className="text-teal-500" /> : <Square size={16} className="opacity-20 group-hover:opacity-40" />}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-[11px] font-black uppercase">{student.last_name}, {student.first_name}</span>
                                </td>
                                <td className="px-4 py-3 font-mono text-[10px] font-bold text-slate-400">
                                    {student.id_number}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${Courses[student.course]?.border || 'border-slate-200'} ${Courses[student.course]?.color || 'text-slate-400'}`}>
                                        {student.course}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {student.has_card ? 
                                        <div className="text-emerald-500 flex items-center gap-1 text-[9px] font-black uppercase"><CheckCircle2 size={10} /> Printed</div> : 
                                        <div className="text-amber-500 flex items-center gap-1 text-[9px] font-black uppercase"><RefreshCw size={10} className="animate-spin-slow" /> In Queue</div>
                                    }
                                </td>
                                <td className="px-4 py-3 text-right pr-6">
                                    <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 text-slate-300 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                </td>
                            </tr>
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