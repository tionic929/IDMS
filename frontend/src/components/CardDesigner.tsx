import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage, Group, Transformer, Circle } from 'react-konva';
import useImage from 'use-image';
import { 
  RefreshCw, Save, Square, Type, ZoomIn, ZoomOut, 
  Layers, MousePointer2, Download, 
  Type as FontIcon, Circle as CircleIcon, Box, 
  ArrowUp, ArrowDown, Trash2, AlignLeft
} from 'lucide-react';

import { toast } from 'react-toastify';

import FRONT_BG from '../assets/ID/NEWFRONT.png';
import BACK_BG from '../assets/ID/BACK.png';
import { type Students } from '../types/students';
import { saveLayout } from '../api/templates';

const VITE_API_URL = import.meta.env.VITE_API_URL;
const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 500;

// --- TYPES ---
type FitMode = 'none' | 'wrap' | 'shrink' | 'stretch';
type OverflowMode = 'clip' | 'ellipsis';

interface LayoutItemSchema {
  x: number;
  y: number;
  width: number;
  height: number | null;
  fontSize: number;
  fontFamily: string;
  fontStyle: string;
  align: 'left' | 'center' | 'right';
  fit: FitMode;
  maxLines: number | null;
  overflow: OverflowMode;
  opacity?: number;
  rotation?: number;
  fill?: string;
  text?: string;
  type?: string;
}

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

  useEffect(() => {
    if (currentLayout) {
      setTempLayout(currentLayout);
    }
  }, [currentLayout]);
  
  // --- ENGINE HELPERS ---

  /**
   * Calculates the font size required to fit text within a specific number of lines.
   */
  const calculateShrinkFontSize = (
    text: string, 
    width: number, 
    maxFontSize: number, 
    maxLines: number = 1,
    fontFamily: string = 'Arial', 
    fontStyle: string = 'normal'
  ): number => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return maxFontSize;

    let low = 1;
    let high = maxFontSize;
    let bestFit = low;

    // Use binary search to find the largest font size that fits within the maxLines constraint
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      ctx.font = `${fontStyle} ${mid}px ${fontFamily}`;
      const metrics = ctx.measureText(text);
      
      // Calculate how many lines this text would take at this font size
      // We subtract a small padding (4px) to ensure Konva doesn't force a wrap prematurely
      const estimatedLines = Math.ceil(metrics.width / (width - 4));
      
      if (estimatedLines <= maxLines) {
        bestFit = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return bestFit;
  };

  const resolveTextLayout = (key: string, config: any, text: string) => {
    const mode: FitMode = config.fit || 'none';
    const baseSize = config.fontSize || 18;
    const width = config.width || 200;
    const maxLines = config.maxLines || 1;

    let resolvedFontSize = baseSize;
    let wrapString: "none" | "word" = "none";

    if (mode === 'shrink') {
        resolvedFontSize = calculateShrinkFontSize(text, width, baseSize, maxLines, config.fontFamily, config.fontStyle);
        // If maxLines > 1, we must enable wrapping so it actually uses the lines
        wrapString = maxLines > 1 ? "word" : "none";
    } else if (mode === 'wrap') {
        wrapString = "word";
    }

    return { fontSize: resolvedFontSize, wrap: wrapString };
  };

  const getStagePNGForSide = async (side: 'FRONT' | 'BACK') => {
    setEditSide(side);
    await new Promise(resolve => setTimeout(resolve, 150));
    if (stageRef.current) {
      return stageRef.current.toDataURL({
        pixelRatio: 3.4375, 
        mimeType: 'image/png'
      });
    }
    return '';
  };

  const latestStudent = useMemo(() => {
    if (!allStudents || !Array.isArray(allStudents)) return null;
    const pending = allStudents.filter(s => !s.has_card);
    return [...pending].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0] || null;
  }, [allStudents]);

  const previewData = useMemo(() => {
    if (!latestStudent) return null;
    const getUrl = (path: string | null) => 
      path ? `${VITE_API_URL}/api/proxy-image?path=${path}` : '';
    
    return {
      fullName: `${latestStudent.first_name} ${latestStudent.last_name}`,
      idNumber: latestStudent.id_number,
      course: templateName || latestStudent.course || "COURSE",
      photo: getUrl(latestStudent.id_picture),
      signature: getUrl(latestStudent.signature_picture),
      guardian_name: latestStudent.guardian_name,
      guardian_contact: latestStudent.guardian_contact,
      address: latestStudent.address,
    };
  }, [latestStudent, templateName]);

  const [bgImage] = useImage(editSide === 'FRONT' ? FRONT_BG : BACK_BG, 'anonymous');
  const [photoImage] = useImage(previewData?.photo || '', 'anonymous');
  const [sigImage] = useImage(previewData?.signature || '', 'anonymous');

  const handleExportPNG = () => {
    if (!stageRef.current) return;
    setSelectedId(null);
    setTimeout(() => {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 3.4375, mimeType: 'image/png' });
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
    try {
      const frontPng = await getStagePNGForSide('FRONT');
      const backPng = await getStagePNGForSide('BACK');

      const updatedLayout = {
        ...tempLayout, 
        previewImages: { front: frontPng, back: backPng }
      };
      
      await saveLayout(templateId, templateName, updatedLayout);
      setTempLayout(updatedLayout);
      onSave(updatedLayout);
      setEditSide('FRONT');
      toast.success("Changes saved and applied!");
    } catch (error) {
      console.error("Save failed", error);
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
    const newShape: Partial<LayoutItemSchema> = { 
        x: 50, y: 50, width: 200, height: 180, 
        fill: '#00ffe1ff', rotation: 0, opacity: 1,
        type: type,
        fit: 'none',
    };

    setTempLayout((prev: any) => ({
      ...prev,
      [side]: {
        ...prev[side],
        [id]: newShape
      }
    }));
    setSelectedId(id);
  };

  const isTextLayer = (key: string | null) => {
    if (!key) return false;
    return !['photo', 'signature'].includes(key) && !key.startsWith('rect') && !key.startsWith('circle');
  };

  const handleTransform = (e: any, key: string, config: LayoutItemSchema) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    const newWidth = Math.max(10, Math.round(node.width() * scaleX));
    const newHeight = Math.max(10, Math.round(node.height() * scaleY));

    node.scaleX(1);
    node.scaleY(1);
    node.width(newWidth);
    node.height(newHeight);

    const textNode = node.findOne('Text');
    const boundsNode = node.findOne('.Bounds');
    const imageNode = node.findOne('.Image');

    if (textNode) {
      textNode.width(newWidth);
      if (config.fit !== 'none') textNode.height(newHeight);
      if (config.fit === 'stretch') {
        textNode.fontSize(Math.round(textNode.fontSize() * scaleY));
      }
    }
    if (boundsNode) {
      boundsNode.width(newWidth);
      boundsNode.height(newHeight);
    }
    if (imageNode) {
      imageNode.width(newWidth);
      imageNode.height(newHeight);
    }
    
    if (node.getClassName() === 'Circle') {
      node.radius(newWidth / 2);
    }
  };

  const handleTransformEnd = (e: any, key: string, config: LayoutItemSchema) => {
    const node = e.target;
    const textNode = node.findOne('Text');
    
    const finalUpdates: any = {
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      width: Math.round(node.width()),
      height: Math.round(node.height()),
      rotation: Math.round(node.rotation()),
    };

    if (textNode && config.fit === 'stretch') {
      finalUpdates.fontSize = Math.round(textNode.fontSize());
    }

    updateItem(key, finalUpdates);
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
    setTempLayout((prev: any) => ({ ...prev, [side]: reordered }));
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

  const renderElement = (key: string, config: LayoutItemSchema) => {
    const isPhoto = key === 'photo';
    const isSig = key === 'signature';
    const isShape = key.startsWith('rect') || key.startsWith('circle');
    
    const common = {
      name: key, x: config.x, y: config.y, 
      rotation: config.rotation || 0, opacity: config.opacity ?? 1,
      draggable: true, onClick: () => setSelectedId(key),
      onDragEnd: (e: any) => updateItem(key, { x: Math.round(e.target.x()), y: Math.round(e.target.y()) }),
      onTransform: (e: any) => handleTransform(e, key, config),
      onTransformEnd: (e: any) => handleTransformEnd(e, key, config)
    };

    if (isPhoto || isSig) {
      const img = isPhoto ? photoImage : sigImage;
      const w = config.width || 200;
      const h = config.height || 180;
      return (
        <Group key={key} {...common} width={w} height={h}>
          <Rect name="Bounds" width={w} height={h} stroke={isPhoto ? "#14b8a6" : "#6366f1"} strokeWidth={2/zoom} dash={[5,5]} opacity={selectedId === key ? 1 : 0} />
          {img && (
            <KonvaImage 
              name="Image"
              image={img} 
              width={w} height={h} 
              sceneFunc={(context, shape) => {
                const nodeW = shape.width();
                const nodeH = shape.height();
                const ratio = Math.min(nodeW / img.width, nodeH / img.height);
                context.drawImage(img, (nodeW - img.width * ratio) / 2, (nodeH - img.height * ratio) / 2, img.width * ratio, img.height * ratio);
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

    let displayText = (previewData as any)?.[key] || config.text || `LABEL: ${key}`;
    if(key === 'course') displayText = templateName || displayText;

    const { fontSize, wrap } = resolveTextLayout(key, config, displayText);
    const boxWidth = config.width || 200;
    const boxHeight = config.height || 180;

    return (
      <Group key={key} x={config.x} y={config.y} width={boxWidth} height={boxHeight} rotation={config.rotation || 0} {...common}>
        <Rect name="Bounds" width={boxWidth} height={boxHeight} stroke="#14b8a6" strokeWidth={1/zoom} dash={[4,4]} opacity={selectedId === key ? 0.6 : 0} />
        <Text 
          name="Text" x={0} y={0} text={displayText} fontSize={fontSize} width={boxWidth}
          height={config.fit === 'none' ? undefined : boxHeight}
          fontFamily={config.fontFamily || 'Arial'} fontStyle={config.fontStyle || 'bold'}
          fill={config.fill || '#1e293b'} align={config.align || 'center'}
          verticalAlign="middle" wrap={wrap} ellipsis={config.overflow === 'ellipsis'} 
        />
      </Group>
    );
  };

  const getEnabledAnchors = (): string[] => {
      if (!selectedId) return [];
      const side = editSide.toLowerCase();
      const config = tempLayout[side]?.[selectedId] as LayoutItemSchema;
      if (config?.fit === 'none') return [];
      if (config?.fit === 'wrap') return ['middle-left', 'middle-right'];
      if (config?.fit === 'shrink') return ['middle-left', 'middle-right', 'top-center', 'bottom-center'];
      if (config?.fit === 'stretch') return ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
      return ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right'];
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
          <button onClick={() => setTempLayout(currentLayout)} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-orange-500 transition-colors"><RefreshCw size={14} /> Reset</button>
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
                  if (key === 'photo' || key === 'signature') return renderElement(key, config as LayoutItemSchema);
                  return null;
                })}
                <KonvaImage image={bgImage} width={DESIGN_WIDTH} height={DESIGN_HEIGHT} listening={false} opacity={(selectedId === 'photo' || selectedId === 'signature') ? 0.4 : 1} />
                {tempLayout && tempLayout[editSide.toLowerCase()] && Object.entries(tempLayout[editSide.toLowerCase()]).map(([key, config]) => {
                  const isShape = key.startsWith('rect') || key.startsWith('circle');
                  const isText = isTextLayer(key);
                  if (editSide === 'BACK') return renderElement(key,config as LayoutItemSchema);
                  if (editSide === 'FRONT' && (isShape || isText)) return renderElement(key,config as LayoutItemSchema);
                  return null;
                })}
                <Transformer 
                  ref={trRef} 
                  keepRatio={selectedId ? (tempLayout[editSide.toLowerCase()]?.[selectedId]?.fit === 'stretch' || ['photo', 'signature'].includes(selectedId)) : false} 
                  rotateEnabled={true} enabledAnchors={getEnabledAnchors()}
                  boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10) ? oldBox : newBox}
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
                <>
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Fit Mode</label>
                  <div className="grid grid-cols-2 gap-1">
                      {['none', 'wrap', 'shrink', 'stretch'].map((m) => (
                          <button key={m} onClick={() => updateItem(selectedId, { fit: m })} className={`px-2 py-1 text-[8px] uppercase font-bold rounded border ${tempLayout[editSide.toLowerCase()][selectedId].fit === m ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-500 border-slate-200'}`}>{m}</button>
                      ))}
                  </div>
                </div>

                <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><AlignLeft size={10}/> Max Lines</label>
                    <span className="text-[10px] font-mono text-teal-500 font-bold">{tempLayout[editSide.toLowerCase()][selectedId].maxLines || 1}</span>
                  </div>
                  <input type="range" min="1" max="5" value={tempLayout[editSide.toLowerCase()][selectedId].maxLines || 1} onChange={(e) => updateItem(selectedId, { maxLines: parseInt(e.target.value) })} className="w-full accent-teal-500" />
                  <p className="text-[7px] text-slate-400 italic">When in 'shrink' mode, font will reduce to fit this many lines.</p>
                </div>

                <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Base Font Size</label>
                    <span className="text-[10px] font-mono text-teal-500 font-bold">{tempLayout[editSide.toLowerCase()][selectedId].fontSize || 18}px</span>
                  </div>
                  <input type="range" min="8" max="100" value={tempLayout[editSide.toLowerCase()][selectedId].fontSize || 18} onChange={(e) => updateItem(selectedId, { fontSize: parseInt(e.target.value) })} className="w-full accent-teal-500" />
                </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Width</label>
                  <input type="number" value={Math.round(tempLayout[editSide.toLowerCase()][selectedId].width || 200)} onChange={(e) => updateItem(selectedId, { width: parseInt(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800 rounded p-2 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Height</label>
                  <input type="number" value={Math.round(tempLayout[editSide.toLowerCase()][selectedId].height || 180)} onChange={(e) => updateItem(selectedId, { height: parseInt(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800 rounded p-2 text-xs font-mono" />
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