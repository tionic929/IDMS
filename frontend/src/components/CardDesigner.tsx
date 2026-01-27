import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { RefreshCw, Save, ZoomIn, ZoomOut, Download, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';

import FRONT_BG from '../assets/ID/NEWFRONT.png';
import BACK_BG from '../assets/ID/BACK.png';
import { type Students } from '../types/students';
import { saveLayout } from '../api/templates';
import { type LayoutItemSchema } from '../types/designer';
import { getEnabledAnchors, getNewElementPosition, reorderLayer } from '../utils/designerUtils';

// Components
import SidebarLayers from './Designer/SidebarLayers';
import PropertyPanel from './Designer/PropertyPanel';
import CanvasElement from './Designer/CanvasElement';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentLayout) setTempLayout(currentLayout);
  }, [currentLayout]);

  const getProxyUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('blob:')) return path;
    const storagePath = `${VITE_API_URL}/storage/`;
    let cleanPath = path;
    if (path.startsWith(storagePath)) {
      cleanPath = path.replace(storagePath, '');
    }
    return `${VITE_API_URL}/api/proxy-image?path=${encodeURIComponent(cleanPath)}`;
  };

  // --- DATA & IMAGES ---
  const latestStudent = useMemo(() => {
    if (!allStudents || !Array.isArray(allStudents)) return null;
    const pending = allStudents.filter(s => !s.has_card);
    return [...pending].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0] || null;
  }, [allStudents]);

  const previewData = useMemo(() => {
    if (!latestStudent) return null;
    return {
      fullName: `${latestStudent.first_name} ${latestStudent.last_name}`,
      idNumber: latestStudent.id_number,
      course: templateName || latestStudent.course || "COURSE",
      photo: getProxyUrl(latestStudent.id_picture),
      signature: getProxyUrl(latestStudent.signature_picture),
      guardian_name: latestStudent.guardian_name,
      guardian_contact: latestStudent.guardian_contact,
      address: latestStudent.address,
    };
  }, [latestStudent, templateName]);

  const [bgImage] = useImage(editSide === 'FRONT' ? FRONT_BG : BACK_BG, 'anonymous');
  const [photoImage] = useImage(previewData?.photo || '', 'anonymous');
  const [sigImage] = useImage(previewData?.signature || '', 'anonymous');

  // --- ACTIONS ---
  const updateItem = (id: string, attrs: any) => {
    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: { ...prev[side], [id]: { ...prev[side][id], ...attrs } }
    }));
  };

  // RESTORED: Image Upload Logic
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("Image is large, compressing for optimal performance...");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const side = editSide.toLowerCase();
      const id = `img_${Date.now()}`;
      
      // Create new image layer
      const newImage = {
        type: 'image',
        src: src, // Store Base64 directly in config
        x: 50, y: 50, width: 200, height: 200,
        opacity: 1, rotation: 0
      };

      const img = new Image();
      img.onload = () => {
        const side = editSide.toLowerCase();
        const id = `img_${Date.now()}`;

        const defaultWidth = 200;
        const aspectRatio = img.height / img.width;
        const proportionateHeight = Math.round(defaultWidth * aspectRatio);

        const newImage = {
          type: 'image',
          src: src,
          x: 50,
          y: 50,
          width: defaultWidth,
          height: proportionateHeight, // Now proportionate!
          opacity: 1,
          rotation: 0
        };
        setTempLayout((prev: any) => ({
          ...prev,
          [side]: { ...prev[side], [id]: newImage }
        }));
        setSelectedId(id);
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
      type: 'text',
      x: 50, y: 50,
      width: 200, height: 40,
      text: 'New Text',
      fontSize: 20,
      fill: '#000000',
      rotation: 0
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

  // --- TRANSFORM LOGIC ---
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
      x: Math.round(node.x()), y: Math.round(node.y()),
      width: Math.round(node.width()), height: Math.round(node.height()),
      rotation: Math.round(node.rotation()),
    };
    if (textNode && config.fit === 'stretch') finalUpdates.fontSize = Math.round(textNode.fontSize());
    updateItem(key, finalUpdates);
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

  // --- SAVING ---
  const getStagePNGForSide = async (side: 'FRONT' | 'BACK') => {
    setEditSide(side);
    await new Promise(resolve => setTimeout(resolve, 150));
    if (stageRef.current) return stageRef.current.toDataURL({ pixelRatio: 3.4375, mimeType: 'image/png' });
    return '';
  };

  const handleSaveLayout = async () => {
    if (!templateId) return toast.error("Please select a template first");
    setIsSaving(true);
    try {
      const frontPng = await getStagePNGForSide('FRONT');
      const backPng = await getStagePNGForSide('BACK');
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
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 3.4375, mimeType: 'image/png' });
      const link = document.createElement('a');
      link.download = `${previewData?.idNumber || 'ID'}_${editSide}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 50);
  };

  const isTextLayer = (key: string) => !['photo', 'signature'].includes(key) && !key.startsWith('rect') && !key.startsWith('circle') && !key.startsWith('img');
  const currentSideData = tempLayout[editSide.toLowerCase()] || {};

  return (
    <div className="flex flex-col h-[85vh] bg-slate-50 dark:bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      
      {/* HEADER */}
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
          
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <ImageIcon size={14} /> Upload Image
          </button>
          
          <button onClick={handleExportPNG} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-teal-600 hover:bg-teal-50 rounded-xl transition-all"><Download size={14} /> Export PNG</button>
          <button onClick={() => setTempLayout(currentLayout)} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-orange-500 transition-colors"><RefreshCw size={14} /> Reset</button>
          <button onClick={handleSaveLayout} disabled={isSaving} className={`flex items-center gap-2 px-6 py-2 bg-teal-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg transition-all ${isSaving ? 'opacity-70' : 'hover:scale-105 active:scale-95'}`}>
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} {isSaving ? 'Rendering...' : 'Save Layout'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <SidebarLayers layers={currentSideData} selectedId={selectedId} onSelect={setSelectedId} onAddShape={addShape} onAddText={addText} onUploadImage={() => fileInputRef.current?.click()} />

        {/* CANVAS AREA */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-10 overflow-auto">
          <div className="shadow-2xl rounded-lg overflow-hidden bg-white" style={{ width: DESIGN_WIDTH * zoom, height: DESIGN_HEIGHT * zoom }}>
            <Stage ref={stageRef} width={DESIGN_WIDTH * zoom} height={DESIGN_HEIGHT * zoom} scaleX={zoom} scaleY={zoom} onMouseDown={(e) => e.target === e.target.getStage() && setSelectedId(null)}>
              <Layer ref={layerRef}>
                {editSide === 'FRONT' && tempLayout.front && Object.entries(tempLayout.front).map(([key, config]: any) => {
                   if (key === 'photo' || key === 'signature') {
                      return ( 
                      <CanvasElement 
                        key={key} id={key} config={config} isSelected={selectedId === key} zoom={zoom}
                        image={key === 'photo' ? photoImage : undefined}
                        onSelect={setSelectedId} onUpdate={updateItem} onTransform={handleTransform} onTransformEnd={handleTransformEnd}
                        anyItemSelected={!!selectedId}
                      />
                      )
                   }
                   return null;
                })}

                {/* <KonvaImage image={bgImage} width={DESIGN_WIDTH} height={DESIGN_HEIGHT} listening={false} opacity={(selectedId === 'photo' || selectedId === 'signature') ? 0.4 : 1} /> */}

                {tempLayout && tempLayout[editSide.toLowerCase()] && Object.entries(tempLayout[editSide.toLowerCase()]).map(([key, config]: any) => {
                   const isShape = key.startsWith('rect') || key.startsWith('circle') || key.startsWith('img');
                   const isText = isTextLayer(key);
                   
                   if (editSide === 'BACK') {
                      return <CanvasElement 
                        key={key} id={key} config={config} isSelected={selectedId === key} zoom={zoom}
                        previewText={(previewData as any)?.[key]}
                        onSelect={setSelectedId} onUpdate={updateItem} onTransform={handleTransform} onTransformEnd={handleTransformEnd}
                        anyItemSelected={!!selectedId}
                      />
                   }
                   if (editSide === 'FRONT' && (isShape || isText)) {
                      let pText = (previewData as any)?.[key];
                      if(key === 'course') pText = templateName || pText;
                      return <CanvasElement 
                        key={key} id={key} config={config} isSelected={selectedId === key} zoom={zoom}
                        previewText={pText}
                        onSelect={setSelectedId} onUpdate={updateItem} onTransform={handleTransform} onTransformEnd={handleTransformEnd}
                        anyItemSelected={!!selectedId}
                      />
                   }
                   return null;
                })}

                <Transformer 
                  ref={trRef} 
                  rotateEnabled={true} 
                  enabledAnchors={getEnabledAnchors(selectedId ? tempLayout[editSide.toLowerCase()][selectedId] : null)}
                  keepRatio={selectedId ? (tempLayout[editSide.toLowerCase()]?.[selectedId]?.fit === 'stretch' || ['photo', 'signature'].includes(selectedId) || selectedId.startsWith('img')) : false} 
                  boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10) ? oldBox : newBox}
                />
              </Layer>
            </Stage>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-6 overflow-y-auto">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Properties</span>
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