import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Loader2, User, BookOpen, 
  Camera, FileCheck, CheckCircle2, ShieldCheck, ChevronDown,
  AlertCircle, UploadCloud, RefreshCcw
} from 'lucide-react';
import { verifyIdNumber } from '../api/reports';

const REMOVE_BG_API_URL = import.meta.env.VITE_REMOVE_BG_API_URL;
const SCAN_SIGNATURE_API_URL = import.meta.env.VITE_SCAN_SIGNATURE_API_URL;

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

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
  const [isProcessingId, setIsProcessingId] = useState(false);
  const [isProcessingSig, setIsProcessingSig] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | ''>('');
  
  // New: Specific file validation errors
  const [fileErrors, setFileErrors] = useState<{id?: string, sig?: string}>({});

  const isFormIncomplete = !form.idNumber || !form.firstName || !form.lastName || !form.id_picture || !form.signature_picture;

  /**
   * Validates file integrity using Magic Numbers (Binary Headers)
   * This prevents users from uploading renamed non-image files.
   */
  const validateFileIntegrity = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        const arr = (new Uint8Array(e.target?.result as ArrayBuffer)).subarray(0, 4);
        let header = "";
        for (let i = 0; i < arr.length; i++) {
          header += arr[i].toString(16);
        }
        // JPEG: ffd8ffe0, ffd8ffe1, ffd8ffe2, ffd8ffee, ffd8ffdb
        // PNG: 89504e47
        const isPng = header.startsWith("89504e47");
        const isJpeg = header.startsWith("ffd8ff");
        resolve(isPng || isJpeg);
      };
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  };

  const applyWhiteBackground = (blob: Blob): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((resultBlob) => {
            if (resultBlob) {
              resolve(new File([resultBlob], "id_photo_final.png", { type: "image/png" }));
            }
          }, 'image/png');
        }
      };
      img.src = URL.createObjectURL(blob);
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'id_picture' | 'signature_picture') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset errors
    setFileErrors(prev => ({ ...prev, [field === 'id_picture' ? 'id' : 'sig']: undefined }));

    // 1. Basic Extension/MIME Validation
    if (!ALLOWED_TYPES.includes(file.type)) {
        setFileErrors(prev => ({ ...prev, [field === 'id_picture' ? 'id' : 'sig']: "Invalid format. Please use JPG or PNG." }));
        return;
    }

    // 2. Size Validation
    if (file.size > MAX_FILE_SIZE) {
        setFileErrors(prev => ({ ...prev, [field === 'id_picture' ? 'id' : 'sig']: "File is too large (Max 5MB)." }));
        return;
    }

    // 3. Binary Integrity Check (Deep Validation)
    const isValidImage = await validateFileIntegrity(file);
    if (!isValidImage) {
        setFileErrors(prev => ({ ...prev, [field === 'id_picture' ? 'id' : 'sig']: "Corrupted or fake image file detected." }));
        return;
    }

    const targetUrl = field === 'id_picture' ? REMOVE_BG_API_URL : SCAN_SIGNATURE_API_URL;
    const finalUrl = targetUrl || (field === 'id_picture' ? '/remove-bg' : '/scan-signature');

    if (field === 'id_picture') setIsProcessingId(true);
    else setIsProcessingSig(true);

    try {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
        const compressed = await imageCompression(file, options);
        
        const formData = new FormData();
        formData.append('image', compressed, 'upload.png'); 

        const response = await axios.post(finalUrl, formData, { 
            responseType: 'blob',
            headers: {
                'Content-Type': 'multipart/form-data',
                'ngrok-skip-browser-warning': 'true',
            }
        });

        if (field === 'id_picture') {
            const finalFile = await applyWhiteBackground(response.data);
            setForm(prev => ({ ...prev, id_picture: finalFile }));
        } else {
            const processedSig = new File([response.data], "signature_cleaned.png", { type: "image/png" });
            setForm(prev => ({ ...prev, signature_picture: processedSig }));
        }
    } catch (err: any) {
        setFileErrors(prev => ({ ...prev, [field === 'id_picture' ? 'id' : 'sig']: "Processing failed. Using original." }));
        setForm(prev => ({ ...prev, [field]: file }));
    } finally {
        setIsProcessingId(false);
        setIsProcessingSig(false);
    }
  };

  const idPreview = useMemo(() => form.id_picture ? URL.createObjectURL(form.id_picture) : '', [form.id_picture]);
  const sigPreview = useMemo(() => form.signature_picture ? URL.createObjectURL(form.signature_picture) : '', [form.signature_picture]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormIncomplete) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => { 
        if (value) formData.append(key, value); 
      });

      const response = await axios.post('/api/students', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

      // ADDED: Console log to confirm system save
      console.log('✅ Application saved successfully into the system:', response.data);

      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) { 
      console.error('❌ Failed to save into the system:', err.response?.data || err.message);
      setStatus('error'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  useEffect(() => {
    if (form.idNumber.length >= 8) {
      const delayDebounceFn = setTimeout(async () => {
        setIsVerifying(true);
        setErrorMessage('');
        try {
          const response = await verifyIdNumber(form.idNumber);
          if (response.valid) {
            setVerificationStatus('valid');
            const student = response.data;
            setForm(prev => ({
              ...prev,
              firstName: student.firstName || '',
              middleInitial: student.middleName ? student.middleName.charAt(0).toUpperCase() : '',
              lastName: student.lastName || '',
              course: student.course || prev.course
            }));
          }
        } catch (err: any) {
          setVerificationStatus('invalid');
          setErrorMessage(err.response?.data?.message || 'Verification failed');
        } finally {
          setIsVerifying(false);
        }
      }, 800);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setVerificationStatus('idle');
    }
  }, [form.idNumber]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans pb-20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-4 md:px-10 py-4 lg:py-6">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 text-slate-600 hover:text-[#00928a] transition-all font-bold group">
            <div className="p-2.5 bg-slate-100 group-hover:bg-teal-50 rounded-2xl transition-colors">
              <ArrowLeft size={22} />
            </div>
            <span className="hidden md:inline-block text-base">Exit to Portal</span>
          </button>
          <div className="text-center">
            <h2 className="text-[10px] lg:text-xs font-black tracking-[0.3em] text-teal-600 uppercase mb-1">NCnian School ID</h2>
            <p className="text-sm lg:text-xl font-black text-slate-900 tracking-tight uppercase">ID Application Form</p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-slate-400 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Secure Session</span>
          </div>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto mt-6 lg:mt-12 px-4 sm:px-8">
        
        {/* Verification & General Status Overlay */}
        <AnimatePresence>
          {(verificationStatus !== 'idle' || status === 'success') && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0 }}
              className={`mb-6 p-6 rounded-[2rem] flex items-center justify-between gap-4 border shadow-sm ${
                status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                verificationStatus === 'valid' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {isVerifying ? <Loader2 className="animate-spin" size={20}/> : 
                 (verificationStatus === 'valid' || status === 'success') ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
                <span className="text-xs font-black uppercase tracking-widest">
                  {status === 'success' ? 'Application Submitted Successfully!' :
                   isVerifying ? 'Verifying with Registrar...' : 
                   verificationStatus === 'valid' ? 'Records Verified' : errorMessage}
                </span>
              </div>
              {status === 'success' && (
                  <button onClick={() => navigate('/')} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-xs">Return Home</button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8 space-y-8">
            <FormSection icon={<BookOpen />} title="Academic Standing" subtitle="Primary Enrollment Data">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScalingInput 
                  label="ID Number" 
                  value={form.idNumber} 
                  onChange={(v: string) => setForm({...form, idNumber: v})} 
                  placeholder="type your id number here" 
                  status={verificationStatus}
                  isLoading={isVerifying}
                />
                <ScalingInput label="Course" value={form.course} onChange={(v: string) => setForm({...form, course: v})}/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-4">
                <div className="md:col-span-2">
                  <ScalingInput label="Given Name" value={form.firstName} onChange={(v: string) => setForm({...form, firstName: v})} />
                </div>
                <div className="md:col-span-1">
                  <ScalingInput label="M.I." value={form.middleInitial} onChange={(v: string) => setForm({...form, middleInitial: v})} />
                </div>
                <div className="md:col-span-2">
                  <ScalingInput label="Surname" value={form.lastName} onChange={(v: string) => setForm({...form, lastName: v})} />
                </div>
              </div>
            </FormSection>

            <FormSection icon={<User />} title="Additional Information" subtitle="Personal Data">
              <ScalingInput label="Residential Address" value={form.address} onChange={(v: string) => setForm({...form, address: v})} isTextArea />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                <div className="md:col-span-2"><ScalingInput label="Guardian Name" value={form.guardianName} onChange={(v: string) => setForm({...form, guardianName: v})} /></div>
                <div className="md:col-span-2"><ScalingInput label="Guardian Contact" value={form.guardianContact} onChange={(v: string) => setForm({...form, guardianContact: v})} /></div>
              </div>
            </FormSection>
          </div>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32 space-y-8">
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 text-center">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Biometric Uploads</h3>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-8 lg:gap-10">
                  
                  {/* Photo Upload Card */}
                  <div className="space-y-4">
                    <div className="relative mx-auto w-32 h-32 lg:w-48 lg:h-48">
                      <div className={`w-full h-full rounded-[2.5rem] bg-slate-50 border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all ${
                          fileErrors.id ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                      }`}>
                        {isProcessingId ? (
                            <div className="flex flex-col items-center gap-2">
                                <RefreshCcw className="animate-spin text-teal-500" size={24} />
                                <span className="text-[8px] font-black text-teal-600 uppercase">AI Processing</span>
                            </div>
                        ) : idPreview ? (
                            <img src={idPreview} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-500" />
                        ) : (
                            <UploadCloud size={40} className="text-slate-300" />
                        )}
                      </div>
                      <input type="file" accept="image/png, image/jpeg" onChange={e => handleFile(e, 'id_picture')} className="hidden" id="id-p" />
                      <label htmlFor="id-p" className="absolute -bottom-2 -right-2 bg-[#00928a] text-white p-3 rounded-2xl shadow-xl cursor-pointer hover:scale-110 transition-transform active:scale-95"><Camera size={20} /></label>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Photo (2x2)</p>
                        {fileErrors.id && <p className="text-[9px] text-rose-500 font-bold mt-1 uppercase">{fileErrors.id}</p>}
                    </div>
                  </div>

                  {/* Signature Upload Card */}
                  <div className="space-y-4">
                    <div className="relative mx-auto w-full max-w-[200px] h-24 lg:h-32">
                      <div className={`w-full h-full rounded-[2.5rem] bg-slate-50 border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all ${
                          fileErrors.sig ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                      }`}>
                        {isProcessingSig ? (
                             <div className="flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin text-slate-500" size={24} />
                                <span className="text-[8px] font-black text-slate-600 uppercase">Cleaning...</span>
                             </div>
                        ) : sigPreview ? (
                            <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/gray-paper.png')] bg-repeat flex items-center justify-center">
                                <img src={sigPreview} alt="Signature" className="w-full h-full object-contain p-4 animate-in zoom-in-95 duration-500" />
                            </div>
                        ) : (
                            <FileCheck size={40} className="text-slate-300" />
                        )}
                      </div>
                      <input type="file" accept="image/png, image/jpeg" onChange={e => handleFile(e, 'signature_picture')} className="hidden" id="sig-p" required/>
                      <label htmlFor="sig-p" className="absolute -bottom-2 -right-2 bg-slate-800 text-white p-3 rounded-2xl cursor-pointer hover:scale-110 transition-transform active:scale-95"><FileCheck size={20} /></label>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Signature</p>
                        {fileErrors.sig && <p className="text-[9px] text-rose-500 font-bold mt-1 uppercase">{fileErrors.sig}</p>}
                    </div>
                  </div>

                </div>
              </div>

              <motion.button 
                whileHover={!isSubmitting && verificationStatus === 'valid' ? { scale: 1.02 } : {}} 
                whileTap={!isSubmitting && verificationStatus === 'valid' ? { scale: 0.98 } : {}} 
                type="submit" 
                disabled={isSubmitting || isProcessingId || isProcessingSig || verificationStatus !== 'valid' || isFormIncomplete}
                className={`w-full py-6 lg:py-8 rounded-[2.5rem] font-black text-sm lg:text-base tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 transition-all ${
                    verificationStatus === 'valid' && !isFormIncomplete ? 'bg-[#00928a] hover:bg-[#007a73] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin" size={24} />
                        <span>SUBMITTING...</span>
                    </>
                ) : 'SUBMIT'}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const FormSection = ({ icon, title, subtitle, children }: any) => (
  <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-200/60">
    <div className="flex items-center gap-4 mb-10">
      <div className="w-14 h-14 bg-teal-50 rounded-[1.5rem] flex items-center justify-center text-teal-600 shadow-inner">
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <div>
        <h3 className="text-base lg:text-2xl font-black text-slate-900 tracking-tight leading-none">{title}</h3>
        <p className="text-[10px] lg:text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-2">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

const ScalingInput = ({ label, value, onChange, placeholder = "", isTextArea = false, status = 'idle', isLoading = false, required = false }: any) => (
  <div className="w-full">
    <label className="block text-[10px] lg:text-xs font-black text-slate-400 uppercase mb-3 ml-2 tracking-[0.1em]">{label}</label>
    {isTextArea ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={4} required={required} className="w-full bg-slate-50 border border-slate-200 rounded-[1.8rem] p-5 lg:p-6 text-sm lg:text-base focus:bg-white focus:ring-[6px] focus:ring-teal-50 focus:border-teal-500 outline-none transition-all placeholder:text-slate-300" placeholder="Input full details..." />
    ) : (
      <div className="relative">
          <input 
            type="text" 
            value={value} 
            required={required}
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder} 
            className={`w-full bg-slate-50 border rounded-[1.8rem] p-5 lg:p-6 text-sm lg:text-base focus:bg-white focus:ring-[6px] outline-none transition-all placeholder:text-slate-300 ${
                status === 'valid' ? 'border-emerald-500 focus:ring-emerald-50' : 
                status === 'invalid' ? 'border-rose-500 focus:ring-rose-50' : 
                'border-slate-200 focus:ring-teal-50 focus:border-teal-500'
            }`} 
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isLoading && <Loader2 className="animate-spin text-teal-500" size={20} />}
              {status === 'valid' && !isLoading && <CheckCircle2 className="text-emerald-500" size={20} />}
              {status === 'invalid' && !isLoading && <AlertCircle className="text-rose-500" size={20} />}
          </div>
      </div>
    )}
  </div>
);

export default SubmitDetails;