import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Loader2, User, BookOpen, 
  Camera, FileCheck, CheckCircle2, ShieldCheck, 
  AlertCircle, UploadCloud, RefreshCcw, Zap
} from 'lucide-react';

// --- FIXED IMPORT ---
import { removeBackground } from '@imgly/background-removal';

import { verifyIdNumber } from '../api/reports';
import api, { getCsrfCookie } from '../api/axios';

const LOCAL_BRIDGE_URL = "https://glacial-samiyah-presutural.ngrok-free.dev";

interface FormState {
  idNumber: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  course: string;
  address: string;
  guardianName: string;
  guardianContact: string;
  id_picture: File | null;
  signature_picture: File | null;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const SubmitDetails: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    idNumber: '', firstName: '', middleInitial: '', lastName: '',
    course: '', address: '', guardianName: '', guardianContact: '',
    id_picture: null, signature_picture: null
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'enhancing' | 'uploading'>('idle');
  
  // Previews for the UI (Imgly background-removed versions)
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);

  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | ''>('');

  const isFormIncomplete = !form.idNumber || !form.firstName || !form.lastName || !form.id_picture || !form.signature_picture;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'id_picture' | 'signature_picture') => {
    const file = e.target.files?.[0];
    if (!file || !ALLOWED_TYPES.includes(file.type)) return;

    // Save the RAW file to the form state immediately
    setForm(prev => ({ ...prev, [field]: file }));

    // Instant Preview Logic
    if (field === 'id_picture') {
      setIsRemovingBg(true);
      try {
        const bgRemovedBlob = await removeBackground(file);
        setIdPreview(URL.createObjectURL(bgRemovedBlob));
      } catch (err) {
        console.warn("Local BG removal failed, showing raw", err);
        setIdPreview(URL.createObjectURL(file));
      } finally {
        setIsRemovingBg(false);
      }
    } else {
      setSigPreview(URL.createObjectURL(file));
    }
  };

  // Helper to send to Python Bridge
  const processViaBridge = async (file: File, type: 'id_picture' | 'signature_picture') => {
    const photoB64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const response = await axios.post(`${LOCAL_BRIDGE_URL}/process_and_return`, {
      photo: photoB64,
      type: type 
    }, { 
      responseType: 'blob', 
      timeout: 120000 
    });

    return new File([response.data], `processed_${type === 'id_picture' ? 'id' : 'sig'}.webp`, { type: "image/webp" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormIncomplete || !form.id_picture || !form.signature_picture) return;

    setIsSubmitting(true);
    setSubmitPhase('enhancing');

    try {
      // 1. RUN THE BRIDGE ENHANCEMENT DURING SUBMISSION
      const [enhancedId, enhancedSig] = await Promise.all([
        processViaBridge(form.id_picture, 'id_picture'),
        processViaBridge(form.signature_picture, 'signature_picture')
      ]);

      setSubmitPhase('uploading');

      // 2. FINAL UPLOAD TO YOUR ADMIN BACKEND
      await getCsrfCookie();
      const finalFormData = new FormData();
      
      // Add all text fields
      Object.entries(form).forEach(([key, value]) => {
        if (key !== 'id_picture' && key !== 'signature_picture' && value !== null) {
          finalFormData.append(key, value as string);
        }
      });

      // Add the ENHANCED files
      finalFormData.append('id_picture', enhancedId);
      finalFormData.append('signature_picture', enhancedSig);

      await api.post("/students", finalFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error("Submission/Enhancement Error:", err);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
      setSubmitPhase('idle');
    }
  };

  useEffect(() => {
    if (form.idNumber.length >= 8) {
      const delayDebounceFn = setTimeout(async () => {
        setIsVerifying(true);
        try {
          const response = await verifyIdNumber(form.idNumber);
          if (response.valid) {
            setVerificationStatus('valid');
            const s = response.data;
            setForm(prev => ({
              ...prev,
              firstName: s.firstName || '',
              middleInitial: s.middleName ? s.middleName.charAt(0).toUpperCase() : '',
              lastName: s.lastName || '',
              course: s.course || prev.course
            }));
          }
        } catch (err) {
          setVerificationStatus('invalid');
          setErrorMessage('ID Not Found');
        } finally { setIsVerifying(false); }
      }, 800);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [form.idNumber]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans pb-20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-4 md:px-10 py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 text-slate-600 font-bold group">
            <div className="p-2.5 bg-slate-100 group-hover:bg-teal-50 rounded-2xl transition-colors">
              <ArrowLeft size={22} />
            </div>
            <span className="hidden md:inline-block text-sm">Exit</span>
          </button>
          <div className="text-center">
            <h2 className="text-[10px] font-black tracking-[0.3em] text-teal-600 uppercase">NCnian School ID</h2>
            <p className="text-sm lg:text-xl font-black text-slate-900 uppercase">Profile Details</p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-slate-400 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Secure Link</span>
          </div>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto mt-8 px-4">
        <AnimatePresence>
          {status === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-6 rounded-[2rem] border shadow-sm flex items-center justify-between bg-emerald-50 border-emerald-200 text-emerald-700">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20}/>
                <span className="text-xs font-black uppercase tracking-widest">Application Submitted Successfully!</span>
              </div>
              <button onClick={() => navigate('/')} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-bold">Return Home</button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <FormSection icon={<BookOpen />} title="Academic Standing" subtitle="Verified Student Identity">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScalingInput label="ID Number" value={form.idNumber} onChange={(v: string) => setForm({...form, idNumber: v})} status={verificationStatus} isLoading={isVerifying}/>
                <ScalingInput label="Course" value={form.course} onChange={(v: string) => setForm({...form, course: v})}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6">
                <div className="md:col-span-2"><ScalingInput label="Given Name" value={form.firstName} onChange={(v: string) => setForm({...form, firstName: v})} /></div>
                <div className="md:col-span-1"><ScalingInput label="M.I." value={form.middleInitial} onChange={(v: string) => setForm({...form, middleInitial: v})} /></div>
                <div className="md:col-span-2"><ScalingInput label="Surname" value={form.lastName} onChange={(v: string) => setForm({...form, lastName: v})} /></div>
              </div>
            </FormSection>

            <FormSection icon={<User />} title="Personal Information" subtitle="Contact & Residence">
              <ScalingInput label="Complete Address" value={form.address} onChange={(v: string) => setForm({...form, address: v})} isTextArea />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <ScalingInput label="Guardian Name" value={form.guardianName} onChange={(v: string) => setForm({...form, guardianName: v})} />
                <ScalingInput label="Guardian Contact Number" value={form.guardianContact} onChange={(v: string) => setForm({...form, guardianContact: v})} />
              </div>
            </FormSection>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-10 sticky top-28">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Identity Assets</h3>
              
              <div className="space-y-4 text-center">
                <div className="relative mx-auto w-44 h-44 group">
                  <div className={`w-full h-full rounded-[3rem] bg-slate-50 border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${isRemovingBg ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'}`}>
                    {isRemovingBg ? (
                       <div className="flex flex-col items-center gap-2">
                          <RefreshCcw className="animate-spin text-teal-600" size={32} />
                          <span className="text-[9px] font-black text-teal-800 uppercase">Extracting...</span>
                       </div>
                    ) : idPreview ? (
                      <img src={idPreview} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                         <UploadCloud size={44} className="text-slate-300" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Photo Required</span>
                      </div>
                    )}
                  </div>
                  <input type="file" id="id-p" hidden onChange={e => handleFileChange(e, 'id_picture')} disabled={isSubmitting}/>
                  <label htmlFor="id-p" className="absolute -bottom-2 -right-2 p-4 bg-teal-600 text-white rounded-2xl cursor-pointer shadow-xl hover:scale-110 active:scale-90">
                    <Camera size={20}/>
                  </label>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Student Photo (2x2)</p>
              </div>

              <div className="space-y-4 text-center">
                <div className="relative mx-auto w-full h-28 group">
                  <div className="w-full h-full rounded-[2rem] bg-slate-50 border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all border-slate-200 hover:border-teal-300">
                    {sigPreview ? (
                      <img src={sigPreview} className="w-full h-full object-contain p-4" />
                    ) : (
                      <FileCheck size={32} className="text-slate-300" />
                    )}
                  </div>
                  <input type="file" id="sig-p" hidden onChange={e => handleFileChange(e, 'signature_picture')} disabled={isSubmitting}/>
                  <label htmlFor="sig-p" className="absolute -bottom-2 -right-2 bg-slate-800 text-white p-3 rounded-2xl cursor-pointer shadow-lg hover:scale-110"><FileCheck size={20}/></label>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">E-Signature</p>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting || isRemovingBg || verificationStatus !== 'valid' || isFormIncomplete}
                  className={`w-full py-6 rounded-[2rem] font-black text-xs tracking-[0.3em] shadow-2xl transition-all flex flex-col items-center justify-center gap-1 ${verificationStatus === 'valid' && !isFormIncomplete ? 'bg-[#00928a] text-white hover:bg-[#007a73]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-3">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18}/>}
                    {isSubmitting ? 'PLEASE WAIT...' : 'CONFIRM & SUBMIT'}
                  </div>
                  {isSubmitting && (
                    <span className="text-[8px] opacity-70 animate-pulse uppercase tracking-widest">
                      {submitPhase === 'enhancing' ? 'Running GFPGAN Restoration...' : 'Finalizing Upload...'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// --- HELPER COMPONENTS ---
const FormSection = ({ icon, title, subtitle, children }: any) => (
  <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-200 overflow-hidden relative">
    <div className="flex items-center gap-4 mb-8 relative z-10">
      <div className="w-14 h-14 bg-teal-50 rounded-[1.25rem] flex items-center justify-center text-teal-600 shadow-sm">{icon}</div>
      <div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
        <p className="text-[10px] text-teal-600/60 font-black uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

const ScalingInput = ({ label, value, onChange, isTextArea = false, status = 'idle', isLoading = false }: any) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-4 tracking-[0.15em]">{label}</label>
    <div className="relative">
      {isTextArea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 outline-none focus:bg-white focus:border-teal-500 transition-all text-sm font-bold" />
      ) : (
        <>
          <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-slate-50 border rounded-[2rem] px-6 py-5 outline-none transition-all text-sm font-bold ${status === 'valid' ? 'border-emerald-500 bg-emerald-50/30' : status === 'invalid' ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-teal-500'}`} />
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            {isLoading && <Loader2 className="animate-spin text-teal-500" size={20}/>}
            {status === 'valid' && !isLoading && <CheckCircle2 className="text-emerald-500" size={20}/>}
            {status === 'invalid' && !isLoading && <AlertCircle className="text-rose-500" size={20}/>}
          </div>
        </>
      )}
    </div>
  </div>
);

export default SubmitDetails;