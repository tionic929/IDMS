import React, { useRef, useState, useEffect } from 'react';
import {
  Printer, Scissors, FlipHorizontal, Download,
  Settings, X, ZoomIn, ZoomOut, Info, Receipt, Loader2, Mail
} from 'lucide-react';
import IDCardPreview from './IDCardPreview';
import { Button } from './ui/button';
import api from '../api/axios';
import { type ApplicantCard } from '../types/card';
import { Suspense, lazy } from 'react';

const PaymentProofModal = lazy(() => import('./PaymentProofModal'));
import { toast } from 'react-toastify';
import { confirmApplicant } from '../api/students';
import {
  PRINT_WIDTH,
  PRINT_HEIGHT,
  EXPORT_PIXEL_RATIO
} from '../constants/dimensions';

interface PrintModalProps {
  data: ApplicantCard;
  layout: any;
  onClose: () => void;
}

interface ExtendedWindow extends Window {
  process?: { type?: string };
  versions?: { electron?: string };
}

const PrintPreviewModal: React.FC<PrintModalProps> = ({ data, layout, onClose }) => {
  const [zoom, setZoom] = useState(1.2);
  const [showCutLines, setShowCutLines] = useState(false);
  const [mirrorBack, setMirrorBack] = useState(false);
  const [frontImage, setFrontImage] = useState<string>('');
  const [backImage, setBackImage] = useState<string>('');
  const [isGeneratingImages, setIsGeneratingImages] = useState(true);
  const [viewingPaymentProof, setViewingPaymentProof] = useState<string | null>(null);

  const frontStageRef = useRef<any>(null);
  const backStageRef = useRef<any>(null);

  // Margin settings
  const [marginTop, setMarginTop] = useState(0);
  const [marginBottom, setMarginBottom] = useState(0);
  const [marginLeft, setMarginLeft] = useState(0);
  const [marginRight, setMarginRight] = useState(0);

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

  // ── Capture high-res PNGs from the hidden Konva stage ────────────────────
  useEffect(() => {
    setIsGeneratingImages(true);
    const timer = setTimeout(() => {
      try {
        if (frontStageRef.current) {
          setFrontImage(
            frontStageRef.current.toDataURL({
              pixelRatio: EXPORT_PIXEL_RATIO,
              mimeType: 'image/png',
              quality: 1,
            })
          );
        }
        if (backStageRef.current) {
          setBackImage(
            backStageRef.current.toDataURL({
              pixelRatio: EXPORT_PIXEL_RATIO,
              mimeType: 'image/png',
              quality: 1,
            })
          );
        }
      } catch (err) {
        console.error('PrintPreviewModal: failed to capture stage images', err);
        toast.error('Image generation failed — check console.');
      }
      setIsGeneratingImages(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [data, layout]);

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownloadImages = async () => {
    if (!frontImage || !backImage) {
      toast.error('Images not ready. Please wait...');
      return;
    }

    try {
      const combined = await createCombinedImage(frontImage, backImage);
      const a = document.createElement('a');
      a.download = `${data.idNumber}_ID_CARD.png`;
      a.href = combined;
      a.click();
      toast.success('High-resolution combined image downloaded!');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to generate combined image.');
    }
  };

  const createCombinedImage = (front: string, back: string, scale: number = 1.0, mimeType: string = 'image/png'): Promise<string> => {
    return new Promise((resolve, reject) => {
      const imgFront = new Image();
      const imgBack = new Image();
      let loadedCount = 0;

      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          const targetWidth = (imgFront.width + imgBack.width) * scale;
          const targetHeight = Math.max(imgFront.height, imgBack.height) * scale;

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          ctx.drawImage(imgFront, 0, 0, imgFront.width * scale, imgFront.height * scale);
          ctx.drawImage(imgBack, imgFront.width * scale, 0, imgBack.width * scale, imgBack.height * scale);

          resolve(canvas.toDataURL(mimeType, mimeType === 'image/jpeg' ? 0.7 : 1.0));
        }
      };

      imgFront.onload = onImageLoad;
      imgBack.onload = onImageLoad;
      imgFront.onerror = () => reject(new Error('Failed to load front image'));
      imgBack.onerror = () => reject(new Error('Failed to load back image'));
      imgFront.src = front;
      imgBack.src = back;
    });
  };

  // ── Browser / Electron print ──────────────────────────────────────────────
  const handleSilentPrint = async () => {
    if (!frontImage || !backImage) {
      toast.error('Images still processing...');
      return;
    }

    // New flow: Download -> Email -> Print
    handleDownloadImages();
    await sendSoftcopyEmail();

    const checkIsElectron = () => {
      const win = window as ExtendedWindow;
      return !!(win.process?.type) || !!navigator.userAgent.includes('Electron');
    };

    const isElectron = checkIsElectron();
    const hasRequire = typeof (window as any).require !== 'undefined';

    if (hasRequire || isElectron) {
      try {
        await confirmApplicant(data.id);
        const { ipcRenderer } = (window as any).require('electron');

        toast.info('Sending to local printer service...');
        ipcRenderer.send('print-card-images', {
          frontImage,
          backImage,
          width: PRINT_WIDTH,
          height: PRINT_HEIGHT,
          margins: { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight },
        });

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
      if (window.confirm('Mark as ISSUED and open print dialog?')) {
        try {
          await confirmApplicant(data.id);
          toast.warn('Silent printing requires the Desktop App. Opening browser print...');
          window.print();
        } catch {
          toast.error('Failed to confirm issuance.');
        }
      }
    }
  };

  // ── Email ─────────────────────────────────────────────────────────────────
  const sendSoftcopyEmail = async () => {
    const recipientEmail = (data as any).email || '';

    if (!recipientEmail) {
      toast.error('Applicant email is missing! Cannot send softcopy.');
      return;
    }

    try {
      toast.info('Preparing high-quality softcopy...');

      // Generate the combined full-resolution image for the backend
      const combinedImage = await createCombinedImage(frontImage, backImage, 1.0, 'image/png');

      toast.info('Sending softcopy via backend...');
      await api.post('/send-softcopy-email', {
        email: recipientEmail,
        student_name: data.fullName,
        image_data: combinedImage
      });
      
      toast.success('Softcopy email sent successfully!');
    } catch (err) {
      console.error('Email Error:', err);
      toast.error('Failed to send softcopy email.');
    }
  };

  const totalWidth = PRINT_WIDTH + marginLeft + marginRight;
  const totalHeight = PRINT_HEIGHT + marginTop + marginBottom;

  return (
    <>
      <style>{`
@media print {
    @page {
        margin: 0;
        size: ${PRINT_WIDTH}px ${PRINT_HEIGHT}px;
    }

    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
    }

    html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
    }

    body > * { display: none !important; }
    #print-root { display: flex !important; }

    #print-root {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0;
        background: white;
    }

    .print-page {
        width: ${PRINT_WIDTH}px !important;
        height: ${PRINT_HEIGHT}px !important;
        page-break-after: always !important;
        page-break-inside: avoid !important;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: white;
    }

    .print-page:last-child {
        page-break-after: auto !important;
    }

    .print-page img {
        width: ${PRINT_WIDTH}px !important;
        height: ${PRINT_HEIGHT}px !important;
        display: block;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
    }
}

.hidden-canvas {
    position: absolute;
    left: -99999px;
    top: -99999px;
    pointer-events: none;
    visibility: hidden;
}

.blueprint-grid {
    background-color: #0f172a;
    background-size: 30px 30px;
    background-image:
        linear-gradient(to right,  rgba(100, 116, 139, 0.1) 1px, transparent 1px),
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

.custom-scrollbar::-webkit-scrollbar       { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
`}</style>

      <div className="fixed inset-0 z-[100] flex bg-background text-foreground overflow-hidden">
        <aside className="w-[30vw] h-full bg-card border-r border-border flex flex-col shrink-0 shadow-xl">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Print Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{data.idNumber}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-md transition-colors">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Preview Zoom
                </span>
                <span className="text-sm font-mono font-semibold text-primary">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setZoom(p => Math.max(0.3, +(p - 0.1).toFixed(1)))}
                  className="p-2 hover:bg-accent rounded-lg transition-colors">
                  <ZoomOut size={14} className="text-muted-foreground" />
                </button>
                <input type="range" min="0.3" max="1.5" step="0.1" value={zoom}
                  onChange={e => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <button onClick={() => setZoom(p => Math.min(1.5, +(p + 0.1).toFixed(1)))}
                  className="p-2 hover:bg-accent rounded-lg transition-colors">
                  <ZoomIn size={14} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Display Options
              </p>
              <div className="flex flex-row gap-4">
                <button
                  onClick={() => setShowCutLines(p => !p)}
                  className={`flex-1 flex items-center justify-between p-3 rounded-lg border-2 transition-all ${showCutLines ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Scissors size={16} className={showCutLines ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="text-sm font-medium">Cut Guides</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${showCutLines ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                </button>
                <button
                  onClick={() => setMirrorBack(p => !p)}
                  className={`flex-1 flex items-center justify-between p-3 rounded-lg border-2 transition-all ${mirrorBack ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <FlipHorizontal size={16} className={mirrorBack ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="text-sm font-medium">Mirror Back</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${mirrorBack ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <span className="flex flex-row justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Margin Settings
                <Settings size={14} className="text-muted-foreground/50" />
              </span>
              <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {marginPresets.map(preset => (
                    <button key={preset.label} onClick={() => applyMarginPreset(preset)}
                      className="py-2 px-3 text-xs font-medium bg-secondary hover:bg-accent rounded-lg transition-colors">
                      {preset.label}
                    </button>
                  ))}
                </div>
                {[
                  { label: 'Top', value: marginTop, setter: setMarginTop },
                  { label: 'Right', value: marginRight, setter: setMarginRight },
                  { label: 'Bottom', value: marginBottom, setter: setMarginBottom },
                  { label: 'Left', value: marginLeft, setter: setMarginLeft },
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-muted-foreground">{label}</span>
                      <span className="font-semibold text-primary">{value}px</span>
                    </div>
                    <input type="range" min="0" max="50" value={value}
                      onChange={e => setter(Number(e.target.value))}
                      className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Info size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider">Output Specs</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Resolution:</span>
                  <span className="font-mono text-foreground/80">{PRINT_WIDTH}×{PRINT_HEIGHT}px</span>
                </div>
                <div className="flex justify-between">
                  <span>Pixel Ratio:</span>
                  <span className="font-mono text-foreground/80">{EXPORT_PIXEL_RATIO}×</span>
                </div>
                <div className="flex justify-between">
                  <span>DPI:</span>
                  <span className="font-mono text-foreground/80">300</span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="font-mono text-foreground/80">CR80 (PNG)</span>
                </div>
                {(marginTop + marginBottom + marginLeft + marginRight) > 0 && (
                  <div className="flex justify-between pt-2 border-t border-primary/10">
                    <span>With Margins:</span>
                    <span className="font-mono text-foreground/80">{totalWidth}×{totalHeight}px</span>
                  </div>
                )}
              </div>
            </div>

            {isGeneratingImages && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <Loader2 size={14} className="animate-spin shrink-0" />
                <span className="text-xs font-semibold">Rendering high-res images…</span>
              </div>
            )}
            {!isGeneratingImages && frontImage && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-semibold">Images ready — full colour PNG</span>
              </div>
            )}
          </div>

          <div className="p-6 bg-muted/50 border-t border-border space-y-3">
            <button onClick={handleDownloadImages} disabled={isGeneratingImages}
              className="w-full py-2.5 px-4 bg-secondary hover:bg-accent text-foreground rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Download size={14} />
              {isGeneratingImages ? 'Processing…' : 'Download PNG'}
            </button>
            <button onClick={handleSilentPrint} disabled={isGeneratingImages}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
              <Printer size={16} />
              {isGeneratingImages ? 'Processing…' : 'Print Cards'}
            </button>
            {data.paymentProof && (
              <button onClick={() => setViewingPaymentProof(data.paymentProof || null)}
                className="w-full mt-2 py-2.5 px-4 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                <Receipt size={14} />
                View Payment Proof
              </button>
            )}
          </div>
        </aside>

        <main className="flex-1 blueprint-grid relative flex items-center justify-center overflow-auto p-12 custom-scrollbar">
          <div
            className="flex flex-col xl:flex-row gap-10 transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`shadow-2xl rounded-sm overflow-hidden ${showCutLines ? 'cut-guides' : ''}`}>
                <IDCardPreview data={data} layout={layout} side="FRONT" scale={1} isPrinting={false} />
              </div>
              <div className="px-6 py-1.5 rounded-full bg-muted border border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Front Side</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div
                className={`shadow-2xl rounded-sm overflow-hidden ${showCutLines ? 'cut-guides' : ''}`}
                style={{ transform: mirrorBack ? 'scaleX(-1)' : 'none' }}
              >
                <IDCardPreview data={data} layout={layout} side="BACK" scale={1} isPrinting={false} />
              </div>
              <div className="px-6 py-1.5 rounded-full bg-muted border border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Back Side</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="hidden-canvas" aria-hidden="true">
        <div id="front-print-stage">
          <IDCardPreview
            ref={frontStageRef}
            data={data}
            layout={layout}
            side="FRONT"
            scale={1}
            isPrinting={true}
          />
        </div>
        <div id="back-print-stage">
          <IDCardPreview
            ref={backStageRef}
            data={data}
            layout={layout}
            side="BACK"
            scale={1}
            isPrinting={true}
          />
        </div>
      </div>

      <div id="print-root" style={{ display: 'none' }}>
        <div
          className="print-page"
          style={{
            paddingTop: marginTop,
            paddingBottom: marginBottom,
            paddingLeft: marginLeft,
            paddingRight: marginRight,
          }}
        >
          {frontImage && (
            <img
              src={frontImage}
              alt="Front card"
              width={PRINT_WIDTH}
              height={PRINT_HEIGHT}
              style={{ display: 'block', width: PRINT_WIDTH, height: PRINT_HEIGHT }}
            />
          )}
        </div>
        <div
          className="print-page"
          style={{
            paddingTop: marginTop,
            paddingBottom: marginBottom,
            paddingLeft: marginLeft,
            paddingRight: marginRight,
            transform: mirrorBack ? 'scaleX(-1)' : 'none',
          }}
        >
          {backImage && (
            <img
              src={backImage}
              alt="Back card"
              width={PRINT_WIDTH}
              height={PRINT_HEIGHT}
              style={{ display: 'block', width: PRINT_WIDTH, height: PRINT_HEIGHT }}
            />
          )}
        </div>
      </div>

      {viewingPaymentProof && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center">
            <Loader2 className="animate-spin text-white" size={48} />
          </div>
        }>
          <PaymentProofModal url={viewingPaymentProof} onClose={() => setViewingPaymentProof(null)} />
        </Suspense>
      )}
    </>
  );
};

export default PrintPreviewModal;