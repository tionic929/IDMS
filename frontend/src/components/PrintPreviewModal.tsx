import React, { useRef, useState, useEffect } from 'react';
import { Printer, Scissors, FlipHorizontal, Download, Settings } from 'lucide-react';
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

const PrintPreviewModal: React.FC<PrintModalProps> = ({ data, layout, onClose }) => {
  const [showCutLines, setShowCutLines] = useState(false);
  const [mirrorBack, setMirrorBack] = useState(false);
  const [frontImage, setFrontImage] = useState<string>('');
  const [backImage, setBackImage] = useState<string>('');
  
  // ============================================================
  // MARGIN SETTINGS
  // ============================================================
  const [showMarginSettings, setShowMarginSettings] = useState(false);
  const [marginTop, setMarginTop] = useState(0);
  const [marginBottom, setMarginBottom] = useState(0);
  const [marginLeft, setMarginLeft] = useState(0);
  const [marginRight, setMarginRight] = useState(0);

  // Preset margin profiles
  const marginPresets = {
    none: { top: 0, bottom: 0, left: 0, right: 0 },
    small: { top: 5, bottom: 5, left: 5, right: 5 },
    medium: { top: 10, bottom: 10, left: 10, right: 10 },
    large: { top: 15, bottom: 15, left: 15, right: 15 },
  };

  const applyMarginPreset = (preset: keyof typeof marginPresets) => {
    const margins = marginPresets[preset];
    setMarginTop(margins.top);
    setMarginBottom(margins.bottom);
    setMarginLeft(margins.left);
    setMarginRight(margins.right);
  };

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
    }, 800);

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

  const handleSilentPrint = async () => {
    if (!frontImage || !backImage) {
      toast.error('Card images not ready yet.');
      return;
    }

    if (window.require) {
      try {
        await confirmApplicant(data.id);
        toast.success('Confirmed & Marked as printed.');

        const { ipcRenderer } = window.require('electron');
        toast.info('Sending job to printer...');

        ipcRenderer.send('print-card-images', {
          frontImage,
          backImage,
          width: PRINT_WIDTH,
          height: PRINT_HEIGHT,
          // Send margin settings to printer script
          margins: {
            top: marginTop,
            bottom: marginBottom,
            left: marginLeft,
            right: marginRight,
          },
        });

        ipcRenderer.once('print-reply', (_event, arg) => {
          if (arg.success) toast.success('Printed successfully!');
          else toast.error(`Error: ${arg.failureReason}`);
        });

      } catch (err) {
        console.error('IPC Error:', err);
        toast.error('Printing failed. Try "Download Images" instead.');
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4">
      <style>{`
        @media print {
          @page { margin: 0; }
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
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .no-print, .screen-only { display: none !important; }
        }

        @media screen {
          .print-only { display: none !important; }
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
        <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800 p-8 border-r border-slate-200 dark:border-slate-700 flex flex-col gap-6">
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">
              Print<span className="text-teal-500">Center</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2">CX-D80 U1</p>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-600 mb-2">Output Settings</p>
              <p className="text-xs text-slate-500">
                {PRINT_WIDTH} × {PRINT_HEIGHT}px<br />
                Portrait CR80 @ 300 DPI
              </p>
            </div>

            {/* Margin Settings Section */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200">
              <button
                onClick={() => setShowMarginSettings(!showMarginSettings)}
                className="w-full flex items-center justify-between mb-3"
              >
                <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
                  <Settings size={14} /> Margin Settings
                </p>
                <span className="text-slate-400">{showMarginSettings ? '▼' : '▶'}</span>
              </button>

              {showMarginSettings && (
                <div className="space-y-3">
                  {/* Preset Buttons */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Presets</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => applyMarginPreset('none')}
                        className="py-2 px-2 text-[9px] font-bold bg-slate-200 dark:bg-slate-700 rounded hover:bg-teal-400 dark:hover:bg-teal-600 transition"
                      >
                        No Margin
                      </button>
                      <button
                        onClick={() => applyMarginPreset('small')}
                        className="py-2 px-2 text-[9px] font-bold bg-slate-200 dark:bg-slate-700 rounded hover:bg-teal-400 dark:hover:bg-teal-600 transition"
                      >
                        5px
                      </button>
                      <button
                        onClick={() => applyMarginPreset('medium')}
                        className="py-2 px-2 text-[9px] font-bold bg-slate-200 dark:bg-slate-700 rounded hover:bg-teal-400 dark:hover:bg-teal-600 transition"
                      >
                        10px
                      </button>
                      <button
                        onClick={() => applyMarginPreset('large')}
                        className="py-2 px-2 text-[9px] font-bold bg-slate-200 dark:bg-slate-700 rounded hover:bg-teal-400 dark:hover:bg-teal-600 transition"
                      >
                        15px
                      </button>
                    </div>
                  </div>

                  {/* Individual Margin Controls */}
                  <div className="space-y-2 pt-2 border-t border-slate-300 dark:border-slate-600">
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Custom</p>

                    {/* Top Margin */}
                    <div>
                      <label className="text-[9px] text-slate-600 block mb-1">
                        Top: {marginTop}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={marginTop}
                        onChange={(e) => setMarginTop(Number(e.target.value))}
                        className="w-full h-1 bg-slate-300 rounded cursor-pointer"
                      />
                    </div>

                    {/* Bottom Margin */}
                    <div>
                      <label className="text-[9px] text-slate-600 block mb-1">
                        Bottom: {marginBottom}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={marginBottom}
                        onChange={(e) => setMarginBottom(Number(e.target.value))}
                        className="w-full h-1 bg-slate-300 rounded cursor-pointer"
                      />
                    </div>

                    {/* Left Margin */}
                    <div>
                      <label className="text-[9px] text-slate-600 block mb-1">
                        Left: {marginLeft}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={marginLeft}
                        onChange={(e) => setMarginLeft(Number(e.target.value))}
                        className="w-full h-1 bg-slate-300 rounded cursor-pointer"
                      />
                    </div>

                    {/* Right Margin */}
                    <div>
                      <label className="text-[9px] text-slate-600 block mb-1">
                        Right: {marginRight}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={marginRight}
                        onChange={(e) => setMarginRight(Number(e.target.value))}
                        className="w-full h-1 bg-slate-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Margin Info */}
                  <div className="pt-2 border-t border-slate-300 dark:border-slate-600">
                    <p className="text-[9px] text-slate-500">
                      Total size with margins:<br />
                      {PRINT_WIDTH + marginLeft + marginRight} × {PRINT_HEIGHT + marginTop + marginBottom}px
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCutLines(!showCutLines)}
              className={`w-full p-4 rounded-2xl border-2 border-slate-200 flex items-center gap-4 ${
                showCutLines ? 'border-teal-500 bg-teal-50' : ''
              }`}
            >
              <Scissors size={20} className={showCutLines ? 'text-teal-500' : 'text-slate-400'} />
              <span className="text-xs font-bold uppercase">Cut Lines</span>
            </button>

            <button
              onClick={() => setMirrorBack(!mirrorBack)}
              className={`w-full p-4 rounded-2xl border-2 border-slate-200 flex items-center gap-4 ${
                mirrorBack ? 'border-teal-500 bg-teal-50' : ''
              }`}
            >
              <FlipHorizontal size={20} className={mirrorBack ? 'text-teal-500' : 'text-slate-400'} />
              <span className="text-xs font-bold uppercase">Mirror Back</span>
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDownloadImages}
              className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black uppercase hover:bg-blue-600 transition"
            >
              <Download size={20} className="inline mr-2" /> Download Images
            </button>

            <button
              onClick={() => handleSilentPrint()}
              className="w-full py-4 bg-teal-500 text-slate-950 rounded-2xl font-black uppercase hover:bg-teal-600 transition"
            >
              <Printer size={20} className="inline mr-2" /> Print Now
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 text-slate-400 font-black uppercase text-[10px] hover:text-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-200 dark:bg-slate-950 overflow-y-auto preview-scroll-container screen-only">
          <div className={`screen-card-wrapper ${showCutLines ? 'cut-guide-border' : ''}`}>
            <IDCardPreview data={data} layout={layout} side="FRONT" scale={0.67} isPrinting={false} />
          </div>

          <div
            className={`screen-card-wrapper ${showCutLines ? 'cut-guide-border' : ''}`}
            style={{ transform: mirrorBack ? 'scaleX(-1)' : 'none' }}
          >
            <IDCardPreview data={data} layout={layout} side="BACK" scale={0.67} isPrinting={false} />
          </div>
        </div>
      </div>

      <div className="hidden-canvas">
        <div id="front-print-stage">
          <IDCardPreview data={data} layout={layout} side="FRONT" scale={1} isPrinting={true} />
        </div>

        <div id="back-print-stage">
          <IDCardPreview data={data} layout={layout} side="BACK" scale={1} isPrinting={true} />
        </div>
      </div>

      <div id="print-root" className="print-only">
        <div className="print-page">
          <IDCardPreview data={data} layout={layout} side="FRONT" scale={1} isPrinting={true} />
        </div>

        <div className="print-page" style={{ transform: mirrorBack ? 'scaleX(-1)' : 'none' }}>
          <IDCardPreview data={data} layout={layout} side="BACK" scale={1} isPrinting={true} />
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewModal;