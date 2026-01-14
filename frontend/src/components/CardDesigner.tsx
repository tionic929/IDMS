import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage, Group, Transformer } from 'react-konva';
import useImage from 'use-image';
import { RefreshCw, Save, Square, Type, ZoomIn, ZoomOut, Layers, MousePointer2, Download } from 'lucide-react';

import FRONT_BG from '../assets/ID/NEWFRONT.png';
import BACK_BG from '../assets/ID/BACK.png';
import { type Students } from '../types/students';

const VITE_API_URL = import.meta.env.VITE_API_URL;

const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 500;

interface CardDesignerProps {
  onSave: (newLayout: any) => void;
  currentLayout: any;
  allStudents: Students[];
}

const CardDesigner: React.FC<CardDesignerProps> = ({
  onSave,
  currentLayout,
  allStudents,
}) => {
  const [editSide, setEditSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [tempLayout, setTempLayout] = useState(currentLayout);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    setTempLayout(currentLayout);
  }, [currentLayout]);

  const latestStudent = useMemo(() => {
    if (!allStudents || !Array.isArray(allStudents)) return null;
    const pending = allStudents.filter(s => !s.has_card);
    return [...pending].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0] || null;
  }, [allStudents]);

  const previewData = useMemo(() => {
    if (!latestStudent) return null;
    const getUrl = (path: string | null) => {
      if (!path) return '';
      return `${VITE_API_URL}/api/proxy-image?path=${path}`;
    };

    return {
      fullName: `${latestStudent.first_name} ${latestStudent.last_name}`,
      idNumber: latestStudent.id_number,
      course: latestStudent.course,
      photo: getUrl(latestStudent.id_picture),
      signature: getUrl(latestStudent.signature_picture),
      guardianName: latestStudent.guardian_name,
    };
  }, [latestStudent]);

  const [bgImage] = useImage(editSide === 'FRONT' ? FRONT_BG : BACK_BG, 'anonymous');
  const [photoImage] = useImage(previewData?.photo || '', 'anonymous');
  const [sigImage] = useImage(previewData?.signature || '', 'anonymous');

  // Helper to get DataURL
  const getStagePNG = () => {
    if (!stageRef.current) return null;
    return stageRef.current.toDataURL({
      pixelRatio: 1 / zoom, 
      mimeType: 'image/png',
      quality: 1,
    });
  };

  const handleExportPNG = () => {
    if (!stageRef.current) return;
    setSelectedId(null);
    setTimeout(() => {
      const dataURL = getStagePNG();
      if (!dataURL) return;
      const link = document.createElement('a');
      link.download = `${previewData?.idNumber || 'ID'}_${editSide}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 50);
  };

  // Restored and updated Save function
  const handleSaveLayout = async () => {
    setIsSaving(true);
    setSelectedId(null);

    const finalLayout = { 
      ...tempLayout, 
      previewImages: { front: '', back: '' } 
    };

    try {
      // Capture Front
      setEditSide('FRONT');
      await new Promise(res => setTimeout(res, 400));
      finalLayout.previewImages.front = getStagePNG();

      // Capture Back
      setEditSide('BACK');
      await new Promise(res => setTimeout(res, 400));
      finalLayout.previewImages.back = getStagePNG();

      onSave(finalLayout);
      setEditSide('FRONT');
    } catch (error) {
      console.error("Rendering failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (selectedId && layerRef.current) {
      const node = layerRef.current.findOne((n: any) => n.name() === selectedId);
      if (node && trRef.current) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selectedId, editSide]);

  const handleDragEnd = (side: string, key: string, e: any) => {
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: {
        ...prev[side],
        [key]: {
          ...prev[side][key],
          x: Math.round(e.target.x()),
          y: Math.round(e.target.y()),
        },
      },
    }));
  };

  const handleTransformEnd = (e: any, key: string) => {
    const node = e.target;
    const side = editSide.toLowerCase();
    const newWidth = Math.max(5, Math.round(node.width() * node.scaleX()));
    const newHeight = Math.max(5, Math.round(node.height() * node.scaleY()));

    setTempLayout((prev: any) => {
      const updatedSide = {
        ...prev[side],
        [key]: {
          ...prev[side][key],
          x: Math.round(node.x()),
          y: Math.round(node.y()),
          width: newWidth,
          height: newHeight,
        },
      };
      if (node.className === 'Text') {
        updatedSide[key].fontSize = Math.round(node.fontSize() * node.scaleX());
      }
      return { ...prev, [side]: updatedSide };
    });
    node.scaleX(1);
    node.scaleY(1);
  };

  return (
    <div className="flex flex-col h-[85vh] bg-slate-50 dark:bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black uppercase italic tracking-tighter">
            Studio<span className="text-teal-500">Editor</span>
          </h2>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['FRONT', 'BACK'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setEditSide(s); setSelectedId(null); }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  editSide === s ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-500' : 'text-slate-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><ZoomOut size={18}/></button>
          <span className="text-xs font-mono text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><ZoomIn size={18}/></button>
          
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />
          
          <button 
            onClick={handleExportPNG}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
          >
            <Download size={14} /> Export PNG
          </button>

          <button onClick={() => setTempLayout(currentLayout)} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-orange-500 transition-colors">
            <RefreshCw size={14} /> Reset
          </button>

          <button 
            onClick={handleSaveLayout} 
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2 bg-teal-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-teal-500/20 transition-all ${isSaving ? 'opacity-70' : 'hover:scale-105 active:scale-95'}`}
          >
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} 
            {isSaving ? 'Rendering...' : 'Save Layout'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Layers size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Layers</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {Object.entries(tempLayout[editSide.toLowerCase()]).map(([key, pos]: any) => (
              <button
                key={key}
                onClick={() => setSelectedId(key)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  selectedId === key ? 'bg-teal-500/10 border-teal-500' : 'bg-slate-50 dark:bg-slate-950 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {key.includes('photo') || key.includes('signature') ? <Square size={12} className="text-teal-500" /> : <Type size={12} className="text-teal-500" />}
                  <span className="text-[10px] font-bold uppercase truncate">{key.replace('_', ' ')}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[8px] font-mono text-slate-400">
                  <span>X: {pos.x}</span>
                  <span>Y: {pos.y}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-10 overflow-auto relative">
          <div 
            className="shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-lg overflow-hidden bg-white" 
            style={{ 
                width: DESIGN_WIDTH * zoom, 
                height: DESIGN_HEIGHT * zoom,
                transition: 'width 0.2s, height 0.2s'
            }}
          >
            <Stage
              ref={stageRef}
              width={DESIGN_WIDTH * zoom}
              height={DESIGN_HEIGHT * zoom}
              scaleX={zoom}
              scaleY={zoom}
              onMouseDown={(e) => e.target === e.target.getStage() && setSelectedId(null)}
            >
              <Layer ref={layerRef}>
                {editSide === 'FRONT' ? (
                  <>
                    <Group
                      name="photo"
                      x={tempLayout.front.photo.x}
                      y={tempLayout.front.photo.y}
                      width={tempLayout.front.photo.width || 200}
                      height={tempLayout.front.photo.height || 180}
                      draggable
                      onDragStart={() => setSelectedId('photo')}
                      onDragEnd={(e) => handleDragEnd('front', 'photo', e)}
                      onTransformEnd={(e) => handleTransformEnd(e, 'photo')}
                      onClick={() => setSelectedId('photo')}
                    >
                      <Rect
                        width={tempLayout.front.photo.width || 200}
                        height={tempLayout.front.photo.height || 180}
                        stroke="#14b8a6"
                        strokeWidth={2 / zoom}
                        dash={[5, 5]}
                        opacity={selectedId === 'photo' ? 1 : 0}
                      />
                      {photoImage && (
                        <KonvaImage
                          image={photoImage}
                          width={tempLayout.front.photo.width || 200}
                          height={tempLayout.front.photo.height || 180}
                        />
                      )}
                    </Group>
                    
                    <KonvaImage 
                      image={bgImage}
                      width={DESIGN_WIDTH}
                      height={DESIGN_HEIGHT}
                      listening={false} 
                      opacity={selectedId === 'photo' ? 0.4 : 1}
                    />

                    {['fullName', 'idNumber', 'course'].map((key) => (
                      <Text
                        key={key}
                        name={key}
                        text={previewData ? (previewData as any)[key] : key.toUpperCase()}
                        x={tempLayout.front[key].x}
                        y={tempLayout.front[key].y}
                        width={tempLayout.front[key].width}
                        fontSize={tempLayout.front[key].fontSize || 25}
                        fontStyle="700"
                        fill="#1e293b"
                        draggable
                        onDragEnd={(e) => handleDragEnd('front', key, e)}
                        onTransformEnd={(e) => handleTransformEnd(e, key)}
                        onClick={() => setSelectedId(key)}
                      />
                    ))}
                  </>
                ) : (
                  <>
                    <KonvaImage 
                      image={bgImage}
                      width={DESIGN_WIDTH}
                      height={DESIGN_HEIGHT}
                      listening={false}
                      opacity={selectedId === 'signature' ? 0.4 : 1}
                    />
                    <Group
                      name="signature"
                      x={tempLayout.back.signature.x}
                      y={tempLayout.back.signature.y}
                      width={tempLayout.back.signature.width || 200}
                      height={tempLayout.back.signature.height || 180}
                      draggable
                      onDragEnd={(e) => handleDragEnd('back', 'signature', e)}
                      onTransformEnd={(e) => handleTransformEnd(e, 'signature')}
                      onClick={() => setSelectedId('signature')}
                    >
                      <Rect
                        width={tempLayout.back.signature.width || 200}
                        height={tempLayout.back.signature.height || 180}
                        stroke="#6366f1"
                        strokeWidth={2 / zoom}
                        dash={[5, 5]}
                        opacity={selectedId === 'signature' ? 1 : 0}
                      />
                      {sigImage && (
                        <KonvaImage
                          image={sigImage}
                          width={tempLayout.back.signature.width || 200}
                          height={tempLayout.back.signature.height || 180}
                        />
                      )}
                    </Group>

                    <Text
                      name="guardian_name"
                      text={previewData?.guardianName || 'GUARDIAN NAME'}
                      x={tempLayout.back.guardian_name.x}
                      y={tempLayout.back.guardian_name.y}
                      width={tempLayout.back.guardian_name.width}
                      fontSize={tempLayout.back.guardian_name.fontSize || 11}
                      fontStyle="bold"
                      fill="#1e293b"
                      draggable
                      onDragEnd={(e) => handleDragEnd('back', 'guardian_name', e)}
                      onTransformEnd={(e) => handleTransformEnd(e, 'guardian_name')}
                      onClick={() => setSelectedId('guardian_name')}
                    />
                  </>
                )}

                <Transformer
                  ref={trRef}
                  keepRatio={selectedId === 'photo' || selectedId === 'signature'}
                  rotateEnabled={false}
                  boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
                />
              </Layer>
            </Stage>
          </div>
        </div>

        <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Square size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Properties</span>
          </div>
          {selectedId ? (
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Width</label>
                  <input readOnly value={tempLayout[editSide.toLowerCase()][selectedId].width || (selectedId === 'photo' ? 200 : 180)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-2 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Height</label>
                  <input readOnly value={tempLayout[editSide.toLowerCase()][selectedId].height || (selectedId === 'photo' ? 180 : 200)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-2 text-xs font-mono" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <MousePointer2 size={32} className="text-slate-300" />
              <p className="text-[10px] font-medium text-slate-400">Select an element</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardDesigner;