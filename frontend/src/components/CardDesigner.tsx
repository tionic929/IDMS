import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Circle, Group, Text, Line } from 'react-konva';
import useImage from 'use-image';
import { 
  Save, Square, Circle as CircleIcon, 
  MousePointer2, Download, 
  Type as FontIcon, 
  Trash2, Undo2, Redo2, Grid3X3, Minus, Plus,
  Layers as LayersIcon, ChevronRight, ChevronDown,
  LayoutTemplate, Lock, Eye, Move, RefreshCw,
  Image as ImageIcon, Magnet
} from 'lucide-react';
import { toast } from 'react-toastify';

import FRONT_BG from '../assets/ID/NEWFRONT.png';
import BACK_BG from '../assets/ID/BACK.png';
import { type Students } from '../types/students';
import { saveLayout } from '../api/templates';
import { type LayoutItemSchema, type FitMode } from '../types/designer';
import { getEnabledAnchors, reorderLayer } from '../utils/designerUtils';

// For Dimensions
import { 
  DESIGN_WIDTH, 
  DESIGN_HEIGHT,
  PRINT_WIDTH,
  PRINT_HEIGHT,
  EXPORT_PIXEL_RATIO,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM
} from '../constants/dimensions';

// Components
import SidebarLayers from './Designer/SidebarLayers';
import PropertyPanel from './Designer/PropertyPanel';
import CanvasElement from './Designer/CanvasElement';

const VITE_API_URL = import.meta.env.VITE_API_URL;

const SNAP_DISTANCE = 5; 

const RulerHorizontal = ({ zoom }: { zoom: number }) => (
  <div className="h-6 w-full bg-zinc-900 border-b border-zinc-800 relative overflow-hidden flex text-[9px] text-zinc-500 font-mono select-none">
    {Array.from({ length: 40 }).map((_, i) => (
      <div key={i} className="absolute bottom-0 border-l border-zinc-700 h-2 flex flex-col justify-end" style={{ left: i * 50 * zoom }}>
        {i > 0 && <span className="absolute -top-4 -left-2">{i * 50}</span>}
      </div>
    ))}
  </div>
);

const RulerVertical = ({ zoom }: { zoom: number }) => (
  <div className="w-6 h-full bg-zinc-900 border-r border-zinc-800 relative overflow-hidden flex flex-col text-[9px] text-zinc-500 font-mono select-none">
    {Array.from({ length: 60 }).map((_, i) => (
      <div key={i} className="absolute right-0 border-t border-zinc-700 w-2 flex justify-end" style={{ top: i * 50 * zoom }}>
         {i > 0 && <span className="absolute -left-5 -top-2 w-4 text-right">{i * 50}</span>}
      </div>
    ))}
  </div>
);

