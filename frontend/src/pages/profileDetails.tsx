import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Loader2, User, BookOpen, 
  Camera, FileCheck, CheckCircle2, ShieldCheck, 
  AlertCircle, UploadCloud, RefreshCcw, Zap
} from 'lucide-react';

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
  
  // Progress states for UI feedback during Python Bridge processing
  const [processingProgress, setProcessingProgress] = useState({ id: 0, sig: 0 });
  const [isProcessingId, setIsProcessingId] = useState(false);
  const [isProcessingSig, setIsProcessingSig] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | ''>('');

  const isFormIncomplete = !form.idNumber || !form.firstName || !form.lastName || !form.id_picture || !form.signature_picture;

  // Simple progress bar simulator while waiting for Bridge response
  const startProgressSync = (field: 'id' | 'sig') => {
    setProcessingProgress(prev => ({ ...prev, [field]: 0 }));
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const current = prev[field];
        if (current >= 95) {
          clearInterval(interval);
          return prev;
        }
        return { ...prev, [field]: current + (current < 70 ? 15 : 2) };
      });
    }, 200);
    return interval;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'id_picture' | 'signature_picture') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fieldKey = field === 'id_picture' ? 'id' : 'sig';
    
    // 1. INSTANT RAW PREVIEW 
    // We set the raw file immediately so the user sees their upload instantly
    setForm(prev => ({ ...prev, [field]: file }));
    
    // 2. TRIGGER BACKGROUND ENHANCEMENT (Python Bridge)
    field === 'id_picture' ? setIsProcessingId(true) : setIsProcessingSig(true);
    const progressInterval = startProgressSync(fieldKey);

    try {
      const photoB64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const response = await axios.post(`${LOCAL_BRIDGE_URL}/process_and_return`, {
        photo: photoB64,
        type: field 
      }, { 
        responseType: 'blob', 
        timeout: 60000 
      });

      // 3. OVERWRITE WITH ENHANCED VERSION
      const processedFile = new File([response.data], `ai_${fieldKey}.webp`, { type: "image/webp" });
      setForm(prev => ({ ...prev, [field]: processedFile }));
      setProcessingProgress(prev => ({ ...prev, [fieldKey]: 100 }));
      
    } catch (err: any) {
      console.warn("AI Enhancement skipped/failed, using raw file:", err);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsProcessingId(false);
        setIsProcessingSig(false);
      }, 500);
    }
  };

  // Memoized Previews for Performance
  const idPreview = useMemo(() => form.id_picture ? URL.createObjectURL(form.id_picture) : '', [form.id_picture]);
  const sigPreview = useMemo(() => form.signature_picture ? URL.createObjectURL(form.signature_picture) : '', [form.signature_picture]);

  // Clean up Object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (idPreview) URL.revokeObjectURL(idPreview);
      if (sigPreview) URL.revokeObjectURL(sigPreview);
    };
  }, [idPreview, sigPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormIncomplete) return;

    setIsSubmitting(true);
    try {
      await getCsrfCookie();
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null) formData.append(key, value as string | Blob);
      });

      await api.post("/students", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
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
            <span className="hidden md:inline-block">Exit</span>
          </button>
          <div className="text-center">
            <h2 className="text-[10px] font-black tracking-[0.3em] text-teal-600 uppercase">NCnian School ID</h2>
            <p className="text-sm lg:text-xl font-black text-slate-900 uppercase">Application Form</p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-slate-400 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase">Secure Session</span>
          </div>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto mt-8 px-4">
        <AnimatePresence>
          {(status === 'success' || verificationStatus === 'invalid') && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`mb-6 p-6 rounded-[2rem] border shadow-sm flex items-center justify-between ${status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
              <div className="flex items-center gap-3">
                {status === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
                <span className="text-xs font-black uppercase tracking-widest">
                  {status === 'success' ? 'Application Submitted!' : errorMessage}
                </span>
              </div>
              {status === 'success' && <button onClick={() => navigate('/')} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-bold">Done</button>}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <FormSection icon={<BookOpen />} title="Academic Standing" subtitle="Primary Data">
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

            <FormSection icon={<User />} title="Personal Data" subtitle="Guardian & Address">
              <ScalingInput label="Address" value={form.address} onChange={(v: string) => setForm({...form, address: v})} isTextArea />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <ScalingInput label="Guardian Name" value={form.guardianName} onChange={(v: string) => setForm({...form, guardianName: v})} />
                <ScalingInput label="Guardian Contact" value={form.guardianContact} onChange={(v: string) => setForm({...form, guardianContact: v})} />
              </div>
            </FormSection>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-10">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Biometric Previews</h3>
              
              <div className="space-y-4 text-center">
                <div className="relative mx-auto w-40 h-40">
                  <div className={`w-full h-full rounded-[2.5rem] bg-slate-50 border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${isProcessingId ? 'border-teal-500 bg-teal-50 shadow-inner' : 'border-slate-200'}`}>
                    {idPreview ? (
                      <div className="relative w-full h-full">
                        <img src={idPreview} className={`w-full h-full object-cover transition-opacity duration-500 ${isProcessingId ? 'opacity-40' : 'opacity-100'}`} />
                        {isProcessingId && (
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <RefreshCcw className="animate-spin text-teal-600" size={30} />
                              <span className="text-[9px] font-black text-teal-700 uppercase mt-2">{processingProgress.id}% Optimizing...</span>
                           </div>
                        )}
                      </div>
                    ) : (
                      <UploadCloud size={40} className="text-slate-300" />
                    )}
                  </div>
                  <input type="file" id="id-p" hidden onChange={e => handleFileChange(e, 'id_picture')} accept="image/*" />
                  <label htmlFor="id-p" className="absolute -bottom-2 -right-2 bg-teal-600 text-white p-3 rounded-2xl cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-transform"><Camera size={20}/></label>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Photo (2x2)</p>
              </div>

              <div className="space-y-4 text-center">
                <div className="relative mx-auto w-full h-24">
                  <div className={`w-full h-full rounded-3xl bg-slate-50 border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${isProcessingSig ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}>
                    {sigPreview ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img src={sigPreview} className={`w-full h-full object-contain p-2 transition-opacity ${isProcessingSig ? 'opacity-30' : 'opacity-100'}`} />
                        {isProcessingSig && <Loader2 className="absolute animate-spin text-teal-600" />}
                      </div>
                    ) : (
                      <FileCheck size={32} className="text-slate-300" />
                    )}
                  </div>
                  <input type="file" id="sig-p" hidden onChange={e => handleFileChange(e, 'signature_picture')} accept="image/*" />
                  <label htmlFor="sig-p" className="absolute -bottom-2 -right-2 bg-slate-800 text-white p-3 rounded-2xl cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-transform"><FileCheck size={20}/></label>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Signature</p>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || verificationStatus !== 'valid' || isFormIncomplete}
                className={`w-full py-6 rounded-[2rem] font-black text-sm tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 ${verificationStatus === 'valid' && !isFormIncomplete ? 'bg-[#00928a] text-white hover:bg-[#007a73] active:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Zap size={18}/>}
                {isSubmitting ? 'PROCESSING...' : 'SUBMIT APPLICATION'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const FormSection = ({ icon, title, subtitle, children }: any) => (
  <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-200">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">{icon}</div>
      <div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

const ScalingInput = ({ label, value, onChange, isTextArea = false, status = 'idle', isLoading = false }: any) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">{label}</label>
    <div className="relative">
      {isTextArea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 outline-none focus:bg-white focus:border-teal-500 transition-all" />
      ) : (
        <>
          <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-slate-50 border rounded-3xl p-5 outline-none transition-all ${status === 'valid' ? 'border-emerald-500 bg-emerald-50/30' : status === 'invalid' ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-teal-500 focus:bg-white'}`} />
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            {isLoading && <Loader2 className="animate-spin text-teal-500" size={18}/>}
            {status === 'valid' && !isLoading && <CheckCircle2 className="text-emerald-500" size={18}/>}
            {status === 'invalid' && !isLoading && <AlertCircle className="text-rose-500" size={18}/>}
          </div>
        </>
      )}
    </div>
  </div>
);

export default SubmitDetails;