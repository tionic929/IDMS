import React, { useRef } from 'react';
import { Square, Type, Layers, Box, Circle as CircleIcon, ImageIcon } from 'lucide-react';
import { type LayoutItemSchema } from '../../types/designer';

interface SidebarLayersProps {
  layers: Record<string, LayoutItemSchema>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddShape: (type: 'rect' | 'circle') => void;
  onAddText: () => void;
  onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SidebarLayers: React.FC<SidebarLayersProps> = ({ layers, selectedId, onSelect, onAddShape, onAddText, onUploadImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-6">
      <div>
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-3">
          <Box size={14} /> Library
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onAddShape('rect')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-50 transition-colors text-slate-500">
            <Square size={20} />
            <span className="text-[8px] font-bold mt-1 uppercase">Rect</span>
          </button>
          <button onClick={() => onAddShape('circle')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-50 transition-colors text-slate-500">
            <CircleIcon size={20} />
            <span className="text-[8px] font-bold mt-1 uppercase">Circle</span>
          </button>
          <button onClick={onAddText} className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-50 transition-colors text-slate-500">
            <Type size={20} />
            <span className="text-[8px] font-bold mt-1 uppercase">Text</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-50 transition-colors text-slate-500">
            <ImageIcon size={20} />
            <span className="text-[8px] font-bold mt-1 uppercase">Upload</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={onUploadImage} 
            />
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-3">
          <Layers size={14} /> Layers
        </span>
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
          {layers && Object.entries(layers).reverse().map(([key, pos]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`w-full p-3 rounded-xl border text-left transition-all ${
                selectedId === key
                  ? 'bg-teal-500/10 border-teal-500'
                  : 'bg-slate-50 dark:bg-slate-950 border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {key.includes('photo') || key.includes('signature') ? (
                  <Square size={12} className="text-teal-500" />
                ) : (
                  <Type size={12} className="text-teal-500" />
                )}
                <span className="text-[10px] font-bold uppercase truncate">
                  {key.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[8px] font-mono text-slate-400">
                <span>X: {Math.round(pos.x)}</span>
                <span>Y: {Math.round(pos.y)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SidebarLayers;