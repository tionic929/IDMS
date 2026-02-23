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

import { verifyIdNumber } from '@/api/reports';
import api, { getCsrfCookie } from '@/api/axios';

// shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";


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


  // Progress Sync States
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


      // 3. Convert returned binary back to File
      const processedFile = new File([response.data], `processed_${fieldKey}.webp`, { type: "image/webp" });


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
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1400px] mx-auto mt-12 px-6"
      >
        <AnimatePresence>

          {(status === 'success' || (verificationStatus === 'invalid' && form.idNumber.length >= 8)) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8"
            >
              <Alert variant={status === 'success' ? 'default' : 'destructive'} className={cn(
                "border-none shadow-xl",
                status === 'success' ? "bg-emerald-500 text-white" : "bg-destructive text-destructive-foreground"
              )}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {status === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <div>
                      <AlertTitle className="text-xs font-black uppercase tracking-[0.2em] mb-1">
                        {status === 'success' ? "Submission Successful" : "Validation Error"}
                      </AlertTitle>
                      <AlertDescription className="text-xs font-medium opacity-90">
                        {status === 'success' ? "Your application has been logged and is now being queued for processing." : errorMessage}
                      </AlertDescription>
                    </div>
                  </div>
                  {status === 'success' && (
                    <Button size="sm" onClick={() => navigate('/')} className="bg-white text-emerald-600 hover:bg-zinc-100 font-black text-[10px] uppercase tracking-widest">
                      Complete Process
                    </Button>
                  )}
                </div>
              </Alert>

            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <FormCard icon={<BookOpen className="text-primary" />} title="Academic Identity" subtitle="Primary Credentials">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                  label="School ID Number"
                  placeholder="Enter 8-digit ID"
                  value={form.idNumber}
                  onChange={(v: string) => setForm({ ...form, idNumber: v })}
                  status={verificationStatus}
                  isLoading={isVerifying}
                />
                <ModernInput
                  label="Program / Course"
                  placeholder="e.g. BS in Information Technology"
                  value={form.course}
                  onChange={(v: string) => setForm({ ...form, course: v })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <ModernInput label="First Name" value={form.firstName} onChange={(v: string) => setForm({ ...form, firstName: v })} />
                <ModernInput label="M.I." value={form.middleInitial} onChange={(v: string) => setForm({ ...form, middleInitial: v.toUpperCase() })} />
                <ModernInput label="Last Name" value={form.lastName} onChange={(v: string) => setForm({ ...form, lastName: v })} />
              </div>
            </FormCard>

            <FormCard icon={<Contact className="text-primary" />} title="Personal Registry" subtitle="Locality & Kinship">
              <div className="space-y-6">
                <div className="w-full">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-0.5 tracking-widest flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> Permanent Address
                  </label>
                  <Textarea
                    placeholder="House No, Street, Barangay, City/Municipality..."
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="min-h-[100px] border-border bg-muted/30 focus:bg-background transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ModernInput label="Guardian / Next of Kin" value={form.guardianName} onChange={(v: string) => setForm({ ...form, guardianName: v })} />
                  <ModernInput label="Emergency Contact" value={form.guardianContact} onChange={(v: string) => setForm({ ...form, guardianContact: v })} />
                </div>
              </div>
            </FormCard>
          </div>


          <div className="lg:col-span-4 sticky top-28">
            <Card className="border-none shadow-xl shadow-primary/5 p-6 rounded-[2.5rem] bg-card flex flex-col gap-8">
              <div className="text-center space-y-1">
                <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-3 py-0">Biometric Verification</Badge>
                <p className="text-xs text-muted-foreground font-medium">Capture or upload your digital assets</p>
              </div>

              {/* ID PHOTO */}
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
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Camera size={32} className="opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest">2x2 Portrait</span>
                      </div>
                    )}

                    {!isProcessingId && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <UploadCloud className="text-white h-8 w-8 animate-bounce" />
                      </div>
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
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Formal ID Photograph</p>
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


// --- HELPER COMPONENTS ---
const FormCard = ({ icon, title, subtitle, children }: any) => (
  <Card className="border-none shadow-xl shadow-primary/5 p-8 rounded-[2.5rem] bg-card overflow-hidden relative">
    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
      {React.cloneElement(icon, { size: 120 })}
    </div>

    <div className="flex items-center gap-4 mb-8">
      <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div>
        <h3 className="text-lg font-black text-foreground tracking-tight leading-none mb-1">{title}</h3>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none">{subtitle}</p>
      </div>
    </div>
    {children}
  </Card>
);

const ModernInput = ({ label, value, onChange, placeholder, status = 'idle', isLoading = false }: any) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-0.5 tracking-widest">{label}</label>
    <div className="relative">

      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "h-12 border-border bg-muted/30 px-5 rounded-2xl text-sm font-semibold transition-all focus:bg-background focus:ring-4 focus:ring-primary/5",
          status === 'valid' && "border-emerald-500/50 bg-emerald-500/5 focus:ring-emerald-500/5",
          status === 'invalid' && "border-destructive/50 bg-destructive/5 focus:ring-destructive/5"
        )}
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
        {isLoading && <RefreshCw className="animate-spin text-primary h-4 w-4" />}
        {status === 'valid' && !isLoading && <CheckCircle2 className="text-emerald-500 h-4 w-4" />}
        {status === 'invalid' && !isLoading && <AlertCircle className="text-destructive h-4 w-4" />}
      </div>

    </div>
  </div>
);

export default SubmitDetails;

