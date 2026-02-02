import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Transformer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { 
  Save, Square, Circle as CircleIcon, MousePointer2, 
  Minus, Plus, ChevronRight, Move, Image as ImageIcon, 
  Magnet, Download, RefreshCw,
  Grid3X3
} from 'lucide-react';
import { toast } from 'react-toastify';

import FRONT_BG_SRC from '../assets/ID/NEWFRONT.png';
import BACK_BG_SRC from '../assets/ID/BACK.png';
import { type Students } from '../types/students';
import { saveLayout } from '../api/templates';
import { type LayoutItemSchema } from '../types/designer';
import { getEnabledAnchors, reorderLayer } from '../utils/designerUtils';

import { 
  DESIGN_WIDTH, DESIGN_HEIGHT, EXPORT_PIXEL_RATIO,
  MIN_ZOOM, MAX_ZOOM, DEFAULT_ZOOM 
} from '../constants/dimensions';

import SidebarLayers from './Designer/SidebarLayers';
import PropertyPanel from './Designer/PropertyPanel';
import CanvasElement from './Designer/CanvasElement';

const VITE_API_URL = import.meta.env.VITE_API_URL;
const SNAP_DISTANCE = 5;

// --- RULER COMPONENTS ---
const RulerHorizontal = ({ zoom }: { zoom: number }) => (
  <div className="h-6 w-full bg-zinc-900 border-b border-zinc-800 relative overflow-hidden flex text-[9px] text-zinc-500 font-mono select-none">
    {Array.from({ length: 40 }).map((_, i) => (
      <div key={i} className="absolute bottom-0 border-l border-zinc-700 h-2" style={{ left: i * 50 * zoom }}>
        {i > 0 && <span className="absolute -top-4 -left-2">{i * 50}</span>}
      </div>
    ))}
  </div>
);

const RulerVertical = ({ zoom }: { zoom: number }) => (
  <div className="w-6 h-full bg-zinc-900 border-r border-zinc-800 relative overflow-hidden flex flex-col text-[9px] text-zinc-500 font-mono select-none">
    {Array.from({ length: 60 }).map((_, i) => (
      <div key={i} className="absolute right-0 border-t border-zinc-700 w-2" style={{ top: i * 50 * zoom }}>
          {i > 0 && <span className="absolute -left-5 -top-2 w-4 text-right">{i * 50}</span>}
      </div>
    ))}
  </div>
);

