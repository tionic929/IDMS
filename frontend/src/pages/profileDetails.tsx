import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Loader2, User, BookOpen, 
  Camera, FileCheck, CheckCircle2, ShieldCheck, ChevronDown,
  AlertCircle
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

  // Composites the transparent ID PNG onto a solid white background
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
    const targetUrl = field === 'id_picture' ? REMOVE_BG_API_URL : SCAN_SIGNATURE_API_URL;
    console.log("Attempting upload to:", targetUrl); // If this says "undefined", move your .env file
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'id_picture') setIsProcessingId(true);
    else setIsProcessingSig(true);

    try {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
        const compressed = await imageCompression(file, options);
        
        // Ensure we are sending a proper File object in the FormData
        const formData = new FormData();
        formData.append('image', compressed, 'upload.png'); 

        // Choose the endpoint based on the field
        const targetUrl = field === 'id_picture' ? REMOVE_BG_API_URL : SCAN_SIGNATURE_API_URL;

        console.log(`Sending to: ${targetUrl}`); // Debugging line

        const response = await axios.post(targetUrl, formData, { 
            responseType: 'blob',
            headers: {
                'Content-Type': 'multipart/form-data',
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
            console.error(`${field} processing failed:`, err);
            
            // Add this to see the EXACT error on your phone/browser
            const status = err.response?.status;
            const errorData = err.response?.data?.error || err.message;
            alert(`Upload Failed (${status}): ${errorData}`);

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
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => { 
        if (value) formData.append(key, value); 
      });
      await axios.post('/api/students', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { 
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
      }, 800); // 800ms debounce

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
        
        {/* Verification Status Overlay */}
        <AnimatePresence>
          {verificationStatus !== 'idle' && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${
                verificationStatus === 'valid' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {isVerifying ? <Loader2 className="animate-spin" size={18}/> : verificationStatus === 'valid' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
              <span className="text-xs font-black uppercase tracking-widest">
                {isVerifying ? 'Checking master list...' : verificationStatus === 'valid' ? 'Records Verified' : errorMessage}
              </span>
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
                />
                <ScalingInput label="Course" value={form.course} onChange={(v: string) => setForm({...form, firstName: v})}/>
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
                  {/* Biometric UI remains same */}
                  <div className="space-y-4">
                    <div className="relative mx-auto w-32 h-32 lg:w-48 lg:h-48">
                      <div className="w-full h-full rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                        {isProcessingId ? <Loader2 className="animate-spin text-teal-500" size={30} /> : idPreview ? <img src={idPreview} alt="Preview" className="w-full h-full object-cover" /> : <Camera size={40} className="text-slate-300" />}
                      </div>
                      <input type="file" accept="image/*" onChange={e => handleFile(e, 'id_picture')} className="hidden" id="id-p" />
                      <label htmlFor="id-p" className="absolute -bottom-2 -right-2 bg-[#00928a] text-white p-3 rounded-2xl shadow-xl cursor-pointer hover:scale-110 transition-transform"><Camera size={20} /></label>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Photo (2x2)</p>
                  </div>
                  <div className="space-y-4">
                    <div className="relative mx-auto w-full max-w-[200px] h-24 lg:h-32">
                      <div className="w-full h-full rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                        {isProcessingSig ? <Loader2 className="animate-spin text-slate-500" size={30} /> : sigPreview ? <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/gray-paper.png')] bg-repeat"><img src={sigPreview} alt="Signature" className="w-full h-full object-contain p-4" /></div> : <FileCheck size={40} className="text-slate-300" />}
                      </div>
                      <input type="file" accept="image/*" onChange={e => handleFile(e, 'signature_picture')} className="hidden" id="sig-p" />
                      <label htmlFor="sig-p" className="absolute -bottom-2 -right-2 bg-slate-800 text-white p-3 rounded-2xl cursor-pointer hover:scale-110 transition-transform"><FileCheck size={20} /></label>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Signature</p>
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                type="submit" 
                disabled={isSubmitting || isProcessingId || isProcessingSig || verificationStatus !== 'valid'}
                className={`w-full py-6 lg:py-8 rounded-[2.5rem] font-black text-sm lg:text-base tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 transition-all ${
                    verificationStatus === 'valid' ? 'bg-[#00928a] hover:bg-[#007a73] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'SUBMIT'}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Internal Layout Components
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

const ScalingInput = ({ label, value, onChange, placeholder = "", isTextArea = false, status = 'idle' }: any) => (
  <div className="w-full">
    <label className="block text-[10px] lg:text-xs font-black text-slate-400 uppercase mb-3 ml-2 tracking-[0.1em]">{label}</label>
    {isTextArea ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-[1.8rem] p-5 lg:p-6 text-sm lg:text-base focus:bg-white focus:ring-[6px] focus:ring-teal-50 focus:border-teal-500 outline-none transition-all placeholder:text-slate-300" placeholder="Input full details..." />
    ) : (
      <div className="relative">
          <input 
            type="text" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder} 
            className={`w-full bg-slate-50 border rounded-[1.8rem] p-5 lg:p-6 text-sm lg:text-base focus:bg-white focus:ring-[6px] outline-none transition-all placeholder:text-slate-300 ${
                status === 'valid' ? 'border-emerald-500 focus:ring-emerald-50' : 
                status === 'invalid' ? 'border-rose-500 focus:ring-rose-50' : 
                'border-slate-200 focus:ring-teal-50 focus:border-teal-500'
            }`} 
            // disabled
          />
          {status === 'valid' && <CheckCircle2 className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />}
          {status === 'invalid' && <AlertCircle className="absolute right-6 top-1/2 -translate-y-1/2 text-rose-500" size={20} />}
      </div>
    )}
  </div>
);

const ScalingSelect = ({ label, value, onChange, options }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="w-full relative">
      <label className="block text-[10px] lg:text-xs font-black text-slate-400 uppercase mb-3 ml-2 tracking-[0.1em]">{label}</label>
      <div className="relative">
        <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-[1.8rem] p-5 lg:p-6 text-sm lg:text-base text-left transition-all outline-none ${isOpen ? 'bg-white ring-[6px] ring-teal-50 border-teal-500 shadow-lg' : 'hover:border-slate-300'}`}>
          <span className={value ? "text-slate-900 font-bold" : "text-slate-400"}>{value || "Select Department"}</span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown size={22} strokeWidth={3} className={isOpen ? "text-teal-600" : "text-slate-400"} /></motion.div>
        </button>
        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute z-50 left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[2rem] shadow-2xl max-h-72 overflow-y-auto custom-scrollbar">
                <div className="p-2 grid grid-cols-1 gap-1">
                  {options.map((opt: string) => (
                    <button key={opt} type="button" onClick={() => { onChange(opt); setIsOpen(false); }} className={`flex items-center justify-between px-6 py-4 rounded-2xl text-sm font-bold transition-all ${value === opt ? 'bg-[#00928a] text-white shadow-lg' : 'text-slate-600 hover:bg-teal-50 hover:text-teal-700'}`}>
                      <span>{opt}</span>
                      {value === opt && <CheckCircle2 size={18} className="text-white" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SubmitDetails;