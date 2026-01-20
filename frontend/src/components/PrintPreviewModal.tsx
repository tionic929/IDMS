import React, { useRef, useState, useEffect } from 'react';
import { Printer, Scissors, FlipHorizontal } from 'lucide-react';
import IDCardPreview from './IDCardPreview';
import { type ApplicantCard } from '../types/card';
import { toast } from 'react-toastify';

interface PrintModalProps {
  data: ApplicantCard;
  layout: any;
  onClose: () => void;
}

const PrintPreviewModal: React.FC<PrintModalProps> = ({ data, layout, onClose }) => {
  const [showCutLines, setShowCutLines] = useState(true);
  const [mirrorBack, setMirrorBack] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  // Constants for the 1.58 ratio
  const DESIGN_WIDTH = 320;
  const DESIGN_HEIGHT = 500;

  const handleSilentPrint = () => {
    // 1. Check if we are running inside the Electron shell
    if (window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        
        toast.info("Sending job to CX-D80...");

        // 2. Send the command to main.js
        ipcRenderer.send('print-to-printer', {
          deviceName: 'DNP CX-D80', // Must match exact name in Windows Control Panel
          orientation: 'portrait'
        });

        // 3. Listen for the success/fail hardware response
        ipcRenderer.once('print-reply', (_event, arg) => {
          if (arg.success) {
            toast.success("Card sent to printer successfully!");
          } else {
            toast.error(`Hardware Error: ${arg.failureReason}`);
          }
        });
      } catch (err) {
        console.error("IPC Error:", err);
        toast.error("Could not connect to Electron Print Service");
      }
    } else {
      // Fallback for standard browsers (shows the Chrome/Edge print dialog)
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4">
      <style>{`
        @media print {
          @page {
            size: 2.125in 3.375in;
            margin: 0;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* The print container must match the CX-D80 physical area */
          .print-content-root {
            width: 2.125in !important;
            display: block !important;
          }

          .id-card-print-wrapper {
            width: 2.125in !important;
            height: 3.375in !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
            overflow: hidden !important;
          }

          .no-print { 
            display: none !important; 
          }
        }

        /* Screen Preview Styling */
        .preview-scroll-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 32px;
            padding: 40px;
        }

        .screen-card-wrapper {
            width: ${DESIGN_WIDTH}px;
            height: ${DESIGN_HEIGHT}px;
            background: white;
            box-shadow: 0 25px 60px rgba(0,0,0,0.5);
            flex-shrink: 0;
            border-radius: 12px;
            overflow: hidden;
        }

        .cut-guide-border {
            outline: 2px dashed #14b8a6;
            outline-offset: -2px;
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]">
        
        {/* SIDEBAR */}
        <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800 p-8 border-r border-slate-200 dark:border-slate-700 flex flex-col gap-6 no-print">
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Print<span className="text-teal-500">Center</span></h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Professional Print Shell</p>
          </div>

          <div className="space-y-4 flex-1">
            <button 
              onClick={() => setShowCutLines(!showCutLines)}
              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                showCutLines ? 'border-teal-500 bg-teal-50' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Scissors size={20} className={showCutLines ? 'text-teal-500' : 'text-slate-400'} />
              <div className="text-left">
                <p className="text-xs font-black uppercase text-slate-700">Bleed Guides</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Screen Preview Only</p>
              </div>
            </button>

            <button 
              onClick={() => setMirrorBack(!mirrorBack)}
              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                mirrorBack ? 'border-teal-500 bg-teal-50' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <FlipHorizontal size={20} className={mirrorBack ? 'text-teal-500' : 'text-slate-400'} />
              <div className="text-left">
                <p className="text-xs font-black uppercase text-slate-700">Mirror Back</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">For Film Transfer</p>
              </div>
            </button>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleSilentPrint}
              className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all"
            >
              <Printer size={20} /> Professional Print
            </button>
            <button onClick={onClose} className="w-full py-3 text-slate-400 font-black uppercase text-[10px]">
              Close Preview
            </button>
          </div>
        </div>

        {/* PRINT PREVIEW AREA */}
        <div className="flex-1 bg-slate-200 dark:bg-slate-950 overflow-y-auto preview-scroll-container">
          <div ref={componentRef} className="print-content-root">
            
            {/* FRONT SIDE */}
            <div className={`id-card-print-wrapper screen-card-wrapper ${showCutLines ? 'cut-guide-border' : ''}`}>
              <IDCardPreview 
                data={data} 
                layout={layout} 
                side="FRONT" 
                scale={0.67} 
                isPrinting={true}
              />
            </div>

            {/* BACK SIDE */}
            <div 
              className={`id-card-print-wrapper screen-card-wrapper ${showCutLines ? 'cut-guide-border' : ''}`}
              style={{ transform: mirrorBack ? 'scaleX(-1)' : 'none' }}
            >
              <IDCardPreview 
                data={data} 
                layout={layout} 
                side="BACK" 
                scale={0.67} 
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