const IconButton = ({ icon: Icon, label, active, onClick, disabled }: any) => (
  <button 
    onClick={onClick} disabled={disabled} title={label}
    className={`p-2 rounded-lg transition-all flex items-center justify-center ${active ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
  const [isTransforming, setIsTransforming] = useState(false);

  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [frontBg] = useImage(FRONT_BG_SRC);
  const [backBg] = useImage(BACK_BG_SRC);

  useEffect(() => { if (currentLayout) setTempLayout(currentLayout); }, [currentLayout]);

  const getProxyUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
    const cleanPath = path.replace(`${VITE_API_URL}/storage/`, '');
    return `${VITE_API_URL}/api/proxy-image?path=${encodeURIComponent(cleanPath)}`;
  };

  const activeStudent = useMemo(() => {
    if (!allStudents?.length) return null;
    return [...allStudents].sort((a, b) => 
      new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    )[0];
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

  const [photoImage] = useImage(previewData?.photo || '', 'anonymous');
  const [sigImage] = useImage(previewData?.signature || '', 'anonymous');

  const updateItem = (id: string, attrs: any) => {
    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => ({
      ...prev, [side]: { ...prev[side], [id]: { ...prev[side][id], ...attrs } }
    }));
  };

  // --- REFINED SNAPPING LOGIC ---
  const getLineGuideStops = (skipShape: any) => {
    // Start with stage boundaries and center
    const vertical = [0, DESIGN_WIDTH / 2, DESIGN_WIDTH];
    const horizontal = [0, DESIGN_HEIGHT / 2, DESIGN_HEIGHT];

    // Add edges and centers of all other shapes
    layerRef.current.children.forEach((guideItem: any) => {
      if (guideItem === skipShape || guideItem.name() === 'background' || guideItem.getClassName() === 'Transformer' || guideItem.getClassName() === 'Line') {
        return;
      }

      // We use the node's own attributes for snapping to ensure accuracy
      const x = guideItem.x();
      const y = guideItem.y();
      const width = guideItem.width();
      const height = guideItem.height();

      vertical.push(x, x + width, x + width / 2);
      horizontal.push(y, y + height, y + height / 2);
    });

    return {
      vertical: Array.from(new Set(vertical)),
      horizontal: Array.from(new Set(horizontal)),
    };
  };

  const getObjectSnappingEdges = (node: any) => {
    const x = node.x();
    const y = node.y();
    const width = node.width();
    const height = node.height();

    return {
      vertical: [
        { guide: x, offset: 0, snap: 'start' },
        { guide: x + width / 2, offset: -width / 2, snap: 'center' },
        { guide: x + width, offset: -width, snap: 'end' },
      ],
      horizontal: [
        { guide: y, offset: 0, snap: 'start' },
        { guide: y + height / 2, offset: -height / 2, snap: 'center' },
        { guide: y + height, offset: -height, snap: 'end' },
      ],
    };
  };

  const handleDragMove = (e: any) => {
    if (!snapEnabled || isTransforming) return;
    
    const node = e.target;
    const stops = getLineGuideStops(node);
    const edges = getObjectSnappingEdges(node);

    const resultV: any[] = [];
    const resultH: any[] = [];

    // Find closest vertical snap
    stops.vertical.forEach((line) => {
      edges.vertical.forEach((edge) => {
        const diff = Math.abs(line - edge.guide);
        if (diff < SNAP_DISTANCE) {
          resultV.push({ line, diff, offset: edge.offset });
        }
      });
    });

    // Find closest horizontal snap
    stops.horizontal.forEach((line) => {
      edges.horizontal.forEach((edge) => {
        const diff = Math.abs(line - edge.guide);
        if (diff < SNAP_DISTANCE) {
          resultH.push({ line, diff, offset: edge.offset });
        }
      });
    });

    const activeSnapLines = { vertical: [] as number[], horizontal: [] as number[] };

    // Apply Snapping
    if (resultV.length > 0) {
      const closestV = resultV.sort((a, b) => a.diff - b.diff)[0];
      node.x(closestV.line + closestV.offset);
      activeSnapLines.vertical.push(closestV.line);
    }

    if (resultH.length > 0) {
      const closestH = resultH.sort((a, b) => a.diff - b.diff)[0];
      node.y(closestH.line + closestH.offset);
      activeSnapLines.horizontal.push(closestH.line);
    }

    setSnapLines(activeSnapLines);
  };

  // --- ACTIONS ---
  const addShape = (type: 'rect' | 'circle') => {
    const side = editSide.toLowerCase();
    const id = `${type}_${Date.now()}`;
    const newShape = { 
      x: 50, y: 50, width: 100, height: 100, 
      fill: '#6366f1', rotation: 0, opacity: 1, type: type, fit: 'none'
    };
    setTempLayout((prev: any) => ({ ...prev, [side]: { ...prev[side], [id]: newShape } }));
    setSelectedId(id);
  };

  const addText = () => {
    const side = editSide.toLowerCase();
    const id = `text_${Date.now()}`;
    const newText = {
      type: 'text', x: 50, y: 50, width: 200, height: 40, 
      text: 'New Text', fontSize: 20, fill: '#000000', rotation: 0, fit: 'none'
    };
    setTempLayout((prev: any) => ({ ...prev, [side]: { ...prev[side], [id]: newText } }));
    setSelectedId(id);
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
        const width = Math.min(DESIGN_WIDTH * 0.4, 200);
        const height = width * aspectRatio;
        const newImage = { 
          type: 'image', src, 
          x: (DESIGN_WIDTH - width)/2, y: (DESIGN_HEIGHT - height)/2, 
          width: Math.round(width), height: Math.round(height), 
          opacity: 1, rotation: 0 
        };
        setTempLayout((prev: any) => ({ ...prev, [side]: { ...prev[side], [id]: newImage } }));
        setSelectedId(id);
        toast.success("Image uploaded");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDelete = () => {
    if (!selectedId) return;
    const side = editSide.toLowerCase();
    const newLayout = { ...tempLayout };
    delete newLayout[side][selectedId];
    setTempLayout(newLayout);
    setSelectedId(null);
  };

  const moveLayer = (direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!selectedId) return;
    setTempLayout((prev: any) => ({
      ...prev, [editSide.toLowerCase()]: reorderLayer(prev[editSide.toLowerCase()], selectedId, direction)
    }));
  };

  // --- TRANSFORM HANDLERS ---
  const handleTransformStart = () => setIsTransforming(true);

  const handleTransform = (e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // 1. Calculate new dimensions and reset scale
    const newWidth = Math.max(10, node.width() * scaleX);
    const newHeight = Math.max(10, node.height() * scaleY);

    node.setAttrs({
      width: newWidth,
      height: newHeight,
      scaleX: 1,
      scaleY: 1
    });

    // 2. Find and update internal elements
    const textNode = node.findOne('Text');
    const imageNode = node.findOne('Image');
    const shapeNode = node.findOne('.Shape'); // Updated selector
    const boundsNode = node.findOne('.Bounds');

    if (textNode) { textNode.width(newWidth); textNode.height(newHeight); }
    if (imageNode) { imageNode.width(newWidth); imageNode.height(newHeight); }
    if (boundsNode) { boundsNode.width(newWidth); boundsNode.height(newHeight); }

    if (shapeNode) {
      if (shapeNode.getClassName() === 'Circle') {
        const radius = newWidth / 2;
        shapeNode.setAttrs({
          radius: radius,
          x: radius,
          y: radius
        });
      } else {
        shapeNode.setAttrs({
          width: newWidth,
          height: newHeight
        });
      }
    }
    
    layerRef.current?.batchDraw();
  };

  const handleTransformEnd = (e: any) => {
    setIsTransforming(false);
    const node = e.target;
    const nodeName = node.name();
    if (!nodeName) return;

    const textNode = node.findOne('Text');
    const side = editSide.toLowerCase();
    const config = tempLayout[side]?.[nodeName];
    
    const finalUpdates: any = {
      x: Math.round(node.x()), 
      y: Math.round(node.y()),
      width: Math.round(node.width()), 
      height: Math.round(node.height()),
      rotation: Math.round(node.rotation()),
    };

    if (textNode && config?.fit === 'stretch') {
      finalUpdates.fontSize = Math.round(textNode.fontSize());
    }

    setSnapLines({ vertical: [], horizontal: [] });
    updateItem(nodeName, finalUpdates);
  };

  useEffect(() => {
    if (!trRef.current) return;
    const transformer = trRef.current;
    transformer.on('transformstart', handleTransformStart);
    transformer.on('transform', handleTransform);
    transformer.on('transformend', handleTransformEnd);
    return () => {
      transformer.off('transformstart', handleTransformStart);
      transformer.off('transform', handleTransform);
      transformer.off('transformend', handleTransformEnd);
    };
  }, [tempLayout, editSide]);

  const handleSaveLayout = async () => {
    if (!templateId) return toast.error("Select a template");
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
    } catch (e) { 
      console.error(e); 
      toast.error("Save failed");
    } finally { 
      setIsSaving(false); 
    }
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

  useEffect(() => {
    const selectedNode = stageRef.current.findOne('.' + selectedId);
    if (selectedNode) {
      trRef.current.nodes([selectedNode]);
    } else {
      trRef.current.nodes([]);
    }
  }, [selectedId, editSide]);

  const isTextLayer = (id: string) => 
    !['photo','signature'].includes(id) && 
    !id.startsWith('rect') && 
    !id.startsWith('circle') && 
    !id.startsWith('img');

  const currentSideData = tempLayout[editSide.toLowerCase()] || {};

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-200 overflow-hidden font-sans border border-zinc-800 shadow-2xl select-none">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      
      {/* --- TOP BAR --- */}
      <div className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>Project</span>
          <ChevronRight size={12} />
          <span className="text-zinc-100 font-medium">{templateName}</span>
        </div>
        <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
          <IconButton icon={Minus} onClick={() => setZoom(prev => Math.max(MIN_ZOOM, prev - 0.1))} label="Zoom Out" />
          <span className="text-[10px] w-10 text-center font-mono text-zinc-400">{Math.round(zoom * 100)}%</span>
          <IconButton icon={Plus} onClick={() => setZoom(prev => Math.min(MAX_ZOOM, prev + 0.1))} label="Zoom In" />
          <div className="w-px h-4 bg-zinc-700 mx-1" />
          <IconButton icon={Magnet} active={snapEnabled} onClick={() => setSnapEnabled(!snapEnabled)} label={`Snapping ${snapEnabled ? 'ON' : 'OFF'}`} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSaveLayout} disabled={isSaving} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold transition-all">
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <IconButton icon={Download} onClick={handleExportPNG} label="Export" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* --- LEFT TOOLBAR --- */}
        <div className="w-12 border-r border-zinc-800 bg-zinc-900 flex flex-col items-center py-4 gap-3 z-20">
          <IconButton icon={MousePointer2} active={activeTool === 'select'} onClick={() => setActiveTool('select')} label="Select" />
          <IconButton icon={Move} active={activeTool === 'hand'} onClick={() => setActiveTool('hand')} label="Pan" />
          <div className="w-4 h-px bg-zinc-800" />
          <IconButton icon={Square} onClick={() => addShape('rect')} label="Rectangle" />
          <IconButton icon={CircleIcon} onClick={() => addShape('circle')} label="Circle" />
          <IconButton icon={ImageIcon} onClick={() => fileInputRef.current?.click()} label="Upload Image" />
        </div>

        {/* --- LAYERS SIDEBAR --- */}
        <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col z-10">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              {['FRONT', 'BACK'].map((s: any) => (
                <button 
                  key={s} 
                  onClick={() => { setEditSide(s); setSelectedId(null); }} 
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                    editSide === s ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {s} SIDE
                </button>
              ))}
            </div>
          </div>
          <SidebarLayers 
            layers={currentSideData} 
            selectedId={selectedId} 
            onSelect={setSelectedId} 
            onAddShape={addShape} 
            onAddText={addText} 
            onUploadImage={() => fileInputRef.current?.click()} 
          />
        </div>

        {/* --- CANVAS AREA --- */}
        <div className="flex-1 relative bg-[#18181b] flex flex-col overflow-hidden">
          <div className="h-10 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 z-10">
            <div className="flex items-center gap-2">
              <IconButton icon={Grid3X3} active={showGrid} onClick={() => setShowGrid(!showGrid)} label="Toggle Grid" />
              <div className="w-px h-4 bg-zinc-800 mx-2" />
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Canvas: {DESIGN_WIDTH} × {DESIGN_HEIGHT}px</span>
            </div>
          </div>

          <div className="flex-1 flex relative overflow-auto">
            <RulerVertical zoom={zoom} />
            <div className="flex-1 flex flex-col">
              <RulerHorizontal zoom={zoom} />
              <div className="flex-1 overflow-auto bg-[#18181b] flex items-center justify-center p-12 relative">
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                    style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: `${20 * zoom}px ${20 * zoom}px` }} 
                  />
                )}
                
                <div className="shadow-2xl bg-white relative" style={{ width: DESIGN_WIDTH * zoom, height: DESIGN_HEIGHT * zoom }}>
                  <Stage 
                    ref={stageRef} 
                    width={DESIGN_WIDTH * zoom} 
                    height={DESIGN_HEIGHT * zoom} 
                    scaleX={zoom} 
                    scaleY={zoom} 
                    onMouseDown={(e) => e.target === e.target.getStage() && setSelectedId(null)}
                  >
                    <Layer ref={layerRef}>
                      {/* Background Image */}
                      <KonvaImage 
                        name="background"
                        image={editSide === 'FRONT' ? frontBg : backBg} 
                        width={DESIGN_WIDTH} 
                        height={DESIGN_HEIGHT} 
                        listening={false} 
                      />

                      {/* Designer Elements */}
                      {Object.entries(currentSideData).map(([key, config]: any) => (
                        <CanvasElement 
                          key={key} 
                          id={key} 
                          config={config} 
                          isSelected={selectedId === key} 
                          zoom={zoom}
                          image={key === 'photo' ? photoImage : key === 'signature' ? sigImage : undefined}
                          previewText={(previewData as any)?.[key] || (key === 'course' ? templateName : undefined)}
                          onSelect={setSelectedId} 
                          onUpdate={updateItem} 
                          onDragMove={handleDragMove}
                          onDragEnd={(e) => { 
                            updateItem(key, { x: Math.round(e.target.x()), y: Math.round(e.target.y()) }); 
                            setSnapLines({ vertical: [], horizontal: [] }); 
                          }}
                          anyItemSelected={!!selectedId}
                        />
                      ))}

                      {/* Snap Guide Lines */}
                      {snapEnabled && showSnapGuides && snapLines.vertical.map((v, i) => (
                        <Line
                          key={`v-${i}`}
                          points={[v, -5000, v, 5000]}
                          stroke="#ff6b6b" 
                          strokeWidth={1 / zoom} 
                          dash={[5, 5]} 
                          listening={false}
                        />
                      ))}
                      {snapEnabled && showSnapGuides && snapLines.horizontal.map((h, i) => (
                        <Line
                          key={`h-${i}`}
                          points={[-5000, h, 5000, h]}
                          stroke="#ff6b6b" 
                          strokeWidth={1 / zoom} 
                          dash={[5, 5]} 
                          listening={false}
                        />
                      ))}
                      
                      <Transformer 
                        ref={trRef} 
                        rotateEnabled={true} 
                        enabledAnchors={getEnabledAnchors(selectedId ? currentSideData[selectedId] : null)} 
                        // Refinement: Force proportional resize for circles and images
                        keepRatio={selectedId ? (
                          ['photo', 'signature'].includes(selectedId) || 
                          selectedId.startsWith('img') || 
                          selectedId.startsWith('circle')
                        ) : false}
                        // Refinement: Change anchor style to look more professional
                        anchorSize={10}
                        anchorCornerRadius={3.5}
                        borderStrokeWidth={2}
                        anchorStroke="teal"
                        borderStroke="white"
                        boundBoxFunc={(oldBox, newBox) => {
                          if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) return oldBox;
                          return newBox;
                        }}
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