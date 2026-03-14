
import React, { useState } from 'react';
import {
  Square, Type, Layers, Box, Circle as CircleIcon,
  ImageIcon, Hash, User, PenTool, Copy, Eye, EyeOff,
  Trash2, Edit3, Check, X, MoreVertical, GripVertical, Plus
} from 'lucide-react';
import { type LayoutItemSchema } from '../../types/designer';

interface SidebarLayersProps {
  layers: Record<string, LayoutItemSchema>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddShape: (type: 'rect' | 'circle') => void;
  onAddText: () => void;
  onUploadImage: () => void;
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
    if (key === 'photo') return <User size={13} className="text-emerald-400" />;
    if (key === 'signature') return <PenTool size={13} className="text-amber-400" />;
    if (key.startsWith('img') || type === 'image') return <ImageIcon size={13} className="text-indigo-400" />;
    if (key.startsWith('rect') || type === 'rect') return <Square size={13} className="text-zinc-400" />;
    if (key.startsWith('circle') || type === 'circle') return <CircleIcon size={13} className="text-zinc-400" />;
    return <Type size={13} className="text-zinc-400" />;
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
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 select-none overflow-hidden">

      {/* ── ASSETS SECTION ── */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/20">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
            <Box size={14} className="text-zinc-600" /> Assets
          </span>
          <Plus size={12} className="text-zinc-700" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: Square, label: 'Rect', action: () => onAddShape('rect'), color: 'text-zinc-400', hover: 'hover:bg-zinc-500/10 hover:border-zinc-500/30' },
            { icon: CircleIcon, label: 'Circle', action: () => onAddShape('circle'), color: 'text-zinc-400', hover: 'hover:bg-zinc-500/10 hover:border-zinc-500/30' },
            { icon: Type, label: 'Text', action: onAddText, color: 'text-indigo-400', hover: 'hover:bg-indigo-500/10 hover:border-indigo-500/30' },
            { icon: ImageIcon, label: 'Image', action: onUploadImage, color: 'text-emerald-400', hover: 'hover:bg-emerald-500/10 hover:border-emerald-500/30' }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm transition-all group active:scale-95 ${item.hover}`}
            >
              <item.icon size={18} className={`${item.color} group-hover:scale-110 transition-transform`} />
              <span className="text-[8px] font-black mt-2 uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── LAYERS SECTION ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/50">
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/40">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] flex items-center gap-2">
            <Layers size={14} className="text-zinc-500" /> Layers
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/50 text-[9px] font-mono font-bold text-zinc-400">
              {Object.keys(layers || {}).length}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {layers && Object.entries(layers).reverse().map(([id, config]) => {
            const isSelected = selectedId === id;
            const isEditing = editingId === id;
            const isHidden = config.visible === false;

            return (
              <div key={id} className="group relative">
                {/* Visual Drag Handle Affordance */}
                <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-zinc-700">
                  <GripVertical size={12} />
                </div>

                <div
                  onClick={() => onSelect(id)}
                  onDoubleClick={() => handleStartRename(id, (config as any).name || id)}
                  className={`relative flex items-center gap-3 ml-4 mr-1 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${isSelected
                      ? 'bg-indigo-500/10 border-indigo-500/40 shadow-lg shadow-indigo-500/5 z-10'
                      : 'bg-transparent border-transparent hover:bg-zinc-800/80 hover:border-zinc-700/30'
                    } ${isHidden ? 'opacity-50' : 'opacity-100'}`}
                >
                  <div className={`shrink-0 ${isSelected ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                    {getIcon(id, config.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          className="bg-zinc-950 border border-indigo-500/50 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-zinc-200 w-full outline-none shadow-inner"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleConfirmRename(id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onBlur={() => handleConfirmRename(id)}
                        />
                        <button onClick={() => handleConfirmRename(id)} className="text-emerald-500 hover:text-emerald-400">
                          <Check size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className={`text-[11px] font-bold truncate leading-tight ${isSelected ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'} transition-colors`}>
                          {(config as any).name || id.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[8px] font-mono font-black text-zinc-600 uppercase">
                            {config.type || (id.startsWith('rect') ? 'rect' : id.startsWith('circle') ? 'circle' : 'text')}
                          </span>
                          <span className="text-[8px] font-mono text-zinc-700">
                            {Math.round(config.x)}, {Math.round(config.y)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={`flex items-center gap-1.5 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity shrink-0`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleVisibility(id); }}
                      className={`p-1 transition-colors ${isHidden ? 'text-zinc-700 hover:text-zinc-400' : 'text-zinc-500 hover:text-zinc-100'}`}
                      title={isHidden ? "Show Layer" : "Hide Layer"}
                    >
                      {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>

                    {isSelected && !isEditing && (
                      <div className="flex items-center gap-0.5 border-l border-zinc-800 ml-1 pl-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onDuplicate(id); }}
                          className="p-1 text-zinc-500 hover:text-indigo-400 transition-colors"
                          title="Duplicate"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {(!layers || Object.keys(layers).length === 0) && (
            <div className="py-24 text-center">
              <div className="w-12 h-12 bg-zinc-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800/50">
                <Layers size={20} strokeWidth={1} className="text-zinc-700" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">No Layers</p>
              <p className="text-[9px] text-zinc-700 mt-2 font-medium">Add an asset to start</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarLayers;