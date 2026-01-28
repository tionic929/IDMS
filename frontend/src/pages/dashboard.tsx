import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { echo } from '../echo';
import { 
  Users, Search, Edit3, Trash2, ChevronUp, ChevronDown, 
  Layout, Printer, RefreshCw, CheckCircle2
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

  const Courses: Record<string, {name: string; color: string}> = {
    'BSGE': { name: 'BSGE', color: 'text-red-800' },
    'BSN': { name: 'BSN', color: 'text-pink-400' },
    'BSBA': { name: 'BSBA', color: 'text-amber-400' },
    'BSHM': { name: 'BSHM', color: 'text-amber-400' },
    'BSCRIM': { name: 'BSCRIM', color: 'text-amber-400' },
    'BSIT': { name: 'BSIT', color: 'text-amber-400' },
    'BSED': { name: 'BSED', color: 'text-amber-400' },
    'MIDWIFERY': { name: 'MIDWIFERY', color: 'text-amber-400' },
    'AB': { name: 'AB', color: 'text-amber-400' },
    'JD': { name: 'JD', color: 'text-amber-400' },
    'ABM': { name: 'ABM', color: 'text-amber-400' },
    'ICT': { name: 'ICT', color: 'text-amber-400' },
    'BEC': { name: 'BEC', color: 'text-amber-400' },
    'HUMSS': { name: 'HUMSS', color: 'text-amber-400' },
    'STEM': { name: 'STEM', color: 'text-amber-400' },
    'HE': { name: 'HE', color: 'text-amber-400' },
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
      console.log(studentRes.totalQueue);
    } catch (error) {
      toast.error("Failed to load records");
    } finally {
      setTimeout(() => setLoading(false), 800);
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

  const queueCount = useMemo(() => 
    allStudents.filter(s => !s.has_card).length, [allStudents]
  );

  const latestStudent = useMemo(() => {
    const pending = allStudents.filter(s => !s.has_card);
    return [...pending].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0] || null;
  }, [allStudents]);

  const currentAutoLayout = useMemo(() => {
    if (!latestStudent || allTemplates.length === 0) return null;
    const matched = allTemplates.find(
      (t) => t.name.trim().toUpperCase() === latestStudent.course.trim().toUpperCase()
    );
    const templateToUse = matched || allTemplates.find(t => t.is_active) || allTemplates[0];
    return {
      front: templateToUse.front_config,
      back: templateToUse.back_config,
      previewImages: templateToUse.previewImages || { front: '', back: '' }
    };
  }, [latestStudent, allTemplates]);

  const previewData = useMemo((): ApplicantCard | null => {
    if (!latestStudent) return null;
    const getUrl = (path: string | null) => 
      !path ? '' : (path.startsWith('http') ? path : `${VITE_API_URL}/storage/${path}`);

    return {
      fullName: `${latestStudent.first_name} ${latestStudent.last_name}`,
      idNumber: latestStudent.id_number,
      course: latestStudent.course,
      photo: getUrl(latestStudent.id_picture),
      signature: getUrl(latestStudent.signature_picture),
      guardian_name: latestStudent.guardian_name,
      guardian_contact: latestStudent.guardian_contact,
      address: latestStudent.address
    };
  }, [latestStudent]);

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

        const printPreviewData: ApplicantCard = {
          fullName: `${targetStudent.first_name} ${targetStudent.last_name}`,
          idNumber: targetStudent.id_number,
          course: targetStudent.course,
          photo: printUrl(targetStudent.id_picture),
          signature: printUrl(targetStudent.signature_picture),
          guardian_name: targetStudent.guardian_name,
          guardian_contact: targetStudent.guardian_contact,
          address: targetStudent.address
         };

        setPrintData({
          student: printPreviewData,
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
    <th className="px-10 py-6 cursor-pointer hover:text-teal-500 transition-colors group" onClick={onClick}>
      <div className="flex items-center gap-2">
        {label}
        <div className="flex flex-col text-[8px] leading-[0.5] opacity-50 group-hover:opacity-100">
          <ChevronUp size={10} className={active && order === 'asc' ? 'text-teal-500' : 'text-slate-600'} />
          <ChevronDown size={10} className={active && order === 'desc' ? 'text-teal-500' : 'text-slate-600'} />
        </div>
      </div>
    </th>
  ));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-teal-500/30 overflow-hidden flex flex-col">
      {/* COMPACT INTEGRATED HEADER */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 z-20">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
            Card <span className="text-teal-500">Management</span>
          </h1>
          
          <nav className="flex items-center bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-inner">
            <button 
              onClick={() => setViewMode('queue')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'queue' ? 'bg-white dark:bg-zinc-800 text-teal-500 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Printer size={12} /> Records
            </button>
            <button 
              onClick={() => setViewMode('designer')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'designer' ? 'bg-white dark:bg-zinc-800 text-teal-500 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Layout size={12} /> Designer
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-lg">
            <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Queue: {queueCount}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700"></div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {printData && (
            <PrintPreviewModal 
                data={printData.student}
                layout={printData.layout}
                onClose={() => setPrintData(null)}
            />
          )}

          {viewMode === 'designer' ? (
            <motion.div 
              key="designer" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="h-full"
            >
                <DesignerWorkspace 
                  selectedTemplate={selectedTemplate}
                  setSelectedTemplate={setSelectedTemplate}
                  saveCount={saveCount}
                  setSaveCount={setSaveCount}
                  allStudents={allStudents}
                />
            </motion.div>
          ) : (
            <motion.div 
              key="queue" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start max-w-[1600px] mx-auto">
                  <div className="xl:col-span-4">
                    {latestStudent && previewData && currentAutoLayout ? (
                      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                        <div className="w-full lg:w-fit bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col gap-3">
                          <div className="text-left px-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{latestStudent.course} Template</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4">
                              <IDCardPreview data={previewData} layout={currentAutoLayout} side="FRONT" scale={.7} />
                              <IDCardPreview data={previewData} layout={currentAutoLayout} side="BACK" scale={.7} />
                          </div>
                          <div className="flex-1 w-full bg-white dark:bg-slate-900 overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col rounded-xl">
                          <div className="p-6 border-b border-slate-50 dark:border-slate-800/50">
                            <div className="flex justify-between items-start mb-4">
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                                Entry Received: {new Date(latestStudent.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                Active Queue
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {latestStudent.last_name}, {latestStudent.first_name}
                              </h2>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                                  {latestStudent.id_number}
                                </span>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <p className={`text-sm font-semibold uppercase tracking-wide ${
                                  Courses[latestStudent.course as keyof typeof Courses]?.color || 'text-slate-600 dark:text-slate-400'
                                }`}>
                                  {Courses[latestStudent.course as keyof typeof Courses]?.name || latestStudent.course}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Metadata Grid */}
                          <div className="p-6 space-y-6 flex-1">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Emergency Contact</p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{latestStudent.guardian_name}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contact No.</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 font-sans">{latestStudent.guardian_contact}</p>
                              </div>
                              <div className="col-span-2 space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Permanent Address</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                  {latestStudent.address}
                                </p>
                              </div>
                            </div>

                            {/* Action Footer */}
                            <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50">
                              <button 
                                onClick={() => handleExport(latestStudent.id)} 
                                disabled={loading}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-lg font-semibold text-sm transition-all shadow-sm shadow-indigo-200 dark:shadow-none active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {loading ? (
                                  <RefreshCw size={16} className="animate-spin" />
                                ) : (
                                  <Printer size={16} />
                                )}
                                {loading ? 'Processing...' : 'Confirm & Mark as Printed'}
                              </button>
                              <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
                                This will update the student status and trigger the print preview.
                              </p>
                            </div>
                          </div>
                        </div>
                        </div>

                        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col flex-1">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Directory</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{allStudents.length} Students Logged</p>
                            </div>
                            <div className="relative w-full md:w-80">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input 
                                type="text"
                                placeholder="Search records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none text-xs font-bold transition-all"
                              />
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="text-slate-400 text-[9px] font-black uppercase tracking-widest bg-slate-50/50 dark:bg-zinc-950/50 border-b border-slate-100 dark:border-zinc-800">
                                  <SortHeader label="ID Number" active={sortBy === 'id_number'} order={sortOrder} onClick={() => toggleSort('id_number')} />
                                  <SortHeader label="Full Name" active={sortBy === 'first_name'} order={sortOrder} onClick={() => toggleSort('first_name')} />
                                  <th className="px-10 py-4">Course</th>
                                  <th className="px-10 py-4">Status</th>
                                  <th className="px-10 py-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {filteredStudents.map(student => (
                                  <tr key={student.id} className="hover:bg-teal-500/5 transition-all group">
                                    <td className="px-10 py-5">
                                      <span className="font-bold text-teal-500 font-mono text-xs">{student.id_number}</span>
                                    </td>
                                    <td className="px-10 py-5">
                                      <p className="font-bold text-slate-900 dark:text-slate-200 text-xs uppercase">{student.last_name}, {student.first_name}</p>
                                    </td>
                                    <td className="px-10 py-5">
                                      <span className={`text-[10px] font-black uppercase ${Courses[student.course as keyof typeof Courses]?.color || 'text-slate-400'}`}>
                                          {student.course}
                                      </span>
                                    </td>
                                    <td className="px-10 py-5">
                                      {student.has_card ? (
                                          <div className="flex items-center gap-1.5 text-teal-500 font-black text-[9px] uppercase"><CheckCircle2 size={12} /> Printed</div>
                                      ) : (
                                          <div className="flex items-center gap-1.5 text-amber-500 font-black text-[9px] uppercase"><RefreshCw size={12} className="animate-spin" /> In Queue</div>
                                      )}
                                    </td>
                                    <td className="px-10 py-5 text-right">
                                      <div className="flex justify-end gap-1">
                                          <TableAction icon={<Edit3 size={14} />} color="text-slate-400 hover:text-teal-500" />
                                          <TableAction onClick={() => handleDelete(student.id)} icon={<Trash2 size={14} />} color="text-slate-400 hover:text-red-500" />
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      </div>
                    ) : (
                      <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-[3rem]">
                        <Users size={32} className="text-zinc-700 mb-4" />
                        <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">No Pending Records Found</p>
                      </div>
                    )}
                  </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const TableAction = ({ icon, color, onClick }: any) => (
  <button onClick={onClick} className={`${color} p-2 rounded-lg transition-all hover:bg-slate-100 dark:hover:bg-zinc-800`}>
    {icon}
  </button>
);

export default Dashboard;