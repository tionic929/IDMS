import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, User, BookOpen,
  Camera, FileCheck, CheckCircle2, ShieldCheck,
  AlertCircle, UploadCloud, RefreshCw, Zap,
  Contact, MapPin, Sparkles
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

  const startProgressSync = (field: 'id' | 'sig') => {
    setProcessingProgress(prev => ({ ...prev, [field]: 0 }));
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const current = prev[field];

        if (current >= 92) { // Hang at 92% until request actually finishes

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
        reader.readAsDataURL(file); // Fixed: Use 'file' directly instead of 'form.id_picture'
      });

      // Send to Python Bridge
      const bridgeResponse = await axios.post(`${LOCAL_BRIDGE_URL}/process_and_return`, {
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

  const idPreview = useMemo(() => form.id_picture ? URL.createObjectURL(form.id_picture) : '', [form.id_picture]);
  const sigPreview = useMemo(() => form.signature_picture ? URL.createObjectURL(form.signature_picture) : '', [form.signature_picture]);

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

      const finalData = new FormData();
      finalData.append('idNumber', form.idNumber);
      finalData.append('firstName', form.firstName);
      finalData.append('middleInitial', form.middleInitial);
      finalData.append('lastName', form.lastName);
      finalData.append('course', form.course);
      finalData.append('address', form.address);
      finalData.append('guardianName', form.guardianName);
      finalData.append('guardianContact', form.guardianContact);

      if (form.id_picture) finalData.append('id_picture', form.id_picture);
      if (form.signature_picture) finalData.append('signature_picture', form.signature_picture);

      // Captured the response variable here
      const response = await api.post("/students", finalData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("✅ Server Response:", response.data);
      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error("❌ Critical Submission Failure:", err);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
      setSubmitPhase('idle');
    }
  };

  // ID Verification Logic
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans pb-32">
      {/* ── Page header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b border-border px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 text-muted-foreground hover:text-foreground font-bold group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline uppercase tracking-widest text-[10px]">Back to Portal</span>
          </Button>

          <div className="flex flex-col items-center">
            <Badge variant="outline" className="border-primary/20 text-primary px-3 py-0 flex gap-2 items-center mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest">Enrollment v2.1</span>
            </Badge>
            <h1 className="text-xl font-black text-foreground uppercase tracking-tighter leading-none">Application Form</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-muted-foreground bg-muted/30 px-4 py-2 rounded-xl border border-border">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1400px] mx-auto mt-12 px-6"
      >
        <AnimatePresence>
          {(status === 'success' || verificationStatus === 'invalid') && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`mb-6 p-6 rounded-[2rem] border shadow-sm flex items-center justify-between ${status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
              <div className="flex items-center gap-3">
                {status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span className="text-xs font-black uppercase tracking-widest">
                  {status === 'success' ? 'Application Submitted!' : errorMessage}
                </span>
              </div>
              {status === 'success' && <button onClick={() => navigate('/')} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-bold">Done</button>}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <FormSection icon={<BookOpen />} title="Academic Standing" subtitle="Primary Data">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScalingInput label="ID Number" value={form.idNumber} onChange={(v: string) => setForm({ ...form, idNumber: v })} status={verificationStatus} isLoading={isVerifying} />
                <ScalingInput label="Course" value={form.course} onChange={(v: string) => setForm({ ...form, course: v })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6">
                <div className="md:col-span-2"><ScalingInput label="Given Name" value={form.firstName} onChange={(v: string) => setForm({ ...form, firstName: v })} /></div>
                <div className="md:col-span-1"><ScalingInput label="M.I." value={form.middleInitial} onChange={(v: string) => setForm({ ...form, middleInitial: v })} /></div>
                <div className="md:col-span-2"><ScalingInput label="Surname" value={form.lastName} onChange={(v: string) => setForm({ ...form, lastName: v })} /></div>
              </div>
            </FormCard>

            <FormSection icon={<User />} title="Personal Data" subtitle="Guardian & Address">
              <ScalingInput label="Address" value={form.address} onChange={(v: string) => setForm({ ...form, address: v })} isTextArea />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <ScalingInput label="Guardian Name" value={form.guardianName} onChange={(v: string) => setForm({ ...form, guardianName: v })} />
                <ScalingInput label="Guardian Contact" value={form.guardianContact} onChange={(v: string) => setForm({ ...form, guardianContact: v })} />
              </div>
            </FormCard>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-10">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Biometric Previews</h3>

              <div className="space-y-4 text-center">
                <div className="relative mx-auto w-44 h-44">
                  <div className={cn(
                    "w-full h-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-300 relative group",
                    isProcessingId ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50"
                  )}>
                    {isProcessingId ? (
                      <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                        <div className="relative flex items-center justify-center">
                          <RefreshCw className="h-10 w-10 animate-spin text-primary" />
                          <span className="absolute text-[10px] font-black text-primary">{processingProgress.id}%</span>
                        </div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">AI Enhancing</span>

                      </div>
                    ) : (
                      <UploadCloud size={40} className="text-slate-300" />
                    )}
                  </div>

                  <input type="file" id="id-p" hidden onChange={e => handleFileChange(e, 'id_picture')} disabled={isProcessingId} />
                  <label htmlFor="id-p" className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-3 rounded-2xl cursor-pointer shadow-xl hover:scale-110 active:scale-95 transition-all">
                    <Camera size={18} />
                  </label>
                </div>
                <div className="px-8">
                  <Progress value={processingProgress.id} className="h-1 bg-muted shrink-0" />

                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Photo (2x2)</p>
              </div>


              {/* SIGNATURE */}
              <div className="space-y-4 text-center">
                <div className="relative mx-auto w-full h-28 px-4">
                  <div className={cn(
                    "w-full h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-300 relative group",
                    isProcessingSig ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50"
                  )}>
                    {isProcessingSig ? (
                      <div className="flex items-center gap-3 animate-in slide-in-from-left-4 duration-300">
                        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-xs font-black text-primary">{processingProgress.sig}% Processing</span>
                      </div>
                    ) : sigPreview ? (
                      <img src={sigPreview} className="w-full h-full object-contain p-4 mix-blend-multiply dark:mix-blend-normal" />

                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileCheck size={24} className="opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Digital Signature</span>
                      </div>
                    )}
                  </div>

                  <input type="file" id="sig-p" hidden onChange={e => handleFileChange(e, 'signature_picture')} disabled={isProcessingSig} />
                  <label htmlFor="sig-p" className="absolute -bottom-2 -right-1 bg-foreground text-background dark:bg-zinc-800 dark:text-zinc-100 p-3 rounded-2xl cursor-pointer shadow-xl hover:scale-110 active:scale-95 transition-all">
                    <Sparkles size={18} />
                  </label>
                </div>
                <div className="px-8">
                  <Progress value={processingProgress.sig} className="h-1 bg-muted shrink-0" />

                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Signature</p>
              </div>


              <Button
                type="submit"
                disabled={isSubmitting || isProcessingId || isProcessingSig || verificationStatus !== 'valid' || isFormIncomplete}
                className={cn(
                  "w-full h-16 rounded-[1.5rem] font-black text-xs tracking-[0.2em] transition-all gap-4 shadow-xl",
                  verificationStatus === 'valid' && !isFormIncomplete
                    ? "bg-primary text-primary-foreground hover:translate-y-[-2px] shadow-primary/20"
                    : "bg-muted text-muted-foreground"
                )}

              >
                {isSubmitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 fill-current" />}
                {isSubmitting ? 'TRANSMITTING...' : 'FINALIZE SUBMISSION'}
              </Button>

              <p className="text-center text-[9px] font-bold text-muted-foreground px-6 py-2 bg-muted/30 rounded-xl leading-relaxed">
                By submitting, you agree to our <span className="text-foreground">Privacy Policy</span> regarding official school documentation processing.
              </p>
            </Card>
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

const ModernInput = ({ label, value, onChange, placeholder, status = 'idle', isLoading = false }: any) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">{label}</label>
    <div className="relative">
      {isTextArea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 outline-none focus:bg-white focus:border-teal-500 transition-all" />
      ) : (
        <>
          <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-slate-50 border rounded-3xl p-5 outline-none transition-all ${status === 'valid' ? 'border-emerald-500 bg-emerald-50/30' : status === 'invalid' ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-teal-500 focus:bg-white'}`} />
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            {isLoading && <Loader2 className="animate-spin text-teal-500" size={18} />}
            {status === 'valid' && !isLoading && <CheckCircle2 className="text-emerald-500" size={18} />}
            {status === 'invalid' && !isLoading && <AlertCircle className="text-rose-500" size={18} />}
          </div>
        </>
      )}
    </div>
  </div>
);

export default SubmitDetails;

