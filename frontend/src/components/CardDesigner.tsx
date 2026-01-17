import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage, Group, Transformer, Circle } from 'react-konva';
import useImage from 'use-image';
import { 
  RefreshCw, Save, Square, Type, ZoomIn, ZoomOut, 
  Layers, MousePointer2, Download, RotateCw, Palette, 
  Type as FontIcon, Circle as CircleIcon, Box, 
  ArrowUp, ArrowDown, Trash2 
} from 'lucide-react';

import { toast } from 'react-toastify';

import FRONT_BG from '../assets/ID/NEWFRONT.png';
import BACK_BG from '../assets/ID/BACK.png';
import { type Students } from '../types/students';
import { saveLayout } from '../api/templates';

const VITE_API_URL = import.meta.env.VITE_API_URL;
const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 500;

interface CardDesignerProps {
  templateId: number | null;
  templateName: string;
  onSave: (newLayout: any) => void;
  currentLayout: any;
  allStudents: Students[];
}

const CardDesigner: React.FC<CardDesignerProps> = ({ templateId, templateName, onSave, currentLayout, allStudents }) => {
  const [editSide, setEditSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [tempLayout, setTempLayout] = useState(currentLayout);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  // DEBUG: Monitor layout changes from parent
  useEffect(() => {
    if (currentLayout) {
      console.log("DEBUG: Received currentLayout from parent:", currentLayout);
      setTempLayout(currentLayout);
    }
  }, [currentLayout]);
  
  const getStagePNGForSide = async (side: 'FRONT' | 'BACK') => {
    // 1. Temporarily switch to the side we want to capture
    setEditSide(side);
    
    // 2. Small delay to allow Konva to re-render the new side
    await new Promise(resolve => setTimeout(resolve, 100));

    if (stageRef.current) {
      // 3. Export at high quality for printing
      return stageRef.current.toDataURL({
        pixelRatio: 3, // Higher resolution for printing
        mimeType: 'image/png'
      });
    }
    return '';
  };

  const latestStudent = useMemo(() => {
    if (!allStudents || !Array.isArray(allStudents)) return null;
    const pending = allStudents.filter(s => !s.has_card);
    const selected = [...pending].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0] || null;
    console.log("DEBUG: Selected student for preview:", selected);
    return selected;
  }, [allStudents]);

  const previewData = useMemo(() => {
    const student = allStudents[0];
    if (!latestStudent) {
        console.warn("DEBUG: No student found for previewData.");
        return null;
    }
    const getUrl = (path: string | null) => 
      path ? `${VITE_API_URL}/api/proxy-image?path=${path}` : '';
    
    const data = {
      fullName: `${latestStudent.first_name} ${latestStudent.last_name}`,
      idNumber: latestStudent.id_number,
      course: templateName || latestStudent.course || "COURSE",
      photo: getUrl(latestStudent.id_picture),
      signature: getUrl(latestStudent.signature_picture),
      guardian_name: latestStudent.guardian_name,
      guardian_contact: latestStudent.guardian_contact,
      address: latestStudent.address,
    };

    console.log("DEBUG: Generated previewData object:", data);
    return data;
  }, [latestStudent]);

  const [bgImage] = useImage(editSide === 'FRONT' ? FRONT_BG : BACK_BG, 'anonymous');
  const [photoImage] = useImage(previewData?.photo || '', 'anonymous');
  const [sigImage] = useImage(previewData?.signature || '', 'anonymous');

  const getStagePNG = () => {
    if (!stageRef.current) return null;
    return stageRef.current.toDataURL({
      pixelRatio: 3.4375,
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

  const handleSaveLayout = async () => {
    if (!templateId) {
      toast.error("Please select a template first");
      return;
    }
    setIsSaving(true);

    // console.log("DEBUG: Starting Save Process. Current local state:", tempLayout);
    // const finalLayout = { ...tempLayout, previewImages: { front: '', back: '' } };
    try {
      const frontPng = await getStagePNGForSide('FRONT');
      const backPng = await getStagePNGForSide('BACK');

      const updatedLayout = {
        ...tempLayout, 
        previewImages: {
          front: frontPng,
          back: backPng
        }
      }
      
      await saveLayout(templateId, templateName, updatedLayout);
      setTempLayout(updatedLayout);
      onSave(updatedLayout);
      setEditSide('FRONT');
      toast.success("Changes saved and applied!");
    } catch (error) {
      console.error("DEBUG: Save failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateItem = (id: string, attrs: any) => {
    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: {
        ...prev[side],
        [id]: { ...prev[side][id], ...attrs }
      }
    }));
  };

  const addShape = (type: 'rect' | 'circle') => {
    const side = editSide.toLowerCase();
    const id = `${type}_${Date.now()}`;
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: {
        ...prev[side],
        [id]: { 
          type, 
          x: 50, 
          y: 50, 
          width: 200, 
          height: 180, 
          fill: '#00ffe1ff', 
          rotation: 0, 
          opacity: 1 
        }
      }
    }));
    setSelectedId(id);
  };

  const handleTransformEnd = (e: any, key: string) => {
    const node = e.target;
    const isText = node.className === 'Text';
    
    const attrs: any = {
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      rotation: Math.round(node.rotation()),
    };

    attrs.width = Math.max(5, Math.round(node.width() * node.scaleX()));
    attrs.height = Math.max(5, Math.round(node.height() * node.scaleY()));

    if (isText) {
      attrs.fontSize = Math.round(node.fontSize() * node.scaleX());
    }

    updateItem(key, attrs);
    node.scaleX(1);
    node.scaleY(1);
  };

  const moveLayer = (direction: 'up' | 'down') => {
    if (!selectedId) return;
    const side = editSide.toLowerCase();
    const sideData = tempLayout[side];
    const keys = Object.keys(sideData);
    const index = keys.indexOf(selectedId);
    
    if ((direction === 'up' && index === keys.length - 1) || (direction === 'down' && index === 0)) return;
    
    const newKeys = [...keys];
    const newIndex = direction === 'up' ? index + 1 : index - 1;
    [newKeys[index], newKeys[newIndex]] = [newKeys[newIndex], newKeys[index]];
    
    const reordered: any = {};
    newKeys.forEach(k => reordered[k] = sideData[k]);
    
    setTempLayout((prev: any) => ({ 
      ...prev, 
      [side]: reordered 
    }));
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

  const isTextLayer = (key: string | null) => {
    if (!key) return false;
    return !['photo', 'signature'].includes(key) && !key.startsWith('rect') && !key.startsWith('circle');
  };

  const renderElement = (key: string, config: any) => {
    const isPhoto = key === 'photo';
    const isSig = key === 'signature';
    const isShape = key.startsWith('rect') || key.startsWith('circle');
    
    // DEBUG: Log every element being rendered
    // console.log(`DEBUG: Rendering element [${key}]`, { side: editSide, config });

    const common = {
      name: key, x: config.x, y: config.y, 
      rotation: config.rotation || 0, opacity: config.opacity ?? 1,
      draggable: true, onClick: () => setSelectedId(key),
      onDragEnd: (e: any) => updateItem(key, { x: Math.round(e.target.x()), y: Math.round(e.target.y()) }),
      onTransformEnd: (e: any) => handleTransformEnd(e, key)
    };

    if (isPhoto || isSig) {
      const img = isPhoto ? photoImage : sigImage;
      const w = config.width || 200;
      const h = config.height || 180;
      return (
        <Group key={key} {...common} width={w} height={h}>
          <Rect width={w} height={h} stroke={isPhoto ? "#14b8a6" : "#6366f1"} strokeWidth={2/zoom} dash={[5,5]} opacity={selectedId === key ? 1 : 0} />
          {img && (
            <KonvaImage image={img} width={w} height={h} 
              sceneFunc={(context) => {
                const ratio = Math.min(w / img.width, h / img.height);
                context.drawImage(img, (w - img.width * ratio) / 2, (h - img.height * ratio) / 2, img.width * ratio, img.height * ratio);
              }}
            />
          )}
        </Group>
      );
    }

    if (isShape) {
      const w = config.width || 200;
      const h = config.height || 180;
      if (config.type === 'circle') return <Circle key={key} {...common} width={w} height={h} radius={w / 2} fill={config.fill} />;
      return <Rect key={key} {...common} width={w} height={h} fill={config.fill} />;
    }

    // TEXT RENDERING
    // const displayText = previewData && (previewData as any)[key] ? (previewData as any)[key] : (config.text || `LABEL: ${key}`);
    let displayText = "";
    if(key === 'course') {
      displayText = templateName || config.text || (previewData as any)?.[key] || "COURSE";
    } else {
      displayText = (previewData as any)?.[key] || config.text || `LABEL: ${key}`;
    }

    return (
      <Text key={key} {...common} 
        text={displayText}
        fontSize={config.fontSize || 18}
        width={config.width}
        height={config.height}
        fontFamily={config.fontFamily || 'Arial'}
        fontStyle={config.fontStyle || 'bold'}
        fill={config.fill || '#ffffffff'}
        onTransform={(e) => {
          const node = e.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.setAttrs({
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            scaleX: 1,
            scaleY: 1
          });
        }}
      />
    );
  };

  return (
    <div className="flex flex-col h-[85vh] bg-slate-50 dark:bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black uppercase italic tracking-tighter">Studio<span className="text-teal-500">Editor</span></h2>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['FRONT', 'BACK'] as const).map((s) => (
              <button key={s} onClick={() => { setEditSide(s); setSelectedId(null); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${editSide === s ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-500' : 'text-slate-400'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><ZoomOut size={18}/></button>
          <span className="text-xs font-mono text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><ZoomIn size={18}/></button>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />
          <button onClick={handleExportPNG} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-teal-600 hover:bg-teal-50 rounded-xl transition-all"><Download size={14} /> Export PNG</button>
          <button onClick={() => { console.log("DEBUG: Resetting layout to original"); setTempLayout(currentLayout); }} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-orange-500 transition-colors"><RefreshCw size={14} /> Reset</button>
          <button onClick={handleSaveLayout} disabled={isSaving} className={`flex items-center gap-2 px-6 py-2 bg-teal-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg transition-all ${isSaving ? 'opacity-70' : 'hover:scale-105 active:scale-95'}`}>
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} {isSaving ? 'Rendering...' : 'Save Layout'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-6">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-3"><Box size={14}/> Library</span>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addShape('rect')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-50 transition-colors text-slate-500"><Square size={20} /><span className="text-[8px] font-bold mt-1 uppercase">Rect</span></button>
              <button onClick={() => addShape('circle')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-50 transition-colors text-slate-500"><CircleIcon size={20} /><span className="text-[8px] font-bold mt-1 uppercase">Circle</span></button>
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-3"><Layers size={14}/> Layers</span>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {tempLayout && tempLayout[editSide.toLowerCase()] && Object.entries(tempLayout[editSide.toLowerCase()]).map(([key, pos]: any) => (
                <button key={key} onClick={() => setSelectedId(key)} className={`w-full p-3 rounded-xl border text-left transition-all ${selectedId === key ? 'bg-teal-500/10 border-teal-500' : 'bg-slate-50 dark:bg-slate-950 border-transparent hover:border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {key.includes('photo') || key.includes('signature') ? <Square size={12} className="text-teal-500" /> : <Type size={12} className="text-teal-500" />}
                    <span className="text-[10px] font-bold uppercase truncate">{key.replace('_', ' ')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[8px] font-mono text-slate-400"><span>X: {pos.x}</span><span>Y: {pos.y}</span></div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-10 overflow-auto">
          <div className="shadow-2xl rounded-lg overflow-hidden bg-white" style={{ width: DESIGN_WIDTH * zoom, height: DESIGN_HEIGHT * zoom }}>
            <Stage ref={stageRef} width={DESIGN_WIDTH * zoom} height={DESIGN_HEIGHT * zoom} scaleX={zoom} scaleY={zoom} onMouseDown={(e) => e.target === e.target.getStage() && setSelectedId(null)}>
              <Layer ref={layerRef}>
                {editSide === 'FRONT' && tempLayout.front && Object.entries(tempLayout.front).map(([key, config]) => {
                  if (key === 'photo' || key === 'signature') return renderElement(key, config);
                  return null;
                })}
                <KonvaImage 
                  image={bgImage} 
                  width={DESIGN_WIDTH} 
                  height={DESIGN_HEIGHT} 
                  listening={false} 
                  opacity={(selectedId === 'photo' || selectedId === 'signature') ? 0.4 : 1} 
                />
                {tempLayout && tempLayout[editSide.toLowerCase()] && Object.entries(tempLayout[editSide.toLowerCase()]).map(([key, config]) => {
                  const isShape = key.startsWith('rect') || key.startsWith('circle');
                  const isText = isTextLayer(key);
                  if (editSide === 'BACK') return renderElement(key,config);
                  if (editSide === 'FRONT' && (isShape || isText)) return renderElement(key,config);
                  return null;
                })}
                <Transformer 
                  ref={trRef} 
                  keepRatio={false} 
                  enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']}
                  rotateEnabled={true} 
                />
              </Layer>
            </Stage>
          </div>
        </div>

        <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-6 overflow-y-auto">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Properties</span>
          {selectedId && tempLayout[editSide.toLowerCase()] && tempLayout[editSide.toLowerCase()][selectedId] ? (
            <div className="space-y-6">
              <div className="flex gap-2">
                <button onClick={() => moveLayer('up')} className="flex-1 flex items-center justify-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-[9px] font-bold hover:bg-slate-100"><ArrowUp size={12}/> UP</button>
                <button onClick={() => moveLayer('down')} className="flex-1 flex items-center justify-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-[9px] font-bold hover:bg-slate-100"><ArrowDown size={12}/> DOWN</button>
              </div>

              {isTextLayer(selectedId) && (
                <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Font Size</label>
                    <span className="text-[10px] font-mono text-teal-500 font-bold">{tempLayout[editSide.toLowerCase()][selectedId].fontSize || 18}px</span>
                  </div>
                  <input type="range" min="8" max="100" value={tempLayout[editSide.toLowerCase()][selectedId].fontSize || 18} onChange={(e) => updateItem(selectedId, { fontSize: parseInt(e.target.value) })} className="w-full accent-teal-500 cursor-pointer" />
                  <input type="number" value={tempLayout[editSide.toLowerCase()][selectedId].fontSize || 18} onChange={(e) => updateItem(selectedId, { fontSize: parseInt(e.target.value) })} className="w-full bg-white dark:bg-slate-900 rounded p-2 text-xs font-mono border border-slate-200 dark:border-slate-700" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Width</label>
                  <input type="number" value={tempLayout[editSide.toLowerCase()][selectedId].width || 200} onChange={(e) => updateItem(selectedId, { width: parseInt(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800 rounded p-2 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Height</label>
                  <input type="number" value={tempLayout[editSide.toLowerCase()][selectedId].height || 180} onChange={(e) => updateItem(selectedId, { height: parseInt(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800 rounded p-2 text-xs font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Opacity</label>
                <input type="range" min="0" max="1" step="0.1" value={tempLayout[editSide.toLowerCase()][selectedId].opacity ?? 1} onChange={(e) => updateItem(selectedId, { opacity: parseFloat(e.target.value) })} className="w-full accent-teal-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Rotation</label>
                  <input type="number" value={tempLayout[editSide.toLowerCase()][selectedId].rotation || 0} onChange={(e) => updateItem(selectedId, { rotation: parseInt(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800 rounded p-2 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Color</label>
                  <input type="color" value={tempLayout[editSide.toLowerCase()][selectedId].fill || '#1e293b'} onChange={(e) => updateItem(selectedId, { fill: e.target.value })} className="w-full h-8 bg-transparent cursor-pointer border-none" />
                </div>
              </div>
              <button onClick={() => {
                const side = editSide.toLowerCase();
                const newLayout = { ...tempLayout };
                delete newLayout[side][selectedId];
                setTempLayout(newLayout);
                setSelectedId(null);
              }} className="w-full py-2.5 text-[9px] font-black uppercase text-red-500 hover:bg-red-50 rounded-xl border border-red-500/20 flex items-center justify-center gap-2"><Trash2 size={12}/> Delete</button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50"><MousePointer2 size={32}/><p className="text-[10px] mt-2 font-bold uppercase tracking-widest">Select Layer</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardDesigner;