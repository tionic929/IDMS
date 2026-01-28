import React, { useRef } from 'react';
import { Square, Type, Layers, Box, Circle as CircleIcon, ImageIcon, Hash, User, PenTool } from 'lucide-react';
import { type LayoutItemSchema } from '../../types/designer';

interface SidebarLayersProps {
  layers: Record<string, LayoutItemSchema>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddShape: (type: 'rect' | 'circle') => void;
  onAddText: () => void;
  onUploadImage: () => void;
}

const SidebarLayers: React.FC<SidebarLayersProps> = ({ layers, selectedId, onSelect, onAddShape, onAddText, onUploadImage }) => {
  const getIcon = (key: string, type?: string) => {
    if (key === 'photo') return <User size={12} className="text-emerald-400" />;
    if (key === 'signature') return <PenTool size={12} className="text-amber-400" />;
    if (key.startsWith('img') || type === 'image') return <ImageIcon size={12} className="text-indigo-400" />;
    if (key.startsWith('rect')) return <Square size={12} className="text-zinc-400" />;
    if (key.startsWith('circle')) return <CircleIcon size={12} className="text-zinc-400" />;
    return <Type size={12} className="text-zinc-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50">
      {/* 1. Library Section */}
      <div className="p-4 border-b border-zinc-800">
        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2 mb-4">
          <Box size={14} /> Library
        </span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Square, label: 'Rect', action: () => onAddShape('rect') },
            { icon: CircleIcon, label: 'Circle', action: () => onAddShape('circle') },
            { icon: Type, label: 'Text', action: onAddText },
            { icon: ImageIcon, label: 'Image', action: onUploadImage }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-zinc-400 group"
            >
              <item.icon size={18} className="group-hover:text-zinc-200" />
              <span className="text-[8px] font-bold mt-1.5 uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Layers Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/30">
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
            <Layers size={14} /> Layers
          </span>
          <span className="text-[9px] font-mono text-zinc-600">{Object.keys(layers || {}).length}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
          {layers && Object.entries(layers).reverse().map(([key, config]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${
                selectedId === key
                  ? 'bg-indigo-500/10 border border-indigo-500/30'
                  : 'bg-transparent border border-transparent hover:bg-zinc-800'
              }`}
            >
              <div className="opacity-60 group-hover:opacity-100">
                {getIcon(key, config.type)}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className={`text-[11px] font-medium truncate w-full ${selectedId === key ? 'text-indigo-400' : 'text-zinc-400'}`}>
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="text-[8px] font-mono text-zinc-600">
                  {Math.round(config.x)}, {Math.round(config.y)}
                </span>
              </div>
            </button>
          ))}
          {(!layers || Object.keys(layers).length === 0) && (
            <div className="py-10 text-center opacity-20">
              <Layers size={24} className="mx-auto mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-tight">Empty Layer List</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarLayers;