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
import { confirmApplicant, getStudents } from '../api/students';

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
  const [totalQueueCount, setTotalQueueCount] = useState(0);
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
  
  // NEW: Batch Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const Courses: Record<string, {name: string; color: string; border: string}> = {
    'BSGE': { name: 'BSGE', color: 'text-red-600', border: 'border-red-200' },
    'BSN': { name: 'BSN', color: 'text-pink-500', border: 'border-pink-200' },
    'BSIT': { name: 'BSIT', color: 'text-cyan-600', border: 'border-cyan-200' },
    // ... rest of your courses
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
      setTotalQueueCount(studentRes.totalQueue);
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

  // NEW: Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const queueCount = useMemo(() => 
    allStudents.filter(s => !s.has_card).length, [allStudents]
  );

  // CardExchange Logic: Automatically select the first record in the queue for the preview pane
  const activeStudent = useMemo(() => {
    if (selectedIds.length === 1) {
        return allStudents.find(s => s.id === selectedIds[0]) || null;
    }
    const pending = allStudents.filter(s => !s.has_card);
    return [...pending].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0] || null;
  }, [allStudents, selectedIds]);

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
      if(targetStudent){
        setAllStudents(prev => prev.map(s => s.id === studentId ? { ...s, has_card: true } : s));
        const printUrl = (path: string | null) =>
          !path ? '' : (path.startsWith('http') ? path : `${VITE_API_URL}/storage/${path}`);

        setPrintData({
          student: {
            ...previewData!,
            fullName: `${targetStudent.first_name} ${targetStudent.last_name}`,
            idNumber: targetStudent.id_number,
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
      
      {/* 1. PROFESSIONAL TOOLBAR (CardExchange Style) */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 z-20">
        <div className="flex items-center gap-8">
          <h1 className="text-sm font-black tracking-tighter uppercase flex items-center gap-2">
            <Database size={16} className="text-teal-500" /> 
            Card <span className="text-teal-500">Management</span>
          </h1>
          
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
            <button onClick={() => setViewMode('queue')} className={`flex items-center gap-2 px-3 py-1 rounded md text-[10px] font-bold uppercase transition-all ${viewMode === 'queue' ? 'bg-white dark:bg-zinc-800 text-teal-500 shadow-sm' : 'text-slate-500'}`}>
              <Users size={12} /> Home
            </button>
            <button onClick={() => setViewMode('designer')} className={`flex items-center gap-2 px-3 py-1 rounded md text-[10px] font-bold uppercase transition-all ${viewMode === 'designer' ? 'bg-white dark:bg-zinc-800 text-teal-500 shadow-sm' : 'text-slate-500'}`}>
              <Layout size={12} /> Designer
            </button>
          </div>
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
                
                {/* 2. LEFT: DATA GRID (Condensed for high-volume) */}
                <div className=" bg-slate-50 dark:bg-zinc-950 flex flex-col border-l border-slate-200 dark:border-zinc-900 shadow-2xl">
                    {activeStudent && previewData && currentAutoLayout ? (
                        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
                            
                            {/* Visual Preview Section */}
                            <div className="p-6 bg-white dark:bg-zinc-900/30 border-b border-slate-200 dark:border-zinc-900">
                                <div className="flex flex-row gap-6 items-center">
                                        <IDCardPreview data={previewData} layout={currentAutoLayout} side="FRONT" scale={0.8} />
                                        <IDCardPreview data={previewData} layout={currentAutoLayout} side="BACK" scale={0.8}/>
                                </div>
                            </div>

                            {/* Record Info Section */}
                          <div className="flex-1 w-full bg-white overflow-hidden shadow-sm border-slate-200 dark:bg-zinc-950 flex flex-col rounded-xl">
                          <div className="p-2 border-b px-6 border-slate-50 dark:border-slate-800/50">
                            <div>
                              <h2 className="flex justify-between text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                                <span>{activeStudent.id_number}</span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                                  Entry Received: {new Date(activeStudent.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </h2>
                              <div className="flex justify-between items-center">
                                  <span className="text-2xl font-sans font-bold text-indigo-400 dark:text-indigo-300 rounded">
                                    {activeStudent.last_name}, {activeStudent.first_name}
                                  </span>
                                  <p className={`text-2xl font-bold uppercase tracking-normal ${
                                    Courses[activeStudent.course as keyof typeof Courses]?.color || 'text-slate-600 dark:text-slate-400'
                                  }`}>
                                    {Courses[activeStudent.course as keyof typeof Courses]?.name || activeStudent.course}
                                  </p>
                              </div>
                            </div>
                          </div>

                          {/* Metadata Grid */}
                          <div className="p-6 space-y-6 flex-1">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Emergency Contact</p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{activeStudent.guardian_name}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contact No.</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 font-sans">{activeStudent.guardian_contact}</p>
                              </div>
                              <div className="col-span-2 space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Permanent Address</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                  {activeStudent.address}
                                </p>
                              </div>
                            </div>

                            {/* Action Footer */}
                            <div className="flex gap-3 border-t border-slate-50 dark:border-slate-800/50">
                              <button 
                                onClick={() => handleExport(activeStudent.id)} 
                                disabled={loading}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-md font-semibold text-sm transition-all shadow-sm shadow-indigo-200 dark:shadow-none active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {loading ? (
                                  <RefreshCw size={16} className="animate-spin" />
                                ) : (
                                  <XIcon size={16} />
                                )}
                                {loading ? 'Processing...' : 'Reject'}
                              </button>
                              <button 
                                onClick={() => handleExport(activeStudent.id)} 
                                disabled={loading}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-md font-semibold text-sm transition-all shadow-sm shadow-indigo-200 dark:shadow-none active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {loading ? (
                                  <RefreshCw size={16} className="animate-spin" />
                                ) : (
                                  <Printer size={16} />
                                )}
                                {loading ? 'Processing...' : 'Preview'}
                              </button>
                            </div>
                          </div>
                        </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                            <Database size={40} className="mb-4 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Select a record from the database to view card properties</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-zinc-900 overflow-hidden bg-white dark:bg-[#020617]">
                    <div className="p-3 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="text"
                                placeholder="Filter records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-lg outline-none text-[11px] font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg"><Filter size={14} /></button>
                            <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg"><RefreshCw size={14} /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-zinc-950">
                                <tr className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-200">
                                    <th className="w-10 pl-4 py-3">
                                        <button onClick={toggleSelectAll}>
                                            {selectedIds.length === filteredStudents.length ? <CheckSquare size={14} className="text-teal-500" /> : <Square size={14} />}
                                        </button>
                                    </th>
                                    <SortHeader label="Identity" active={sortBy === 'first_name'} order={sortOrder} onClick={() => toggleSort('first_name')} />
                                    <SortHeader label="ID Number" active={sortBy === 'id_number'} order={sortOrder} onClick={() => toggleSort('id_number')} />
                                    <th className="px-4 py-3">Course</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Edit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                                {filteredStudents.map(student => (
                                    <tr 
                                        key={student.id} 
                                        onClick={() => toggleSelect(student.id)}
                                        className={`hover:bg-teal-50/30 dark:hover:bg-teal-500/5 transition-colors cursor-pointer ${selectedIds.includes(student.id) ? 'bg-teal-50/50 dark:bg-teal-500/10' : ''}`}
                                    >
                                        <td className="pl-4 py-2">
                                            {selectedIds.includes(student.id) ? <CheckSquare size={14} className="text-teal-500" /> : <Square size={14} className="opacity-20" />}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-[9px] font-black">
                                                    {student.first_name[0]}{student.last_name[0]}
                                                </div>
                                                <span className="text-[11px] font-bold uppercase truncate max-w-[120px]">
                                                    {student.last_name}, {student.first_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 font-mono text-[10px] font-black text-slate-500">
                                            {student.id_number}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${Courses[student.course]?.border || 'border-slate-200'} ${Courses[student.course]?.color || 'text-slate-400'}`}>
                                                {student.course}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {student.has_card ? 
                                                <div className="text-emerald-500 flex items-center gap-1 text-[9px] font-black uppercase"><CheckCircle2 size={10} /> Printed</div> : 
                                                <div className="text-amber-500 flex items-center gap-1 text-[9px] font-black uppercase"><RefreshCw size={10} className="animate-spin-slow" /> Pending</div>
                                            }
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <button className="p-1.5 text-slate-300 hover:text-teal-500 transition-colors"><Edit3 size={12} /></button>
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