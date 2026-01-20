import React, { useRef, useState } from 'react';
import { Printer, Scissors, FlipHorizontal } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import IDCardPreview from './IDCardPreview';
import { type ApplicantCard } from '../types/card';

interface PrintModalProps {
  data: ApplicantCard;
  layout: any;
  onClose: () => void;
}

const PrintPreviewModal: React.FC<PrintModalProps> = ({ data, layout, onClose }) => {
  const [showCutLines, setShowCutLines] = useState(true);
  const [mirrorBack, setMirrorBack] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `ID_${data.idNumber}`,
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4">
      <style>{`
        @media print {
          body { 
            margin: 0 !important; 
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }


          /* Remove page break after last card */
          .id-card-print-wrapper:last-child {
            page-break-after: auto !important;
          }

          /* Ensure inner container respects dimensions */
          .id-card-print-wrapper > div {
            width: 2.125in !important;
            height: 3.375in !important;
            display: block !important;
            position: relative !important;
          }

          /* Force canvas to fill container exactly */
          .id-card-print-wrapper canvas {
            width: 2.125in !important;
            height: 3.375in !important;
            max-width: 2.125in !important;
            max-height: 3.375in !important;
            display: block !important;
            object-fit: fill !important;
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: crisp-edges !important;
          }

          .no-print { 
            display: none !important; 
          }
        }

        /* Screen preview styling */
        @media screen {
          .id-card-print-wrapper {
            margin-bottom: 1rem;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]">
        
        {/* SIDEBAR CONTROLS */}
        <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800 p-8 border-r border-slate-200 dark:border-slate-700 flex flex-col gap-6 no-print">
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Print<span className="text-teal-500">Center</span></h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ready for hardware output</p>
          </div>

          <div className="space-y-4 flex-1">
            <button 
              onClick={() => setShowCutLines(!showCutLines)}
              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                showCutLines ? 'border-teal-500 bg-teal-50' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${showCutLines ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <Scissors size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-tight text-slate-700">Cut Guides</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Boundary Lines</p>
              </div>
            </button>

            <button 
              onClick={() => setMirrorBack(!mirrorBack)}
              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                mirrorBack ? 'border-teal-500 bg-teal-50' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${mirrorBack ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <FlipHorizontal size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-tight text-slate-700">Mirror Back</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Reverse Image</p>
              </div>
            </button>

            <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <p className="text-xs font-bold text-amber-900 mb-2">⚠️ Print Settings</p>
              <ul className="text-[10px] text-amber-800 space-y-1">
                <li>• Card size: 2.125" × 3.375" (Portrait)</li>
                <li>• 2 pages: Page 1 = Front, Page 2 = Back</li>
                <li>• Use high-quality/best settings</li>
                <li>• Disable "Fit to page"</li>
                <li>• Use actual size (100%)</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => handlePrint()}
              className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all"
            >
              <Printer size={20} /> Print Now
            </button>
            <button onClick={onClose} className="w-full py-3 text-slate-400 font-black uppercase text-[10px]">
              Discard & Close
            </button>
          </div>
        </div>

        {/* PRINT PREVIEW AREA */}
        <div className="flex-1 bg-slate-200 dark:bg-slate-950 overflow-y-auto flex items-center justify-center p-4">
          <div ref={componentRef} className="print-canvas">
            
            {/* FRONT SIDE - Page 1 */}
            <div className={`id-card-print-wrapper ${showCutLines ? 'cut-guide-border' : ''}`}>
              <IDCardPreview 
                data={data} 
                layout={layout} 
                side="FRONT" 
                scale={1} 
                isPrinting={true}
              />
            </div>

            {/* BACK SIDE - Page 2 */}
            <div 
              className={`id-card-print-wrapper ${showCutLines ? 'cut-guide-border' : ''}`}
              style={{ transform: mirrorBack ? 'scaleX(-1)' : 'none' }}
            >
              <IDCardPreview 
                data={data} 
                layout={layout} 
                side="BACK" 
                scale={1} 
                isPrinting={true}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewModal;