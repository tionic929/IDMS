import React, { useState, useEffect, useMemo } from 'react';
import { echo } from '../echo';
import { 
  Users, Search, Edit3, Trash2, ChevronUp, ChevronDown, 
  Download, Eye, AlertCircle, Layout, Printer, RefreshCw
} from 'lucide-react';

import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { confirmApplicant, getStudents } from '../api/students';

// Types
import type { Students } from '../types/students';
import { type ApplicantCard } from '../types/card';

// New Component
import IDCardPreview from '../components/IDCardPreview';

const VITE_API_URL = import.meta.env.VITE_API_URL;
type SortKey = 'created_at' | 'id_number' | 'name';

const Dashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'queue' | 'history'>('queue');
  const [previewSide, setPreviewSide] = useState<'FRONT' | 'BACK'>('FRONT');
  
  const [allStudents, setAllStudents] = useState<Students[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await getStudents();
      const combined = [...(response.queue || []), ...(response.history || [])]; 
      setAllStudents(combined);
    } catch (error) {
      toast.error("Failed to fetch records");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    fetchStudents(); 
    const channel = echo.channel('dashboard')
      .listen('.new-submission', (data: { student: Students }) => {
        setAllStudents((prev) => {
          if (prev.find(s => s.id === data.student.id)) return prev;
          return [data.student, ...prev];
        });
        toast.success(`New Entry: ${data.student.id_number}`);
      });

    return () => { channel.stopListening('.new-submission'); };
  }, []);

  const queueCount = useMemo(() => 
    allStudents.filter(s => !s.has_card).length, [allStudents]
  );

  const latestStudent = useMemo(() => {
    const pending = allStudents.filter(s => !s.has_card);
    return [...pending].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0] || null;
  }, [allStudents]);

  // --- Mapper for IDCardPreview Component ---
  const previewData = useMemo((): ApplicantCard | null => {
    if (!latestStudent) return null;
    const getUrl = (path: string | null) => 
      !path ? null : (path.startsWith('http') ? path : `${VITE_API_URL}/storage/${path}`);

    return {
      fullName: `${latestStudent.first_name} ${latestStudent.last_name}`,
      idNumber: latestStudent.id_number,
      course: latestStudent.course,
      photo: getUrl(latestStudent.id_picture) || '',
      signature: getUrl(latestStudent.signature_picture) || ''
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
    setLoading(true);
    try {
      await confirmApplicant(studentId);
      setAllStudents(prev => prev.map(s => s.id === studentId ? { ...s, has_card: true } : s));
      toast.success("Successfully added to the Excel DB");
    } catch (error) {
      toast.warn("Confirmation Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (studentId: number) => {
    if (!window.confirm("Delete this record?")) return;
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
      <div className="mx-auto p-4 md:p-8 space-y-8 max-w-[1600px]">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-wider uppercase">
            Card Records <span className="text-teal-500">Dashboard</span>
          </h1>
          <div className="flex items-center gap-4">
            <StatBox label="Queue" value={queueCount.toString()} />
            <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-2xl border border-slate-300 dark:border-slate-800">
               <button 
                onClick={() => setViewMode('queue')}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'queue' ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-500'}`}
              >
                <Printer size={16} /> Queue
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* LEFT: STUDENT DATA HERO (Using your old layout style) */}
              <div className="xl:col-span-8">
                {latestStudent ? (
                  <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                    <div className="w-full lg:w-fit bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center gap-8">
                      <BiometricCard label="Photo" src={previewData?.photo} downloadName={`${latestStudent.id_number}_ID.jpg`} />
                      <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />
                      <BiometricCard label="Signature" src={previewData?.signature} downloadName={`${latestStudent.id_number}_Sig.jpg`} isSignature />
                    </div>

                    <div className="flex-1 bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2">
                      <div className="p-10 border-r border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
                         <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Next in Line</span>
                         <h2 className="text-[3.5rem] font-black text-white leading-none mt-6">{latestStudent.id_number}</h2>
                         <h2 className="text-4xl font-black text-white mt-4">{latestStudent.last_name}, <span className="text-teal-400">{latestStudent.first_name}</span></h2>
                         <p className="text-xl text-slate-400 font-bold mt-4 uppercase">{latestStudent.course} Dept</p>
                      </div>
                      <div className="p-10 flex flex-col justify-between">
                         <div className="space-y-6 text-white">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Emergency Contact</span>
                              <p className="text-xl font-black">{latestStudent.guardian_name}</p>
                              <p className="text-lg font-bold text-teal-500 font-mono">{latestStudent.guardian_contact}</p>
                            </div>
                         </div>
                         <button onClick={() => handleExport(latestStudent.id)} className="w-full py-4 bg-teal-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20">
                            Confirm Entry
                         </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                    <p className="text-slate-500 font-bold uppercase tracking-widest">No pending applicants</p>
                  </div>
                )}
              </div>

              {/* RIGHT: LIVE CARD PREVIEW (Using your new IDCardPreview component) */}
              <div className="xl:col-span-4 sticky top-8">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live ID Preview</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-500">
                    <RefreshCw size={12} className="animate-spin" /> Live Sync
                  </div>
                </div>

                {previewData ? (
                  <div className="flex flex-col items-center gap-6">
                    {/* The component you provided earlier */}
                    <div className="transform scale-[0.85] origin-top">
                        <IDCardPreview data={previewData} />
                    </div>

                    <button className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-200 transition-all">
                      SEND TO PRINTER
                    </button>
                  </div>
                ) : (
                  <div className="h-[500px] border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center text-slate-500">
                     <AlertCircle size={40} className="mb-4 opacity-50" />
                     <p className="text-xs font-bold uppercase tracking-widest">Waiting for Data...</p>
                  </div>
                )}
              </div>
            </div>

            {/* DIRECTORY TABLE */}
            <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide">Quick History</h3>
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Filter records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-sm font-bold"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                      <SortHeader label="Student ID" active={sortBy === 'id_number'} order={sortOrder} onClick={() => toggleSort('id_number')} />
                      <SortHeader label="Full Name" active={sortBy === 'name'} order={sortOrder} onClick={() => toggleSort('name')} />
                      <th className="px-8 py-5">Program</th>
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-8 py-6 font-bold text-teal-600 dark:text-teal-400 font-mono text-sm">{student.id_number}</td>
                        <td className="px-8 py-6 font-bold text-slate-900 dark:text-white text-sm">{student.last_name}, {student.first_name}</td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase">{student.course}</span>
                        </td>
                        <td className="px-8 py-6 text-slate-400 font-bold text-xs uppercase">{new Date(student.created_at).toLocaleDateString()}</td>
                        <td className="px-8 py-6 text-right flex justify-end gap-2">
                           <TableAction icon={<Edit3 size={16} />} color="text-slate-400 hover:text-teal-500" />
                           <TableAction onClick={() => handleDelete(student.id)} icon={<Trash2 size={16} />} color="text-slate-400 hover:text-red-500" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Helper Components ---

const StatBox = ({ label, value }: any) => (
  <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1">{value}</p>
  </div>
);

const BiometricCard = ({ label, src, downloadName, isSignature }: any) => {
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!src) return;
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Download failed.");
      window.open(src, '_blank');
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <div className="relative group w-44 h-44 bg-white rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
        {src ? (
          <img src={src} alt={label} className={`w-full h-full ${isSignature ? 'object-contain p-6' : 'object-cover'}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 dark:bg-slate-950"><Users size={32} /></div>
        )}
        <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all backdrop-blur-sm">
          <button onClick={handleDownload} className="p-3 bg-teal-500 text-slate-950 rounded-xl hover:scale-110 transition-transform"><Download size={18}/></button>
          <button onClick={() => window.open(src, '_blank')} className="p-3 bg-white/10 text-white rounded-xl hover:scale-110 transition-transform border border-white/20"><Eye size={18}/></button>
        </div>
      </div>
    </div>
  );
};

const SortHeader = ({ label, active, order, onClick }: any) => (
  <th className="px-8 py-5 cursor-pointer hover:text-teal-500 transition-colors" onClick={onClick}>
    <div className="flex items-center gap-2">
      {label}
      <div className="flex flex-col text-[8px] leading-[0.5]">
        <ChevronUp size={10} className={active && order === 'asc' ? 'text-teal-500' : 'text-slate-600'} />
        <ChevronDown size={10} className={active && order === 'desc' ? 'text-teal-500' : 'text-slate-600'} />
      </div>
    </div>
  </th>
);

const TableAction = ({ icon, color, onClick }: any) => (
  <button onClick={onClick} className={`${color} p-2.5 rounded-xl transition-all border border-transparent hover:bg-white/5 active:scale-90`}>
    {icon}
  </button>
);

export default Dashboard;