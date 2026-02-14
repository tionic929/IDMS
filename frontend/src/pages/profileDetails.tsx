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
// We import the specific named function 'removeBackground'
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
  const [clientSidePreview, setClientSidePreview] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState({ id: 0, sig: 0 });
  const [isProcessingId, setIsProcessingId] = useState(false);
  const [isProcessingSig, setIsProcessingSig] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | ''>('');

  const isFormIncomplete = !form.idNumber || !form.firstName || !form.lastName || !form.id_picture || !form.signature_picture;

  const startProgressSync = (field: 'id' | 'sig') => {
    setProcessingProgress(prev => ({ ...prev, [field]: 0 }));
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const current = prev[field];
        if (current >= 92) {
            clearInterval(interval);
            return prev;
        }
        return { ...prev, [field]: current + (current < 60 ? 12 : 3) };
      });
    }, 250);
    return interval;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'id_picture' | 'signature_picture') => {
    const file = e.target.files?.[0];
    if (!file || !ALLOWED_TYPES.includes(file.type)) return;

    const fieldKey = field === 'id_picture' ? 'id' : 'sig';
    field === 'id_picture' ? setIsProcessingId(true) : setIsProcessingSig(true);
    const progressInterval = startProgressSync(fieldKey);

    try {
      // 1. CLIENT-SIDE BG REMOVAL (ID PICTURE ONLY)
      if (field === 'id_picture') {
        try {
          // Now calling the named export correctly
          const bgRemovedBlob = await removeBackground(file);
          setClientSidePreview(URL.createObjectURL(bgRemovedBlob));
        } catch (bgErr) {
          console.warn("Client-side BG removal failed", bgErr);
          setClientSidePreview(URL.createObjectURL(file));
        }
      }

      // 2. SEND RAW PHOTO TO PYTHON BRIDGE
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
        timeout: 90000 
      });

      const processedFile = new File([response.data], `processed_${fieldKey}.webp`, { type: "image/webp" });
      setForm(prev => ({ ...prev, [field]: processedFile }));
      setProcessingProgress(prev => ({ ...prev, [fieldKey]: 100 }));
      
    } catch (err: any) {
      console.error("Bridge Error:", err);
      setForm(prev => ({ ...prev, [field]: file }));
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsProcessingId(false);
        setIsProcessingSig(false);
      }, 400);
    }
  };

  const idPreview = useMemo(() => form.id_picture ? URL.createObjectURL(form.id_picture) : '', [form.id_picture]);
  const sigPreview = useMemo(() => form.signature_picture ? URL.createObjectURL(form.signature_picture) : '', [form.signature_picture]);

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
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`mb-6 p-6 rounded-[2rem] border shadow-sm flex items-center justify-between ${status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
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
                    {isProcessingId ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative flex items-center justify-center">
                           <RefreshCcw className="animate-spin text-teal-600" size={40} />
                           <span className="absolute text-[10px] font-black text-teal-800">{processingProgress.id}%</span>
                        </div>
                        <span className="text-[9px] font-black text-teal-700 uppercase">Enhancing...</span>
                      </div>
                    ) : clientSidePreview || idPreview ? (
                      <img src={clientSidePreview || idPreview} className="w-full h-full object-cover" />
                    ) : (
                      <UploadCloud size={40} className="text-slate-300" />
                    )}
                  </div>
                  <input type="file" id="id-p" hidden onChange={e => handleFileChange(e, 'id_picture')} disabled={isProcessingId}/>
                  <label htmlFor="id-p" className="absolute -bottom-2 -right-2 bg-teal-600 text-white p-3 rounded-2xl cursor-pointer shadow-lg hover:scale-110"><Camera size={20}/></label>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Photo (2x2)</p>
              </div>

              <div className="space-y-4 text-center">
                <div className="relative mx-auto w-full h-24">
                  <div className={`w-full h-full rounded-3xl bg-slate-50 border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${isProcessingSig ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}>
                    {isProcessingSig ? (
                        <div className="flex items-center gap-3">
                             <Loader2 className="animate-spin text-teal-600" />
                             <span className="text-xs font-black text-teal-800">{processingProgress.sig}%</span>
                        </div>
                    ) : sigPreview ? (
                      <img src={sigPreview} className="w-full h-full object-contain p-2" />
                    ) : (
                      <FileCheck size={32} className="text-slate-300" />
                    )}
                  </div>
                  <input type="file" id="sig-p" hidden onChange={e => handleFileChange(e, 'signature_picture')} disabled={isProcessingSig}/>
                  <label htmlFor="sig-p" className="absolute -bottom-2 -right-2 bg-slate-800 text-white p-3 rounded-2xl cursor-pointer shadow-lg hover:scale-110"><FileCheck size={20}/></label>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Signature</p>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || isProcessingId || isProcessingSig || verificationStatus !== 'valid' || isFormIncomplete}
                className={`w-full py-6 rounded-[2rem] font-black text-sm tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 ${verificationStatus === 'valid' && !isFormIncomplete ? 'bg-[#00928a] text-white hover:bg-[#007a73] active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
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

// --- HELPER COMPONENTS ---
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
          <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-slate-50 border rounded-3xl p-5 outline-none transition-all ${status === 'valid' ? 'border-emerald-500' : status === 'invalid' ? 'border-rose-500' : 'border-slate-200 focus:border-teal-500'}`} />
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