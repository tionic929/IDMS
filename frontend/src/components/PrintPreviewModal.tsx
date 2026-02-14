import React, { useRef, useState, useEffect } from 'react';
import { 
  Printer, Scissors, FlipHorizontal, Download, 
  Settings, X, ZoomIn, ZoomOut, Info
} from 'lucide-react';
import IDCardPreview from './IDCardPreview';
import { type ApplicantCard } from '../types/card';
import { toast } from 'react-toastify';
import { confirmApplicant } from '../api/students';
import { 
  PRINT_WIDTH, 
  PRINT_HEIGHT 
} from '../constants/dimensions';

interface PrintModalProps {
  data: ApplicantCard;
  layout: any;
  onClose: () => void;
}

interface ExtendedWindow extends Window {
  process?: {
    type?: string;
  };
  versions?: {
    electron?: string;
  };
}

const PrintPreviewModal: React.FC<PrintModalProps> = ({ data, layout, onClose }) => {
  const [zoom, setZoom] = useState(1.2);
  const [showCutLines, setShowCutLines] = useState(false);
  const [mirrorBack, setMirrorBack] = useState(false);
  const [frontImage, setFrontImage] = useState<string>('');
  const [backImage, setBackImage] = useState<string>('');
  const [isGeneratingImages, setIsGeneratingImages] = useState(true);
  
  // Margin Settings in pixels [cite: 1]
  const [marginTop, setMarginTop] = useState(0);
  const [marginBottom, setMarginBottom] = useState(0);
  const [marginLeft, setMarginLeft] = useState(0);
  const [marginRight, setMarginRight] = useState(0);

  // Margin presets for quick adjustment [cite: 1]
  const marginPresets = [
    { label: 'None', values: { top: 0, bottom: 0, left: 0, right: 0 } },
    { label: '5px', values: { top: 5, bottom: 5, left: 5, right: 5 } },
    { label: '10px', values: { top: 10, bottom: 10, left: 10, right: 10 } },
    { label: '15px', values: { top: 15, bottom: 15, left: 15, right: 15 } },
  ];

  const applyMarginPreset = (preset: typeof marginPresets[0]) => {
    setMarginTop(preset.values.top);
    setMarginBottom(preset.values.bottom);
    setMarginLeft(preset.values.left);
    setMarginRight(preset.values.right);
  };

  // Capture high-res images from hidden canvas stages 
  useEffect(() => {
    setIsGeneratingImages(true);
    const timer = setTimeout(() => {
      const frontCanvas = document.querySelector('#front-print-stage canvas') as HTMLCanvasElement;
      const backCanvas = document.querySelector('#back-print-stage canvas') as HTMLCanvasElement;

      if (frontCanvas) {
        setFrontImage(frontCanvas.toDataURL('image/png', 1.0));
      }
      if (backCanvas) {
        setBackImage(backCanvas.toDataURL('image/png', 1.0));
      }
      setIsGeneratingImages(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [data, layout]);

  const handleDownloadImages = () => {
    if (!frontImage || !backImage) {
      toast.error('Images not ready. Please wait...');
      return;
    }

    const frontLink = document.createElement('a');
    frontLink.download = `${data.idNumber}_FRONT.png`;
    frontLink.href = frontImage;
    frontLink.click();

    setTimeout(() => {
      const backLink = document.createElement('a');
      backLink.download = `${data.idNumber}_BACK.png`;
      backLink.href = backImage;
      backLink.click();
    }, 300);

    toast.success('High-resolution images downloaded!');
  };

  const handleSilentPrint = async () => {
    if (!frontImage || !backImage) {
      toast.error('Images still processing...');
      return;
    }

    // Check for Electron IPC availability [cite: 1]
    const checkIsElectron = () => {
      const win = window as ExtendedWindow;
      return !!(win.process && win.process.type) || !!(win.navigator && win.navigator.userAgent.includes('Electron'));
    };

    const isElectron = checkIsElectron();
    const hasRequire = typeof (window as any).require !== 'undefined';

    if (hasRequire || isElectron) {
      try {
        await confirmApplicant(data.id);
        
        // Use window.require to get the Electron IPC [cite: 1]
        const electron = (window as any).require('electron');
        const ipcRenderer = electron.ipcRenderer;

        toast.info('Sending to local printer service...');
        
        ipcRenderer.send('print-card-images', {
          frontImage,
          backImage,
          width: PRINT_WIDTH,
          height: PRINT_HEIGHT,
          margins: {
            top: marginTop,
            bottom: marginBottom,
            left: marginLeft,
            right: marginRight,
          },
        });

        // Listen for the response from main.cjs [cite: 1, 3]
        ipcRenderer.once('print-reply', (_event: any, arg: any) => {
          if (arg.success) {
            toast.success('Print job completed successfully!');
            setTimeout(onClose, 1500);
          } else {
            toast.error(`Print failed: ${arg.failureReason}`);
          }
        });

      } catch (err) {
        console.error('Print error:', err);
        toast.error('Local printing failed. The Python service might be busy.');
      }
    } else {
      // Fallback for regular web browsers
      toast.warn("Silent printing requires the Desktop App. Opening browser print...");
      window.print();
    }
  };

  const totalWidth = PRINT_WIDTH + marginLeft + marginRight;
  const totalHeight = PRINT_HEIGHT + marginTop + marginBottom;

  return (
    <>
      {/* Print-Specific Global Styles [cite: 1] */}
      <style>{`
        @media print {
          @page { 
            margin: 0; 
            size: 2.125in 3.375in portrait;
          }
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
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
            page-break-inside: avoid !important;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .print-page:last-child {
            page-break-after: auto !important;
          }
        }

        .hidden-canvas {
          position: absolute;
          left: -9999px;
          top: -9999px;
          pointer-events: none;
        }

        .blueprint-grid {
          background-color: #0f172a;
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(100, 116, 139, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100, 116, 139, 0.1) 1px, transparent 1px);
        }

        .cut-guides {
          position: relative;
        }

        .cut-guides::before {
          content: '';
          position: absolute;
          inset: -12px;
          border: 2px dashed #14b8a6;
          border-radius: 4px;
          pointer-events: none;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>

      {/* Modal Container */}
      <div className="fixed inset-0 z-[100] flex bg-slate-950 text-slate-200 overflow-hidden">
        
        {/* Left Sidebar - Controls */}
        <aside className="w-[30vw] h-full bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 shadow-2xl">
          
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Print Settings</h2>
              <p className="text-xs text-slate-400 mt-0.5">{data.idNumber}</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {/* Zoom Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Preview Zoom
                </span>
                <span className="text-sm font-mono font-semibold text-teal-400">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ZoomOut size={14} className="text-slate-400" />
                </button>
                <input 
                  type="range" 
                  min="0.3" 
                  max="1.5" 
                  step="0.1" 
                  value={zoom} 
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <button
                  onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ZoomIn size={14} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Display Options */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Display Options
              </p>
              <div className="flex flex-row gap-4">
                <button
                  onClick={() => setShowCutLines(!showCutLines)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    showCutLines ? 'border-teal-500 bg-teal-500/10' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Scissors size={16} className={showCutLines ? 'text-teal-400' : 'text-slate-400'} />
                    <span className="text-sm font-medium">Cut Guides</span>
                  </div>
                </button>
                <button
                  onClick={() => setMirrorBack(!mirrorBack)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    mirrorBack ? 'border-teal-500 bg-teal-500/10' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FlipHorizontal size={16} className={mirrorBack ? 'text-teal-400' : 'text-slate-400'} />
                    <span className="text-sm font-medium">Mirror Back</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Margin Settings [cite: 1] */}
            <div className="space-y-3">
              <span className='flex flex-row justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider'>
                Margin Settings
                <Settings size={14} className='text-slate-500' />
              </span>
              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {marginPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => applyMarginPreset(preset)}
                      className="py-2 px-3 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {[
                  { label: 'Top', value: marginTop, setter: setMarginTop },
                  { label: 'Right', value: marginRight, setter: setMarginRight },
                  { label: 'Bottom', value: marginBottom, setter: setMarginBottom },
                  { label: 'Left', value: marginLeft, setter: setMarginLeft }
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-400">{label}</span>
                      <span className="font-semibold text-teal-400">{value}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      value={value} 
                      onChange={(e) => setter(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Output Info [cite: 1] */}
            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Info size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Output Specs
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Resolution:</span>
                  <span className="font-mono text-slate-300">{PRINT_WIDTH}×{PRINT_HEIGHT}px</span>
                </div>
                <div className="flex justify-between">
                  <span>DPI:</span>
                  <span className="font-mono text-slate-300">300</span>
                </div>
                {(marginTop + marginBottom + marginLeft + marginRight) > 0 && (
                  <div className="flex justify-between pt-2 border-t border-indigo-500/20">
                    <span>With Margins:</span>
                    <span className="font-mono text-slate-300">{totalWidth}×{totalHeight}px</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-950 border-t border-slate-800 space-y-3">
            <button 
              onClick={handleDownloadImages}
              disabled={isGeneratingImages}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Download size={16} />
              {isGeneratingImages ? 'Processing...' : 'Download Images'}
            </button>
            <button 
              onClick={handleSilentPrint}
              disabled={isGeneratingImages}
              className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <Printer size={16} />
              {isGeneratingImages ? 'Processing...' : 'Print Cards'}
            </button>
          </div>
        </aside>

        {/* Main Viewport  */}
        <main className="flex-1 blueprint-grid relative flex items-center justify-center overflow-auto p-12 custom-scrollbar">
          <div 
            className="flex flex-col xl:flex-row gap-12 transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`shadow-2xl rounded-sm overflow-hidden ${showCutLines ? 'cut-guides' : ''}`}>
                <IDCardPreview 
                  data={data} 
                  layout={layout} 
                  side="FRONT" 
                  scale={1} 
                  isPrinting={false} 
                />
              </div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Front Side</span>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div 
                className={`shadow-2xl rounded-sm overflow-hidden ${showCutLines ? 'cut-guides' : ''}`}
                style={{ transform: mirrorBack ? 'scaleX(-1)' : 'none' }}
              >
                <IDCardPreview 
                  data={data} 
                  layout={layout} 
                  side="BACK" 
                  scale={1} 
                  isPrinting={false} 
                />
              </div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Back Side</span>
            </div>
          </div>
        </main>
      </div>

      {/* Hidden Canvas - Used to capture full 300 DPI images  */}
      <div className="hidden-canvas">
        <div id="front-print-stage">
          <IDCardPreview data={data} layout={layout} side="FRONT" scale={1} isPrinting={true} />
        </div>
        <div id="back-print-stage">
          <IDCardPreview data={data} layout={layout} side="BACK" scale={1} isPrinting={true} />
        </div>
      </div>

      {/* Print-Only Content for window.print() fallback [cite: 1] */}
      <div id="print-root" className="print-only">
        <div className="print-page">
          <IDCardPreview data={data} layout={layout} side="FRONT" scale={1} isPrinting={true} />
        </div>
        <div className="print-page" style={{ transform: mirrorBack ? 'scaleX(-1)' : 'none' }}>
          <IDCardPreview data={data} layout={layout} side="BACK" scale={1} isPrinting={true} />
        </div>
      </div>
    </>
  );
};

export default PrintPreviewModal;