const IconButton = ({ icon: Icon, label, active, onClick, disabled }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={`p-2 rounded-lg transition-all flex items-center justify-center
      ${active 
        ? 'bg-indigo-500/20 text-indigo-400 shadow-sm border border-indigo-500/50' 
        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    <Icon size={18} strokeWidth={2} />
  </button>
);

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
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [isSaving, setIsSaving] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [activeTool, setActiveTool] = useState<'select' | 'hand'>('select');
  
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showSnapGuides, setShowSnapGuides] = useState(true);
  const [snapLines, setSnapLines] = useState<{ vertical: number[], horizontal: number[] }>({ vertical: [], horizontal: [] });

  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentLayout) setTempLayout(currentLayout);
  }, [currentLayout]);

  const getProxyUrl = (path: string | null | undefined) => {
    if (!path) return '';
    // If it's already a full URL or data URL, return it
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
    
    // Construct the proxy URL to avoid CORS issues with the storage folder
    const storagePath = `${VITE_API_URL}/storage/`;
    let cleanPath = path;
    if (path.startsWith(storagePath)) {
      cleanPath = path.replace(storagePath, '');
    }
    return `${VITE_API_URL}/api/proxy-image?path=${encodeURIComponent(cleanPath)}`;
  };

  const activeStudent = useMemo(() => {
    if (!allStudents || !Array.isArray(allStudents) || allStudents.length === 0) return null;
    
    // Sort by updated_at descending to get the student who was just modified in ProfileDetails
    const sorted = [...allStudents].sort((a, b) => {
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });
    
    return sorted[0];
  }, [allStudents]);

  const previewData = useMemo(() => {
    if (!activeStudent) return null;
    return {
      fullName: `${activeStudent.first_name} ${activeStudent.last_name}`,
      idNumber: activeStudent.id_number,
      course: templateName || activeStudent.course || "COURSE",
      photo: getProxyUrl(activeStudent.id_picture),
      signature: getProxyUrl(activeStudent.signature_picture),
      guardian_name: activeStudent.guardian_name,
      guardian_contact: activeStudent.guardian_contact,
      address: activeStudent.address,
    };
  }, [activeStudent, templateName]);

  // Hooks to load images. Adding previewData.photo as dependency ensures they reload when the student changes
  const [bgImage] = useImage(editSide === 'FRONT' ? FRONT_BG : BACK_BG, 'anonymous');
  const [photoImage] = useImage(previewData?.photo || '', 'anonymous');
  const [sigImage] = useImage(previewData?.signature || '', 'anonymous');

  const updateItem = (id: string, attrs: any) => {
    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: { ...prev[side], [id]: { ...prev[side][id], ...attrs } }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const side = editSide.toLowerCase();
        const id = `img_${Date.now()}`;
        
        const aspectRatio = img.height / img.width;
        const maxWidth = DESIGN_WIDTH * 0.8;
        const maxHeight = DESIGN_HEIGHT * 0.8;
        
        let width: number;
        let height: number;
        
        if (aspectRatio > 1) {
          height = Math.min(maxHeight, DESIGN_HEIGHT * 0.8);
          width = height / aspectRatio;
        } else {
          width = Math.min(maxWidth, DESIGN_WIDTH * 0.8);
          height = width * aspectRatio;
        }
        
        const centerX = (DESIGN_WIDTH - width) / 2;
        const centerY = (DESIGN_HEIGHT - height) / 2;
        
        const newImage = {
          type: 'image',
          src: src,
          x: centerX,
          y: centerY,
          width: Math.round(width),
          height: Math.round(height),
          opacity: 1,
          rotation: 0
        };
        
        setTempLayout((prev: any) => ({
          ...prev,
          [side]: { ...prev[side], [id]: newImage }
        }));
        setSelectedId(id);
        toast.success(`Image added! Size: ${Math.round(width)}×${Math.round(height)}px`);
      };
      img.src = src;
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const addShape = (type: 'rect' | 'circle') => {
    const side = editSide.toLowerCase();
    const id = `${type}_${Date.now()}`;
    const newShape = { 
        x: 50, y: 50, width: 200, height: 180, 
        fill: '#00ffe1ff', rotation: 0, opacity: 1, type, fit: 'none' 
    };
    setTempLayout((prev: any) => ({ ...prev, [side]: { ...prev[side], [id]: newShape } }));
    setSelectedId(id);
  };

  const addText = () => {
    const side = editSide.toLowerCase();
    const id = `text_${Date.now()}`;
    const newText = {
      type: 'text', x: 50, y: 50, width: 200, height: 180,
      text: 'New Text', fontSize: 20, fill: '#000000', rotation: 0
    };
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: { ...prev[side], [id]: newText }
    }));
    setSelectedId(id);
  };

  const moveLayer = (direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!selectedId) return;
    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: reorderLayer(prev[side], selectedId, direction)
    }));
  };

  const handleDelete = () => {
    const side = editSide.toLowerCase();
    const newLayout = { ...tempLayout };
    delete newLayout[side][selectedId!];
    setTempLayout(newLayout);
    setSelectedId(null);
  };

  const getLineGuideStops = (skipShape: any) => {
    const vertical = [0, DESIGN_WIDTH / 2, DESIGN_WIDTH];
    const horizontal = [0, DESIGN_HEIGHT / 2, DESIGN_HEIGHT];

    layerRef.current.getChildren().forEach((guideItem: any) => {
      if (guideItem === skipShape || guideItem.getClassName() === 'Line') return;
      const box = guideItem.getClientRect();
      vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
      horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
    });

    return {
      vertical: Array.from(new Set(vertical)),
      horizontal: Array.from(new Set(horizontal)),
    };
  };

  const getObjectSnappingEdges = (node: any) => {
    const box = node.getClientRect();
    const absPos = node.getAbsolutePosition();

    return {
      vertical: [
        { guide: box.x, offset: absPos.x - box.x, snap: 'start' },
        { guide: box.x + box.width / 2, offset: absPos.x - box.x - box.width / 2, snap: 'center' },
        { guide: box.x + box.width, offset: absPos.x - box.x - box.width, snap: 'end' },
      ],
      horizontal: [
        { guide: box.y, offset: absPos.y - box.y, snap: 'start' },
        { guide: box.y + box.height / 2, offset: absPos.y - box.y - box.height / 2, snap: 'center' },
        { guide: box.y + box.height, offset: absPos.y - box.y - box.height, snap: 'end' },
      ],
    };
  };

  const getGuides = (lineGuideStops: any, itemBounds: any) => {
    const resultV: any[] = [];
    const resultH: any[] = [];

    lineGuideStops.vertical.forEach((line: number) => {
      itemBounds.vertical.forEach((boundary: any) => {
        const diff = Math.abs(line - boundary.guide);
        if (diff < SNAP_DISTANCE) {
          resultV.push({ line, diff, boundary });
        }
      });
    });

    lineGuideStops.horizontal.forEach((line: number) => {
      itemBounds.horizontal.forEach((boundary: any) => {
        const diff = Math.abs(line - boundary.guide);
        if (diff < SNAP_DISTANCE) {
          resultH.push({ line, diff, boundary });
        }
      });
    });

    const guides: any[] = [];
    const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    const minH = resultH.sort((a, b) => a.diff - b.diff)[0];

    if (minV) guides.push({ line: minV.line, orientation: 'V', ...minV.boundary });
    if (minH) guides.push({ line: minH.line, orientation: 'H', ...minH.boundary });

    return guides;
  };

  const handleDragMove = (e: any) => {
    if (!snapEnabled) return;

    const layer = layerRef.current;
    const node = e.target;
    const lineGuideStops = getLineGuideStops(node);
    const itemBounds = getObjectSnappingEdges(node);
    const guides = getGuides(lineGuideStops, itemBounds);

    if (guides.length === 0) {
      setSnapLines({ vertical: [], horizontal: [] });
      return;
    }

    const newSnapLines = { vertical: [] as number[], horizontal: [] as number[] };

    guides.forEach((lg) => {
      if (lg.orientation === 'V') {
        newSnapLines.vertical.push(lg.line);
        node.x(lg.line + lg.offset);
      } else if (lg.orientation === 'H') {
        newSnapLines.horizontal.push(lg.line);
        node.y(lg.line + lg.offset);
      }
    });

    setSnapLines(newSnapLines);
  };

  const handleTransform = (e: any, key: string, config: LayoutItemSchema) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const newWidth = Math.max(10, Math.round(node.width() * scaleX));
    const newHeight = Math.max(10, Math.round(node.height() * scaleY));

    node.scaleX(1); node.scaleY(1);
    node.width(newWidth); node.height(newHeight);

    const textNode = node.findOne('Text');
    const boundsNode = node.findOne('.Bounds');
    const imageNode = node.findOne('.Image');

    if (textNode) {
      textNode.width(newWidth);
      if (config.fit !== 'none') textNode.height(newHeight);
      if (config.fit === 'stretch') textNode.fontSize(Math.round(textNode.fontSize() * scaleY));
    }
    if (boundsNode) { boundsNode.width(newWidth); boundsNode.height(newHeight); }
    if (imageNode) { imageNode.width(newWidth); imageNode.height(newHeight); }
    if (node.getClassName() === 'Circle') node.radius(newWidth / 2);
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
    if (textNode && config.fit === 'stretch') finalUpdates.fontSize = Math.round(textNode.fontSize());
    updateItem(key, finalUpdates);
    setSnapLines({ vertical: [], horizontal: [] });
  };

  useEffect(() => {
    if (selectedId && layerRef.current) {
      const node = layerRef.current.findOne((n: any) => n.name() === selectedId);
      if (node && trRef.current) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    } else if (trRef.current) trRef.current.nodes([]);
  }, [selectedId, editSide]);

  const handleSaveLayout = async () => {
    if (!templateId) return toast.error("Please select a template first");
    setIsSaving(true);
    try {
      const getSidePNG = async (side: 'FRONT' | 'BACK') => {
        setEditSide(side);
        await new Promise(r => setTimeout(r, 150));
        return stageRef.current?.toDataURL({ pixelRatio: EXPORT_PIXEL_RATIO });
      };
      const frontPng = await getSidePNG('FRONT');
      const backPng = await getSidePNG('BACK');
      const updatedLayout = { ...tempLayout, previewImages: { front: frontPng, back: backPng } };
      await saveLayout(templateId, templateName, updatedLayout);
      onSave(updatedLayout);
      setEditSide('FRONT');
      toast.success("Changes saved!");
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleExportPNG = () => {
    if (!stageRef.current) return;
    setSelectedId(null);
    setTimeout(() => {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: EXPORT_PIXEL_RATIO });
      const link = document.createElement('a');
      link.download = `${previewData?.idNumber || 'ID'}_${editSide}.png`;
      link.href = dataURL;
      link.click();
    }, 50);
  };

  const isTextLayer = (key: string) => !['photo', 'signature'].includes(key) && !key.startsWith('rect') && !key.startsWith('circle') && !key.startsWith('img');
  const currentSideData = tempLayout[editSide.toLowerCase()] || {};

  return (
    <div className="flex flex-col h-[90vh] bg-zinc-950 text-zinc-200 overflow-hidden font-sans border border-zinc-800 shadow-2xl select-none">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      
      <div className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Project</span>
            <ChevronRight size={12} />
            <span className="text-zinc-100 font-medium">{templateName}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
          <IconButton icon={Undo2} label="Undo" disabled={true} />
          <IconButton icon={Redo2} label="Redo" disabled={true} />
          <div className="w-px h-4 bg-zinc-700 mx-1" />
          <IconButton icon={Minus} onClick={() => setZoom(prev => Math.max(MIN_ZOOM, prev - 0.1))} label="Zoom Out" />
          <span className="text-[10px] w-10 text-center font-mono text-zinc-400">{Math.round(zoom * 100)}%</span>
          <IconButton icon={Plus} onClick={() => setZoom(prev => Math.min(MAX_ZOOM, prev + 0.1))} label="Zoom In" />
          <div className="w-px h-4 bg-zinc-700 mx-1" />
          <IconButton 
            icon={Magnet} 
            active={snapEnabled} 
            onClick={() => setSnapEnabled(!snapEnabled)} 
            label={`Snapping ${snapEnabled ? 'ON' : 'OFF'}`} 
          />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSaveLayout} disabled={isSaving} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold transition-all">
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <IconButton icon={Download} onClick={handleExportPNG} label="Export" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-12 border-r border-zinc-800 bg-zinc-900 flex flex-col items-center py-4 gap-3 z-20">
          <IconButton icon={MousePointer2} active={activeTool === 'select'} onClick={() => setActiveTool('select')} label="Select" />
          <IconButton icon={Move} active={activeTool === 'hand'} onClick={() => setActiveTool('hand')} label="Pan" />
          <div className="w-4 h-px bg-zinc-800" />
          <IconButton icon={Square} onClick={() => addShape('rect')} label="Rectangle" />
          <IconButton icon={CircleIcon} onClick={() => addShape('circle')} label="Circle" />
          <IconButton icon={ImageIcon} onClick={() => fileInputRef.current?.click()} label="Upload Image" />
        </div>

        <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col z-10">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              {(['FRONT', 'BACK'] as const).map((s) => (
                <button key={s} onClick={() => { setEditSide(s); setSelectedId(null); }} 
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${editSide === s ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {s} SIDE
                </button>
              ))}
            </div>
          </div>
          <SidebarLayers layers={currentSideData} selectedId={selectedId} onSelect={setSelectedId} onAddShape={addShape} onAddText={addText} onUploadImage={() => fileInputRef.current?.click()} />
        </div>

        <div className="flex-1 relative bg-[#18181b] flex flex-col overflow-hidden">
          <div className="h-10 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 z-10">
            <div className="flex items-center gap-2">
              <IconButton icon={Grid3X3} active={showGrid} onClick={() => setShowGrid(!showGrid)} label="Toggle Grid" />
              <div className="w-px h-4 bg-zinc-800 mx-2" />
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Canvas: {DESIGN_WIDTH} x {DESIGN_HEIGHT}px</span>
            </div>
          </div>
          
          <div className="flex-1 flex relative overflow-auto">
            <RulerVertical zoom={zoom} />
            <div className="flex-1 flex flex-col">
              <RulerHorizontal zoom={zoom} />
              <div className="flex-1 overflow-auto bg-[#18181b] flex items-center justify-center p-12 relative">
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                    style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: `${20 * zoom}px ${20 * zoom}px` }} />
                )}
                
                <div className="shadow-2xl bg-white relative" style={{ width: DESIGN_WIDTH * zoom, height: DESIGN_HEIGHT * zoom }}>
                  <Stage ref={stageRef} width={DESIGN_WIDTH * zoom} height={DESIGN_HEIGHT * zoom} scaleX={zoom} scaleY={zoom} onMouseDown={(e) => e.target === e.target.getStage() && setSelectedId(null)}>
                    <Layer ref={layerRef}>
                      {Object.entries(currentSideData).map(([key, config]: any) => (
                        <CanvasElement 
                          key={key} id={key} config={config} isSelected={selectedId === key} zoom={zoom}
                          image={key === 'photo' ? photoImage : key === 'signature' ? sigImage : undefined}
                          previewText={(previewData as any)?.[key] || (key === 'course' ? templateName : undefined)}
                          onSelect={setSelectedId} onUpdate={updateItem} 
                          onDragMove={handleDragMove}
                          onDragEnd={(e) => {
                            updateItem(key, { x: Math.round(e.target.x()), y: Math.round(e.target.y()) });
                            setSnapLines({ vertical: [], horizontal: [] });
                          }}
                          onTransform={handleTransform} onTransformEnd={handleTransformEnd}
                          anyItemSelected={!!selectedId}
                        />
                      ))}

                      {snapEnabled && showSnapGuides && snapLines.vertical.map((v, i) => (
                        <Line
                          key={`v-${i}`}
                          points={[v, -5000, v, 5000]}
                          stroke="#ff6b6b" strokeWidth={1 / zoom} dash={[5, 5]} listening={false}
                        />
                      ))}
                      {snapEnabled && showSnapGuides && snapLines.horizontal.map((h, i) => (
                        <Line
                          key={`h-${i}`}
                          points={[-5000, h, 5000, h]}
                          stroke="#ff6b6b" strokeWidth={1 / zoom} dash={[5, 5]} listening={false}
                        />
                      ))}

                      <Transformer 
                        ref={trRef} 
                        rotateEnabled={true} 
                        enabledAnchors={getEnabledAnchors(selectedId ? currentSideData[selectedId] : null)}
                        keepRatio={selectedId ? (currentSideData[selectedId]?.fit === 'stretch' || ['photo', 'signature'].includes(selectedId) || selectedId.startsWith('img')) : false} 
                        boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10) ? oldBox : newBox}
                      />
                    </Layer>
                  </Stage>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-72 border-l border-zinc-800 bg-zinc-900 p-6 flex flex-col gap-6 overflow-y-auto">
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Properties</span>
          <PropertyPanel 
            selectedId={selectedId}
            config={selectedId ? currentSideData[selectedId] : null}
            onUpdate={updateItem}
            onDelete={handleDelete}
            onMoveLayer={moveLayer}
            isTextLayer={isTextLayer}
          />
        </div>
      </div>
    </div>
  );
};

export default CardDesigner;