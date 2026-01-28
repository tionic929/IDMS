import React, { useRef, useState, useEffect } from 'react';
import { Printer, Scissors, FlipHorizontal, Download } from 'lucide-react';
import IDCardPreview from './IDCardPreview';
import { type ApplicantCard } from '../types/card';
import { toast } from 'react-toastify';

import { confirmApplicant } from '../api/students';

interface PrintModalProps {
  data: ApplicantCard;
  layout: any;
  onClose: () => void;
}

const PrintPreviewModal: React.FC<PrintModalProps> = ({ data, layout, onClose }) => {
  const [showCutLines, setShowCutLines] = useState(false);
  const [mirrorBack, setMirrorBack] = useState(false);
  const [frontImage, setFrontImage] = useState<string>('');
  const [backImage, setBackImage] = useState<string>('');
  const componentRef = useRef<HTMLDivElement>(null);

  const DESIGN_WIDTH = 320;
  const DESIGN_HEIGHT = 500;
  const PRINT_WIDTH = 640;
  const PRINT_HEIGHT = 1000;

  // Generate card images when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      const frontCanvas = document.querySelector('#front-print-stage canvas') as HTMLCanvasElement;
      const backCanvas = document.querySelector('#back-print-stage canvas') as HTMLCanvasElement;
      
      if (frontCanvas) {
        setFrontImage(frontCanvas.toDataURL('image/png', 1.0));
      }
      if (backCanvas) {
        setBackImage(backCanvas.toDataURL('image/png', 1.0));
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [data, layout]);

  const handleDownloadImages = () => {
    if (frontImage) {
      const link = document.createElement('a');
      link.download = `${data.idNumber}_FRONT.png`;
      link.href = frontImage;
      link.click();
    }
    
    if (backImage) {
      const link = document.createElement('a');
      link.download = `${data.idNumber}_BACK.png`;
      link.href = backImage;
      link.click();
    }
    
    toast.success('Card images downloaded!');
  };

  const handleSilentPrint = async (studentId: number) => {
    if (window.require) {
      try {
        await confirmApplicant(studentId);
        toast.success("Confirmed & Marked as printed. Opening print dialog...");
        const { ipcRenderer } = window.require('electron');
        toast.info("Sending job to printer...");
        
        // Use 'print-card-images' for image-based printing
        ipcRenderer.send('print-card-images', {
          deviceName: 'CX-D80 U1',  // MUST MATCH WINDOWS PRINTER NAME EXACTLY
          frontImage: frontImage,
          backImage: backImage,
          width: PRINT_WIDTH,
          height: PRINT_HEIGHT
        });

        ipcRenderer.once('print-reply', (_event, arg) => {
          if (arg.success) toast.success("Printed successfully!");
          else toast.error(`Error: ${arg.failureReason}`);
        });
      } catch (err) {
        console.error("IPC Error:", err);
        toast.error("Printing failed. Try 'Download Images' instead.");
      }
    } else {
      // Fallback to browser print
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4">
      <style>{`
        @media print {
          @page {
            margin: 0;
          }
          
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #print-root, #print-root * {
            visibility: visible;
          }

          #print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          .print-page {
            width: 2.125in !important;
            height: 3.375in !important;
            page-break-after: always !important;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .no-print, .screen-only { 
            display: none !important; 
          }
        }

        @media screen {
          .print-only {
            display: none !important;
          }
        }
        
        .cut-guide-border {
            outline: 2px dashed #14b8a6;
            outline-offset: -2px;
        }
        .hidden-canvas {
            position: absolute;
            left: -9999px;
            top: -9999px;
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] no-print">
        {/* SIDEBAR */}
        <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800 p-8 border-r border-slate-200 dark:border-slate-700 flex flex-col gap-6">
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Print<span className="text-teal-500">Center</span></h3>
            <p className="text-xs text-slate-500 mt-2">CX-D80 U1</p>
          </div>
          <div className="space-y-4 flex-1">
             <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-600 mb-2">Output Settings</p>
              <p className="text-xs text-slate-500">
                {PRINT_WIDTH} × {PRINT_HEIGHT}px<br/>
                Portrait CR80 @ 300 DPI
              </p>
            </div>
            
             <button onClick={() => setShowCutLines(!showCutLines)} className={`w-full p-4 rounded-2xl border-2 border-slate-200 flex items-center gap-4 ${showCutLines ? 'border-teal-500 bg-teal-50' : ''}`}>
                <Scissors size={20} className={showCutLines ? 'text-teal-500' : 'text-slate-400'} />
                <span className="text-xs font-bold uppercase">Cut Lines</span>
             </button>
             
             <button onClick={() => setMirrorBack(!mirrorBack)} className={`w-full p-4 rounded-2xl border-2 border-slate-200 flex items-center gap-4 ${mirrorBack ? 'border-teal-500 bg-teal-50' : ''}`}>
                <FlipHorizontal size={20} className={mirrorBack ? 'text-teal-500' : 'text-slate-400'} />
                <span className="text-xs font-bold uppercase">Mirror Back</span>
             </button>
          </div>
          <div className="space-y-3">
            <button onClick={handleDownloadImages} className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black uppercase hover:bg-blue-600">
              <Download size={20} className="inline mr-2"/> Download Images
            </button>
            <button onClick={() => handleSilentPrint(data.id)} className="w-full py-4 bg-teal-500 text-slate-950 rounded-2xl font-black uppercase hover:bg-teal-600">
              <Printer size={20} className="inline mr-2"/> Print Now
            </button>
            <button onClick={onClose} className="w-full py-3 text-slate-400 font-black uppercase text-[10px]">Close</button>
          </div>
        </div>

        {/* SCREEN PREVIEW AREA */}
        <div className="flex-1 bg-slate-200 dark:bg-slate-950 overflow-y-auto preview-scroll-container screen-only">
            <div className={`screen-card-wrapper ${showCutLines ? 'cut-guide-border' : ''}`}>
              <IDCardPreview data={data} layout={layout} side="FRONT" scale={0.67} isPrinting={false} />
            </div>
            <div className={`screen-card-wrapper ${showCutLines ? 'cut-guide-border' : ''}`} style={{ transform: mirrorBack ? 'scaleX(-1)' : 'none' }}>
              <IDCardPreview data={data} layout={layout} side="BACK" scale={0.67} isPrinting={false} />
            </div>
        </div>
      </div>

      {/* HIDDEN HIGH-RES CANVAS FOR EXPORT */}
      <div className="hidden-canvas">
        <div id="front-print-stage">
          <IDCardPreview 
            data={data} 
            layout={layout} 
            side="FRONT" 
            scale={1} 
            isPrinting={true} 
          />
        </div>
        
        <div id="back-print-stage">
          <IDCardPreview 
            data={data} 
            layout={layout} 
            side="BACK" 
            scale={1} 
            isPrinting={true} 
          />
        </div>
      </div>

      {/* PRINT AREA (Fallback for Ctrl+P) */}
      <div id="print-root" className="print-only">
        <div className="print-page">
          <IDCardPreview 
            data={data} 
            layout={layout} 
            side="FRONT" 
            scale={1} 
            isPrinting={true} 
          />
        </div>

        <div className="print-page" style={{ transform: mirrorBack ? 'scaleX(-1)' : 'none' }}>
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
  );
};

export default PrintPreviewModal;