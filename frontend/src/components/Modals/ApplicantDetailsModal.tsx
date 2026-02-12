import React, { useState } from 'react';
import { BsX, BsPersonBadge } from 'react-icons/bs';
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/50">
              <BsPersonBadge size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                {data.fullName}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md">
                  {data.idNumber}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {data.course}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            <BsX size={32} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
                Personal Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{data.fullName}</p>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID Number</label>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{data.idNumber}</p>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course</label>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{data.course}</p>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                  <p className="text-base text-slate-700 dark:text-slate-300">{data.address}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
                  Emergency Contact
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Guardian Name</label>
                    <p className="text-base font-semibold text-slate-900 dark:text-white">{data.guardian_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                    <p className="text-base font-semibold text-slate-900 dark:text-white">{data.guardian_contact}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo and Signature */}
            <div className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
                Documents
              </h3>
              
              {/* ID Photo */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  ID Photo
                </label>
                <div className="relative w-full aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                  {photoLoading && !photoError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {photoError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                      <BsPersonBadge size={48} className="mb-2" />
                      <p className="text-sm font-medium">No photo available</p>
                    </div>
                  ) : (
                    data.photo && (
                      <img 
                        src={data.photo} 
                        alt={`${data.fullName}'s photo`}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          photoLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                        onLoad={handlePhotoLoad}
                        onError={handlePhotoError}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Signature */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Signature
                </label>
                <div className="relative w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                  {sigLoading && !sigError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {sigError ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <p className="text-sm font-medium">No signature available</p>
                    </div>
                  ) : (
                    data.signature && (
                      <img 
                        src={data.signature} 
                        alt={`${data.fullName}'s signature`}
                        className={`w-full h-full object-contain transition-opacity duration-300 ${
                          sigLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                        onLoad={handleSigLoad}
                        onError={handleSigError}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetailsModal;