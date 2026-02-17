import React, { useState } from 'react';
import { 
  Square, Type, Layers, Box, Circle as CircleIcon, 
  ImageIcon, Hash, User, PenTool, Copy, Eye, EyeOff, 
  Trash2, Edit3, Check, X, MoreVertical 
} from 'lucide-react';
import { type LayoutItemSchema } from '../../types/designer';

interface SidebarLayersProps {
  layers: Record<string, LayoutItemSchema>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddShape: (type: 'rect' | 'circle') => void;
  onAddText: () => void;
  onUploadImage: () => void;
  // New Editing Functions
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

const SidebarLayers: React.FC<SidebarLayersProps> = ({ 
  layers, selectedId, onSelect, onAddShape, onAddText, onUploadImage,
  onDuplicate, onDelete, onToggleVisibility, onRename 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const getIcon = (key: string, type?: string) => {
    if (key === 'photo') return <User size={12} className="text-emerald-400" />;
    if (key === 'signature') return <PenTool size={12} className="text-amber-400" />;
    if (key.startsWith('img') || type === 'image') return <ImageIcon size={12} className="text-indigo-400" />;
    if (key.startsWith('rect')) return <Square size={12} className="text-zinc-400" />;
    if (key.startsWith('circle')) return <CircleIcon size={12} className="text-zinc-400" />;
    return <Type size={12} className="text-zinc-400" />;
  };

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const handleConfirmRename = (id: string) => {
    if (editValue.trim()) onRename(id, editValue.trim());
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/90 border-r border-zinc-800 select-none">
      {/* 1. Library Section */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/20">
        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2 mb-4">
          <Box size={14} /> Assets
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
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all text-zinc-400 group active:scale-95"
            >
              <item.icon size={18} className="group-hover:text-indigo-400 transition-colors" />
              <span className="text-[8px] font-black mt-1.5 uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Layers Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/40">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
            <Layers size={14} /> Layers
          </span>
          <div className="flex items-center gap-2">
             <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-mono text-zinc-400">{Object.keys(layers || {}).length}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {layers && Object.entries(layers).reverse().map(([id, config]) => {
            const isSelected = selectedId === id;
            const isEditing = editingId === id;

            return (
              <div key={id} className="group flex flex-col">
                <div
                  onClick={() => onSelect(id)}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                      : 'bg-transparent border-transparent hover:bg-zinc-800/50 hover:border-zinc-700/50'
                  }`}
                >
                  <div className={`${config.visible === false ? 'opacity-20' : 'opacity-60 group-hover:opacity-100'}`}>
                    {getIcon(id, config.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input 
                          autoFocus
                          className="bg-zinc-950 border border-indigo-500 rounded px-1.5 py-0.5 text-[11px] text-zinc-200 w-full outline-none"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleConfirmRename(id)}
                        />
                        <button onClick={() => handleConfirmRename(id)} className="text-emerald-500"><Check size={12}/></button>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-indigo-400' : 'text-zinc-300'} ${config.visible === false ? 'text-zinc-600' : ''}`}>
                          {id.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-600">
                          {Math.round(config.x)}x, {Math.round(config.y)}y
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contextual Actions Toolbar (Visible on selection or hover) */}
                  <div className={`flex items-center gap-1.5 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleVisibility(id); }}
                      className="p-1 hover:text-white text-zinc-500 transition-colors"
                      title="Toggle Visibility"
                    >
                      {config.visible !== false ? <Eye size={12} /> : <EyeOff size={12} className="text-zinc-700" />}
                    </button>
                    
                    {isSelected && !isEditing && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStartRename(id, id); }}
                          className="p-1 hover:text-indigo-400 text-zinc-500 transition-colors"
                          title="Rename"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDuplicate(id); }}
                          className="p-1 hover:text-indigo-400 text-zinc-500 transition-colors"
                          title="Duplicate"
                        >
                          <Copy size={12} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                          className="p-1 hover:text-red-400 text-zinc-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {(!layers || Object.keys(layers).length === 0) && (
            <div className="py-20 text-center opacity-20">
              <Layers size={32} strokeWidth={1} className="mx-auto mb-3" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Canvas Empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarLayers;