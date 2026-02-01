import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { echo } from '../echo';
import { 
  Users, Search, Edit3, Trash2, ChevronUp, ChevronDown, 
  Layout, Printer, RefreshCw, CheckCircle2,
  XIcon, Camera, Database, Filter, CheckSquare, Square
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
import DesignerWorkspace from '../components/DesignerWorkspace';

const VITE_API_URL = import.meta.env.VITE_API_URL;
type SortKey = 'created_at' | 'id_number' | 'first_name' | 'last_name';

const Dashboard: React.FC = () => {
  const [printData, setPrintData] = useState<{ student: ApplicantCard, layout: any} | null>(null);
  const [saveCount, setSaveCount] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'queue' | 'designer'>('queue');
  const [allStudents, setAllStudents] = useState<Students[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Selection Logic States
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedViewingId, setSelectedViewingId] = useState<number | null>(null);

  const Courses: Record<string, {name: string; color: string; border: string}> = {
    'BSGE': { name: 'BSGE', color: 'text-red-600', border: 'border-red-200' },
    'BSN': { name: 'BSN', color: 'text-pink-500', border: 'border-pink-200' },
    'BSIT': { name: 'BSIT', color: 'text-cyan-600', border: 'border-cyan-200' },
    'BSBA': { name: 'BSBA', color: 'text-amber-600', border: 'border-amber-200' },
    'BSCRIM': { name: 'BSCRIM', color: 'text-slate-700', border: 'border-slate-200' },
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
    const channel = echo.channel('dashboard')
      .listen('.new-submission', (data: { student: Students }) => {
        setAllStudents((prev) => {
          if (prev.find(s => s.id === data.student.id)) return prev;
          return [data.student, ...prev];
        });
        toast.success(`New Entry: ${data.student.id_number}`);
      });

    return () => { channel.stopListening('.new-submission'); };
  }, [saveCount, fetchInitialData]);

  // Selection Handlers
  const toggleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleRowClick = (id: number) => {
    setSelectedViewingId(id);
  };

  // Logic: Priority given to manually selected record, then first item in queue
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
        setAllStudents(prev => prev.map(s => s.id === studentId ? { ...s, has_card: true } : s));
        const printUrl = (path: string | null) =>
          !path ? '' : (path.startsWith('http') ? path : `${VITE_API_URL}/storage/${path}`);

        setPrintData({
          student: {
            ...previewData,
            photo: printUrl(targetStudent.id_picture),
            signature: printUrl(targetStudent.signature_picture),
          },
          layout: currentAutoLayout
        });
      }
    } catch (error) {
      toast.error("Process Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (studentId: number) => {
    if (!window.confirm("Delete this record permanently?")) return;
    try {
      await api.delete(`/students/${studentId}`);
      setAllStudents(prev => prev.filter(s => s.id !== studentId));
      if (selectedViewingId === studentId) setSelectedViewingId(null);
      toast.info("Record removed");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const SortHeader = React.memo(({ label, active, order, onClick }: any) => (
    <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors group" onClick={onClick}>
      <div className="flex items-center gap-2">
        {label}
        <div className="flex flex-col text-[8px] leading-[0.5] opacity-50">
          <ChevronUp size={10} className={active && order === 'asc' ? 'text-teal-500' : ''} />
          <ChevronDown size={10} className={active && order === 'desc' ? 'text-teal-500' : ''} />
        </div>
      </div>
    </th>
  ));

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b px-6 py-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 z-20">
        <div className="flex items-center gap-6">
           <h1 className="text-xl font-black uppercase tracking-tighter">ID <span className="text-teal-500">Manager</span></h1>
           <nav className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg">
              <button onClick={() => setViewMode('queue')} className={`px-4 py-1 rounded-md text-[10px] font-black uppercase transition-all ${viewMode === 'queue' ? 'bg-white dark:bg-zinc-800 text-teal-500 shadow-sm' : 'text-slate-400'}`}>Queue</button>
              <button onClick={() => setViewMode('designer')} className={`px-4 py-1 rounded-md text-[10px] font-black uppercase transition-all ${viewMode === 'designer' ? 'bg-white dark:bg-zinc-800 text-teal-500 shadow-sm' : 'text-slate-400'}`}>Designer</button>
           </nav>
        </div>
        <div className="flex items-center gap-4">
          {selectedIds.length > 0 && (
            <motion.button 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 px-4 py-1.5 bg-teal-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
            >
                <Printer size={12} /> Print Batch ({selectedIds.length})
            </motion.button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {printData && (
            <PrintPreviewModal 
                data={printData.student}
                layout={printData.layout}
                onClose={() => setPrintData(null)}
            />
          )}

          {viewMode === 'designer' ? (
            <motion.div key="designer" className="w-full h-full">
                <DesignerWorkspace 
                  selectedTemplate={selectedTemplate}
                  setSelectedTemplate={setSelectedTemplate}
                  saveCount={saveCount}
                  setSaveCount={setSaveCount}
                  allStudents={allStudents}
                />
            </motion.div>
          ) : (
            <div className="flex w-full h-full overflow-hidden">
                
                {/* LEFT SIDE: PREVIEW PANEL */}
                <div className=" bg-slate-50 dark:bg-zinc-950 flex flex-col border-r border-slate-200 dark:border-zinc-900 shadow-2xl shrink-0">
                    {activeStudent && previewData && currentAutoLayout ? (
                        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
                            
                            <div className="p-6 bg-white dark:bg-zinc-900/30 border-b border-slate-200 dark:border-zinc-900">
                                <div className="flex gap-6 items-center">
                                    <IDCardPreview data={previewData} layout={currentAutoLayout} side="FRONT" scale={0.8} />
                                    <IDCardPreview data={previewData} layout={currentAutoLayout} side="BACK" scale={0.8}/>
                                </div>
                            </div>

                          <div className="flex-1 w-full bg-white dark:bg-zinc-950 flex flex-col">
                            <div className="p-6 border-b border-slate-50 dark:border-slate-800/50">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                                  {activeStudent.last_name}, {activeStudent.first_name}
                                </h2>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm font-mono font-bold text-teal-500">
                                      {activeStudent.id_number}
                                    </span>
                                    <p className={`text-xs font-black uppercase tracking-widest ${
                                      Courses[activeStudent.course as keyof typeof Courses]?.color || 'text-slate-400'
                                    }`}>
                                      {activeStudent.course}
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 space-y-6 flex-1">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Emergency Contact</p>
                                  <p className="text-xs font-bold">{activeStudent.guardian_name}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact No.</p>
                                  <p className="text-xs font-bold">{activeStudent.guardian_contact}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{activeStudent.address}</p>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800">
                              <button 
                                onClick={() => handleExport(activeStudent.id)} 
                                disabled={loading}
                                className="w-full py-3.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-black text-[11px] uppercase transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                              >
                                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Printer size={14} />}
                                {loading ? 'Processing...' : 'Confirm and Print Record'}
                              </button>
                            </div>
                          </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                            <Database size={40} className="mb-4 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Select a record to preview card</p>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDE: DATA GRID */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#020617]">
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
                        <div className="flex items-center gap-2">
                            <button onClick={fetchInitialData} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg"><RefreshCw size={14} /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-zinc-950">
                                <tr className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                    <th className="w-12 pl-6 py-4">
                                        <button onClick={toggleSelectAll}>
                                            {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? <CheckSquare size={16} className="text-teal-500" /> : <Square size={16} />}
                                        </button>
                                    </th>
                                    <SortHeader label="Identity" active={sortBy === 'first_name'} order={sortOrder} onClick={() => toggleSort('first_name')} />
                                    <SortHeader label="ID Number" active={sortBy === 'id_number'} order={sortOrder} onClick={() => toggleSort('id_number')} />
                                    <th className="px-4 py-4">Course</th>
                                    <th className="px-4 py-4">Status</th>
                                    <th className="px-4 py-4 text-right pr-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                                {filteredStudents.map(student => (
                                    <tr 
                                        key={student.id} 
                                        onClick={() => handleRowClick(student.id)}
                                        className={`group hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer ${activeStudent?.id === student.id ? 'bg-teal-50/50 dark:bg-teal-500/5' : ''}`}
                                    >
                                        <td className="pl-6 py-3" onClick={(e) => toggleSelect(e, student.id)}>
                                            {selectedIds.includes(student.id) ? <CheckSquare size={16} className="text-teal-500" /> : <Square size={16} className="opacity-20 group-hover:opacity-40" />}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black uppercase">{student.last_name}, {student.first_name}</span>
                                            </div>
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
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(student.id); }} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Dashboard;