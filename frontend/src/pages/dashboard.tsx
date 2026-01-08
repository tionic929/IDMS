import React, { useState, useEffect, useMemo } from 'react';
import { echo } from '../echo';
import axios from 'axios';
import { 
  Users, Search, Edit3, Trash2, ChevronUp, ChevronDown, 
  Copy, Download, Phone, MapPin, Clock, CreditCard, Eye, AlertCircle,
  CheckCheckIcon
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { confirmApplicant, getStudents } from '../api/students';
import type { Students } from '../types/students';

const VITE_API_URL = import.meta.env.VITE_API_URL;

type SortKey = 'created_at' | 'id_number' | 'name';

const Dashboard: React.FC = () => {
  const [allStudents, setAllStudents] = useState<Students[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');


  const queueCount = useMemo(() => 
    allStudents.filter(s => !s.has_card).length, [allStudents]
  );
  
  const handleExport = async (studentId: number) => {
    setLoading(true);
    try{
      await confirmApplicant(studentId);

      setAllStudents(prev => prev.map(s =>
        s.id === studentId ? { ...s, has_card: true} : s
      ));

      toast.success("Successfully added to the Excel DB");
    } catch (error) {
      toast.warn("Confirmation Failed");
    } finally {
      setLoading(false);
    }
  }

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
        console.log('New Applicant:', data.student);

        setAllStudents((prev: Students[]): Students[] => {
          if (prev.find(s => s.id === data.student.id)) {
            return prev;
          }
          return [data.student, ...prev];
        });
        toast.success(`New Entry: ${data.student.id_number}`);
      });

      return () => {
        channel.stopListening('.new-submission');
      };
  }, []);

  const latestStudent = useMemo(() => {
    const pending = allStudents.filter(s => !s.has_card);

    return [...pending].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0] || null;
  }, [allStudents]);

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

  // const copyToClipboard = async (text: string) => {
  //   if (navigator.clipboard && navigator.clipboard.writeText) {
  //     await navigator.clipboard.writeText(text);
  //   } else {
  //     const textarea = document.createElement('textarea');
  //     textarea.value = text;
  //     document.body.appendChild(textarea);
  //     textarea.select();
  //     document.execCommand('copy');
  //     document.body.removeChild(textarea);
  //   }
  // };

  // const handleCopyAll = async () => {
  //   if (!latestStudent) return;
  //   const sections = [
  //     { label: 'Contact', text: latestStudent.guardian_contact.trim() },
  //     { label: 'Address', text: latestStudent.address.trim() },
  //     { label: 'Guardian', text: latestStudent.guardian_name.trim() },
  //     { label: 'Course', text: latestStudent.course.trim() },
  //     { label: 'Full Name', text: `${latestStudent.first_name} ${latestStudent.middle_initial ? latestStudent.middle_initial + '.' : ''} ${latestStudent.last_name}`.trim() },
  //     { label: 'ID Number', text: latestStudent.id_number.trim() },
  //   ];

  //   try {
  //     for (const section of sections) {
  //       await copyToClipboard(section.text);
  //       await new Promise((resolve) => setTimeout(resolve, 400));
  //     }
  //     toast.success("All details copied to clipboard");
  //   } catch (err) {
  //     toast.error("Multi-copy failed");
  //   }
  // };


  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${VITE_API_URL}/storage/${path}`;
  };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder(key === 'created_at' ? 'desc' : 'asc');
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this record? This cannot be undone.")) {
       toast.info(`Record ${id} deletion requested`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-teal-500/30">
      <div className="mx-auto p-4 md:p-8 space-y-8 max-w-[1600px]">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-wider text-slate-900 dark:text-white uppercase">
              Card Records <span className="text-teal-500">Dashboard</span>
            </h1>
          </div>
          <StatBox label="Waiting in Line" value={queueCount.toString()} />
        </header>

        {/* LATEST ENTRY HERO */}
        <AnimatePresence mode="wait">
          {loading ? (
            <HeroSkeleton key="skeleton" />
          ) : latestStudent ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row gap-6 items-stretch"
            >
              <div className="w-full lg:w-fit bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center gap-8">
                <BiometricCard
                  label="Primary Photo"
                  src={getImageUrl(latestStudent.id_picture)}
                  downloadName={`${latestStudent.id_number}_ID.jpg`}
                />
                <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />
                <BiometricCard
                  label="Digital Signature"
                  src={getImageUrl(latestStudent.signature_picture)}
                  downloadName={`${latestStudent.id_number}_Signature.jpg`}
                  isSignature
                />
              </div>

              <div className="flex-1 bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2">
                <div className="p-10 flex flex-col justify-between relative overflow-hidden border-r border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
                  <div className="absolute -top-10 -right-10 p-4 opacity-5">
                    <CreditCard size={240} className="-rotate-12 text-white" />
                  </div>
                  <div className="relative z-10">
                    <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Latest Entry
                    </span>
                    <div className="mt-8 border-b border-white/5 pb-6">
                      <h2 className="text-[0.8rem] font-black text-slate-500 uppercase tracking-[0.2em]">ID Number</h2>
                      <h2 className="text-[3.5rem] font-sans font-black tracking-tighter text-white leading-none mt-2">
                        {latestStudent.id_number}
                      </h2>
                    </div>
                    <div className="mt-8">
                      <h2 className="text-5xl font-black leading-tight tracking-tighter text-white">
                        {latestStudent.last_name},<br />
                        <span className="text-teal-400">{latestStudent.first_name}</span>
                      </h2>
                      <p className="text-xl text-slate-400 font-bold mt-4 flex items-center uppercase gap-3">
                        <span className="w-2.5 h-2.5 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                        {latestStudent.course} Department
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-10 bg-slate-900/30 flex flex-col justify-between">
                  <div className="space-y-10">
                    <div>
                      <h2 className="text-[0.8rem] font-black text-slate-500 uppercase tracking-widest">Address</h2>
                      <div className="flex gap-3 mt-3 items-start">
                        <MapPin size={22} className="text-teal-500 shrink-0 mt-1" />
                        <p className="text-[1.3rem] font-bold text-slate-300 leading-snug">{latestStudent.address}</p>
                      </div>
                    </div>
                    <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                      <h2 className="text-[0.8rem] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-3 mb-5">
                        Emergency Contact
                      </h2>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Guardian</span>
                          <span className="text-[1.3rem] font-black text-white">{latestStudent.guardian_name}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Mobile</span>
                          <div className="flex gap-2 items-center text-teal-400 mt-1">
                            <Phone size={18} />
                            <p className="text-[1.3rem] font-bold font-mono tracking-tight">{latestStudent.guardian_contact}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 pt-6 border-t border-white/5">
                    <button
                      disabled={!latestStudent || loading}
                      onClick={() => latestStudent && handleExport(latestStudent.id)}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-teal-500 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-400 transition-all active:scale-[0.98] shadow-lg shadow-teal-500/20"
                    >
                      <CheckCheckIcon size={18} />
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* DIRECTORY TABLE */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide">Quick History</h3>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Filter results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-sm font-bold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredStudents.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                    <SortHeader label="Student ID" active={sortBy === 'id_number'} order={sortOrder} onClick={() => toggleSort('id_number')} />
                    <SortHeader label="Full Name" active={sortBy === 'name'} order={sortOrder} onClick={() => toggleSort('name')} />
                    <th className="px-8 py-5 hidden sm:table-cell">Program</th>
                    <th className="px-8 py-5 hidden lg:table-cell">Contact</th>
                    <SortHeader label="Entry Date" active={sortBy === 'created_at'} order={sortOrder} onClick={() => toggleSort('created_at')} hideMobile />
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-8 py-6 font-bold text-teal-600 dark:text-teal-400 font-mono text-sm">{student.id_number}</td>
                      <td className="px-8 py-6 font-bold text-slate-900 dark:text-white text-sm">{student.last_name}, {student.first_name}</td>
                      <td className="px-8 py-6 hidden sm:table-cell">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">{student.course}</span>
                      </td>
                      <td className="px-8 py-6 hidden lg:table-cell text-slate-500 font-mono text-xs">{student.guardian_contact}</td>
                      <td className="px-8 py-6 hidden md:table-cell text-slate-400 font-bold text-xs uppercase">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <TableAction icon={<Edit3 size={16} />} color="text-slate-400 hover:text-teal-500 hover:bg-teal-500/10" />
                          <TableAction onClick={() => handleDelete(student.id)} icon={<Trash2 size={16} />} color="text-slate-400 hover:text-red-500 hover:bg-red-500/10" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : !loading && (
              <div className="p-20 flex flex-col items-center justify-center text-center">
                <AlertCircle size={40} className="text-slate-400 mb-4" />
                <h4 className="text-xl font-bold text-white">No results found</h4>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- Sub-components ---

const HeroSkeleton = () => (
  <div className="flex flex-col lg:flex-row gap-6 animate-pulse">
    <div className="w-full lg:w-72 h-[450px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]" />
    <div className="flex-1 h-[450px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]" />
  </div>
);

const StatBox = ({ label, value, isStatus }: any) => (
  <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <div className="flex items-center gap-2">
      {isStatus && <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />}
      <p className="text-lg font-black text-slate-900 dark:text-white uppercase leading-none">{value}</p>
    </div>
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
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Download failed. Check server CORS settings.");
      window.open(src, '_blank');
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
      <div className="relative group">
        {/* Changed bg-slate-50 to bg-white for signature consistency */}
        <div className="w-44 h-44 bg-white rounded-[2.5rem] overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-inner transition-all group-hover:border-teal-500/50 isolate relative">
          {src ? (
            <img 
              src={src} 
              alt={label} 
              /* Removed dark:invert and brightness filters for the signature */
              className={`w-full h-full ${isSignature ? 'object-contain p-6' : 'object-cover'}`} 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 dark:bg-slate-950">
              <Users size={32} />
            </div>
          )}
          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all duration-300 backdrop-blur-sm rounded-[2.5rem]">
            <button 
              onClick={handleDownload}
              className="p-3 bg-teal-500 text-slate-950 rounded-2xl hover:scale-110 transition-transform flex items-center justify-center"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={() => window.open(src, '_blank')} 
              className="p-3 bg-white/10 text-white rounded-2xl hover:scale-110 transition-transform border border-white/20 flex items-center justify-center"
            >
              <Eye size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SortHeader = ({ label, active, order, onClick, hideMobile }: any) => (
  <th className={`px-8 py-5 cursor-pointer hover:text-teal-500 transition-colors ${hideMobile ? 'hidden md:table-cell' : ''}`} onClick={onClick}>
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
  <button onClick={onClick} className={`${color} p-2.5 rounded-xl transition-all border border-transparent hover:border-current active:scale-90`}>
    {icon}
  </button>
);

export default Dashboard;