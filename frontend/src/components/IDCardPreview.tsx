import React from 'react';

import { type ApplicantCard } from '../types/card';

import FRONT from '../assets/ID/FRONT.png';
import BACK from '../assets/ID/BACK.png';

const IDCardPreview: React.FC<{ data: ApplicantCard }> = ({ data }) => {
  return (
    <div className="flex flex-col gap-8 items-center p-6 bg-slate-800 rounded-3xl">
      
      {/* FRONT SIDE */}
      <div className="relative w-[320px] h-[500px] shadow-2xl overflow-hidden rounded-xl border border-white/10">
        {/* Background Template */}
        <img src={FRONT} className="absolute inset-0 w-full h-full z-0" alt="Front Template" />
        
        <div className="absolute top-[170px] left-[125px] w-[170px] h-[180px] z-10 overflow-hidden bg-slate-200">
           {data.photo && <img src={data.photo} className="w-full h-full object-cover" alt="Student" />}
        </div>

        {/* Text Details - Mapped to the bottom green section */}
        <div className="absolute bottom-[40px] w-full text-center z-10 px-4">
          <h2 className="text-white font-black text-xl leading-tight">{data.fullName}</h2>
          <p className="text-teal-200 font-bold text-sm tracking-wider">{data.idNumber}</p>
          <p className="text-white/80 font-medium text-[10px] uppercase mt-1">{data.course}</p>
        </div>
      </div>

      {/* BACK SIDE */}
      <div className="relative w-[320px] h-[500px] shadow-2xl overflow-hidden rounded-xl border border-white/10">
        <img src={BACK} className="absolute inset-0 w-full h-full z-0" alt="Back Template" />
        
        {/* Student Signature Area */}
        <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 w-40 h-16 z-10 flex items-center justify-center">
           {data.guardian_name && <img src={data.guardian_name} className="max-w-full max-h-full object-contain mix-blend-multiply" alt="Signature" />}
        </div>
        <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 w-40 h-16 z-10 flex items-center justify-center">
           {data.signature && <img src={data.signature} className="max-w-full max-h-full object-contain mix-blend-multiply" alt="Signature" />}
        </div>
      </div>
      
    </div>
  );
};

export default IDCardPreview;