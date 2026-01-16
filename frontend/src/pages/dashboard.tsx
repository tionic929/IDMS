import React, { useState, useEffect, useMemo } from 'react';
import { echo } from '../echo';
import { 
  Users, Search, Edit3, Trash2, ChevronUp, ChevronDown, 
  Download, Eye, AlertCircle, Layout, Printer, RefreshCw,
  MoreVertical, CheckCircle2, XCircle
} from 'lucide-react';

import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { getStudents } from '../api/students';

// Types
import type { Students } from '../types/students';
import { type ApplicantCard } from '../types/card';

// Components
import IDCardPreview from '../components/IDCardPreview';
import CardDesigner from '../components/CardDesigner';
import Templates from '../components/Templates';

const VITE_API_URL = import.meta.env.VITE_API_URL;
type SortKey = 'created_at' | 'id_number' | 'name';

const Dashboard: React.FC = () => {
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
  }

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [studentRes, templateRes] = await Promise.all([
        getStudents(),
        api.get('/card-layouts')
      ]);
      const combined = [...(studentRes.queue || []), ...(studentRes.history || [])]; 
      setAllStudents(combined);
      setAllTemplates(templateRes.data);
    } catch (error) {
      toast.error("Failed to fetch records");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

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
  }, [saveCount]);

  const queueCount = useMemo(() => 
    allStudents.filter(s => !s.has_card).length, [allStudents]
  );

  const latestStudent = useMemo(() => {
    const pending = allStudents.filter(s => !s.has_card);
    return [...pending].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0] || null;
  }, [allStudents]);

  // Logic to automatically find the template matching the student's course
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
    let filtered = allStudents.filter(s => {
      const query = searchTerm.toLowerCase();
      const fullName = `${s.first_name} ${s.last_name} ${s.middle_initial || ''}`.toLowerCase();
      return s.id_number.toLowerCase().includes(query) || 
              fullName.includes(query) || 
              s.course.toLowerCase().includes(query);
    });

    return filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === 'created_at') {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else if (sortBy === 'id_number') {
        aVal = a.id_number; bVal = b.id_number;
      } else {
        aVal = `${a.last_name} ${a.first_name}`;
        bVal = `${b.last_name} ${b.first_name}`;
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [allStudents, searchTerm, sortBy, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const handleExport = async (studentId: number) => {
    if (!currentAutoLayout?.previewImages?.front) {
      toast.warn("Please ensure this layout is saved in Designer first.");
      return;
    }
    
    setLoading(true);
    try {
      setAllStudents(prev => prev.map(s => s.id === studentId ? { ...s, has_card: true } : s));
      toast.success("ID Saved to Database");
      setTimeout(() => window.print(), 500);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-teal-500/30">
      <div className="mx-auto p-4 md:p-8 space-y-3">
        
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
              Card <span className="text-teal-500 underline decoration-teal-500/30">Management</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">Institutional ID Printing System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hidden sm:block">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Queue</p>
               <p className="text-xl font-black text-teal-500 leading-none mt-1">{queueCount}</p>
            </div>
            <div className="flex bg-slate-200 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner">
               <button 
                onClick={() => setViewMode('queue')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'queue' ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}
              >
                <Printer size={14} /> Records
              </button>
              <button 
                onClick={() => setViewMode('designer')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'designer' ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}
              >
                <Layout size={14} /> Designer
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {viewMode === 'designer' ? (
            <motion.div key="designer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex gap-6 h-[85vh] p-6">
                  <div className="w-80">
                    <Templates 
                      activeId={selectedTemplate?.id} 
                      onSelect={(t) => setSelectedTemplate(t)} 
                      refreshTrigger={saveCount}
                    />
                  </div>

                  <div className="flex-1">
                    {selectedTemplate ? (
                      <CardDesigner 
                        templateId={selectedTemplate.id}
                        templateName={selectedTemplate.name}
                        currentLayout={{
                          front: { ...selectedTemplate.front_config},
                          back: { ...selectedTemplate.back_config}
                        }}
                        allStudents={allStudents}
                        onSave={(updatedConfig) => {
                          setSelectedTemplate((prev: any) => ({
                            ...prev,
                            front_config: updatedConfig.front,
                            back_config: updatedConfig.back
                          }));
                          setSaveCount(prev => prev + 1);
                        }}
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <Layout size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest">Select a template to edit</p>
                      </div>
                    )}
                  </div>
                </div>
            </motion.div>
          ) : (
            <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                
                  <div className="xl:col-span-4">
                    {latestStudent && previewData && currentAutoLayout ? (
                      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                        
                        <div className="w-full lg:w-fit bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-left gap-6">
                          <div className="text-left">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Auto-Preview ({latestStudent.course} Layout)</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4">
                              <IDCardPreview data={previewData} layout={currentAutoLayout} side="FRONT" scale={.7} />
                              <IDCardPreview data={previewData} layout={currentAutoLayout} side="BACK" scale={.7} />
                          </div>
                          <div className="flex-1 w-[45vh] bg-slate-900 overflow-hidden shadow-2xl border-slate-800 grid grid-cols-1 p-6 rounded-3xl">
                            <div className="justify-between">
                                  <span className="text-slate-700 font-mono text-xs font-bold italic">Timestamp: {new Date(latestStudent.created_at).toLocaleTimeString()}</span>
                                  <h2 className="text-[3rem] font-black text-teal-500 leading-none tracking-tighter italic">{latestStudent.id_number}</h2>
                                  <h2 className="text-4xl font-black text-white uppercase tracking-tight">{latestStudent.last_name}, <span className="text-white">{latestStudent.first_name}</span></h2>
                                  <p className={`text-4xl font-bold uppercase tracking-tight ${
                                    Courses[latestStudent.course as keyof typeof Courses]?.color || 'text-white'
                                  }`}>
                                    {Courses[latestStudent.course as keyof typeof Courses]?.name || latestStudent.course}
                                  </p>
                            </div>
                            <div className="grid grid-cols-2 gap-8 border-t border-slate-800/50 mt-4 pt-4">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emergency Name</p>
                                <p className="text-lg font-black text-white uppercase">{latestStudent.guardian_name}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact No.</p>
                                <p className="text-lg text-white font-sans">{latestStudent.guardian_contact}</p>
                              </div>
                            </div>
                              <div className="grid grid-cols-1 mt-4">
                                <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Address</p>
                                <p className="text-lg text-white font-sans ">{latestStudent.address}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleExport(latestStudent.id)} 
                              disabled={loading}
                              className="w-full mt-6 py-4 bg-teal-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest hover:bg-teal-400 transition-all shadow-xl shadow-teal-500/20 active:scale-95 disabled:opacity-50"
                            >
                              {loading ? 'Processing...' : 'Confirm & Mark as Printed'}
                            </button>

                        </div>
                        </div>

                        <section className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col flex-1">
                          <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50/30 dark:bg-transparent">
                            <div className="space-y-1">
                              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Records <span className="text-teal-500">Directory</span></h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total of {allStudents.length} entries stored</p>
                            </div>
                            <div className="relative w-full md:w-[450px]">
                              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type="text"
                                placeholder="Search by name, ID, or course..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] outline-none text-sm font-bold shadow-sm focus:border-teal-500/50 transition-all"
                              />
                            </div>
                          </div>

                          <div className="overflow-y-auto max-h-[700px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                            <table className="w-full text-left relative">
                              <thead className="sticky top-0 z-10">
                                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                                  <SortHeader label="Student ID" active={sortBy === 'id_number'} order={sortOrder} onClick={() => toggleSort('id_number')} />
                                  <SortHeader label="Full Name" active={sortBy === 'name'} order={sortOrder} onClick={() => toggleSort('name')} />
                                  <th className="px-10 py-6">Course / Dept</th>
                                  <th className="px-10 py-6">Status</th>
                                  <th className="px-10 py-6">Date Added</th>
                                  <th className="px-10 py-6 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredStudents.map(student => (
                                  <tr key={student.id} className="hover:bg-teal-50/30 dark:hover:bg-teal-500/5 transition-all group">
                                    <td className="px-10 py-7">
                                      <span className="font-black text-teal-600 dark:text-teal-400 font-mono text-sm tracking-tighter">
                                          {student.id_number}
                                      </span>
                                    </td>
                                    <td className="px-10 py-7">
                                      <p className="font-bold text-slate-900 dark:text-white text-sm uppercase">{student.last_name}, {student.first_name}</p>
                                    </td>
                                    <td className="px-10 py-7">
                                      <span className={`px-4 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider dark:text-slate-300
                                        ${Courses[student.course as keyof typeof Courses]?.color || 'text-white'}
                                        `}>
                                          {student.course}
                                      </span>
                                    </td>
                                    <td className="px-10 py-7">
                                      {student.has_card ? (
                                          <div className="flex items-center gap-2 text-teal-500 font-black text-[10px] uppercase tracking-widest">
                                              <CheckCircle2 size={14} /> Printed
                                          </div>
                                      ) : (
                                          <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-widest">
                                              <RefreshCw size={14} className="animate-spin-slow" /> Pending
                                          </div>
                                      )}
                                    </td>
                                    <td className="px-10 py-7 text-slate-400 font-bold text-xs uppercase tracking-tighter">
                                      {new Date(student.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-10 py-7 text-right">
                                      <div className="flex justify-end gap-2">
                                          <TableAction icon={<Edit3 size={16} />} color="text-slate-400 hover:text-teal-500 hover:bg-teal-500/10" />
                                          <TableAction onClick={() => handleDelete(student.id)} icon={<Trash2 size={16} />} color="text-slate-400 hover:text-red-500 hover:bg-red-500/10" />
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            
                            {filteredStudents.length === 0 && (
                              <div className="p-20 text-center">
                                  <Search size={40} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No records found matching your criteria</p>
                              </div>
                            )}
                          </div>
                        </section>

                      </div>
                    ) : (
                      <div className="h-[450px] flex flex-col items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50/50 dark:bg-transparent">
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-full shadow-xl mb-6">
                          <Users size={48} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em]">No Pending Applicants or Missing Templates</p>
                      </div>
                    )}
                  </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const SortHeader = ({ label, active, order, onClick }: any) => (
  <th className="px-10 py-6 cursor-pointer hover:text-teal-500 transition-colors group" onClick={onClick}>
    <div className="flex items-center gap-2">
      {label}
      <div className="flex flex-col text-[8px] leading-[0.5] opacity-50 group-hover:opacity-100">
        <ChevronUp size={10} className={active && order === 'asc' ? 'text-teal-500' : 'text-slate-600'} />
        <ChevronDown size={10} className={active && order === 'desc' ? 'text-teal-500' : 'text-slate-600'} />
      </div>
    </div>
  </th>
);

const TableAction = ({ icon, color, onClick }: any) => (
  <button onClick={onClick} className={`${color} p-3 rounded-xl transition-all border border-transparent active:scale-90`}>
    {icon}
  </button>
);

export default Dashboard;