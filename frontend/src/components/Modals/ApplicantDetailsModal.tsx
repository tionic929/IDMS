import React, { useState } from 'react';
import { X, User, BadgeCheck, MapPin, Phone, GraduationCap, Image as ImageIcon, FileSignature, Loader2 } from 'lucide-react';
import { type ApplicantCard } from '../../types/card';

interface Props {
  data: ApplicantCard;
  onClose: () => void;
}

const ApplicantDetailsModal: React.FC<Props> = ({ data, onClose }) => {
  const [photoLoading, setPhotoLoading] = useState(true);
  const [photoError, setPhotoError] = useState(false);
  const [sigLoading, setSigLoading] = useState(true);
  const [sigError, setSigError] = useState(false);

  const handlePhotoLoad = () => setPhotoLoading(false);
  const handlePhotoError = () => {
    setPhotoLoading(false);
    setPhotoError(true);
  };

  const handleSigLoad = () => setSigLoading(false);
  const handleSigError = () => {
    setSigLoading(false);
    setSigError(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Modal Content */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">

        {/* Header */}
        <div className="flex justify-between items-center p-8 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <User size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80">Applicant Profile</span>
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{data.idNumber}</span>
              </div>
              <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">
                {data.fullName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-slate-200 rounded-2xl transition-all active:scale-90"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

            {/* Personal Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                  <BadgeCheck size={14} className="text-primary" />
                  Credentials & Info
                </h3>

                <div className="space-y-6">
                  <div className="group">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Identity</label>
                    <p className="text-lg font-black text-slate-800 uppercase tracking-tight">{data.fullName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ID Code</label>
                      <p className="text-sm font-bold text-slate-700 font-mono tracking-wider">{data.idNumber}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Academic Unit</label>
                      <p className="text-sm font-bold text-slate-700 uppercase">{data.course}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Residential Address</label>
                    <div className="flex gap-2 items-start mt-1">
                      <MapPin size={14} className="text-slate-300 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium text-slate-600 line-height-relaxed">{data.address || 'No address provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                  <Phone size={14} className="text-primary" />
                  Emergency Contact
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Guardian / Representative</label>
                    <p className="text-sm font-bold text-slate-800 uppercase">{data.guardian_name || 'Unset'}</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Contact Sequence</label>
                    <p className="text-sm font-bold text-primary font-mono bg-primary/5 inline-block px-2 py-0.5 rounded-md">{data.guardian_contact || 'None'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo and Signature */}
            <div className="space-y-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                <ImageIcon size={14} className="text-primary" />
                Visual Documentation
              </h3>

              {/* ID Photo */}
              <div className="group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                  Registry Photograph
                </label>
                <div className="relative w-full aspect-[4/5] bg-slate-50 rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-inner group-hover:border-primary/20 transition-all duration-500">
                  {photoLoading && !photoError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                      <Loader2 className="w-10 h-10 text-primary/20 animate-spin" />
                    </div>
                  )}

                  {photoError || !data.photo ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                      <User size={64} className="mb-4 opacity-50" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Missing Image</p>
                    </div>
                  ) : (
                    <img
                      src={data.photo}
                      alt={`${data.fullName}'s photo`}
                      className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${photoLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                      onLoad={handlePhotoLoad}
                      onError={handlePhotoError}
                    />
                  )}
                </div>
              </div>

              {/* Signature */}
              <div className="group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                  Verification Signature
                </label>
                <div className="relative w-full h-32 bg-slate-50 rounded-[1.5rem] overflow-hidden border-2 border-slate-100 shadow-inner p-4 group-hover:border-primary/20 transition-all duration-500">
                  {sigLoading && !sigError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                      <Loader2 className="w-6 h-6 text-primary/20 animate-spin" />
                    </div>
                  )}

                  {sigError || !data.signature ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-50">
                      <FileSignature size={24} className="mr-2 opacity-50" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No Signature</p>
                    </div>
                  ) : (
                    <img
                      src={data.signature}
                      alt={`${data.fullName}'s signature`}
                      className={`w-full h-full object-contain transition-all duration-700 ${sigLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                      onLoad={handleSigLoad}
                      onError={handleSigError}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .line-height-relaxed {
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

export default ApplicantDetailsModal;