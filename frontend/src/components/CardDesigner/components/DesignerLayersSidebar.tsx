
import React from 'react';
import { useDesignerContext } from '../context/DesignerContext';
import { useLayerContext } from '../context/LayerContext';
import {
  Layers, Type, Square, Circle as CircleIcon, Image as ImageIcon,
  Eye, EyeOff, Trash2, Focus, GripVertical
} from 'lucide-react';

const TYPE_ICON: Record<string, React.ElementType> = {
  text: Type,
  rect: Square,
  circle: CircleIcon,
  image: ImageIcon,
};

function getIcon(id: string, config: any): React.ElementType {
  if (config.type && TYPE_ICON[config.type]) return TYPE_ICON[config.type];
  if (id.includes('text')) return Type;
  if (id.includes('rect')) return Square;
  if (id.includes('circle')) return CircleIcon;
  return ImageIcon;
}

function getDefaultName(id: string, config: any): string {
  if (config.name) return config.name;
  const typePart = config.type || id.split('_')[0];
  const labels: Record<string, string> = {
    text: 'Text', rect: 'Rectangle', circle: 'Circle',
    image: 'Image', img: 'Image', photo: 'Photo', signature: 'Signature'
  };
  const label = labels[typePart] || typePart;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export const DesignerLayersSidebar: React.FC = () => {
  const { currentSideData, editSide, setEditSide, updateItem } = useDesignerContext();
  const {
    selectedId,
    setSelectedId,
    handleDelete,
    handleToggleVisibility,
    handleAutoFitLayer
  } = useLayerContext();

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const layers = currentSideData ? Object.entries(currentSideData) : [];

  const startRename = (id: string, config: any) => {
    setEditingId(id);
    setEditingName(config.name || getDefaultName(id, config));
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const commitRename = () => {
    if (editingId && editingName.trim()) {
      updateItem(editingId, { name: editingName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="w-56 border-r border-slate-200 bg-white flex flex-col z-10 shrink-0">

      {/* SIDE SWITCHER */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50">
        <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200 shadow-inner">
          {(['FRONT', 'BACK'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setEditSide(s); setSelectedId(null); }}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${editSide === s
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* HEADER */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Layers</h2>
        <Layers size={12} className="text-slate-300" />
      </div>

      {/* LAYER LIST */}
      <div className="flex-1 overflow-auto p-2 space-y-0.5 scrollbar-hide">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-20">
            <Layers size={28} strokeWidth={1} />
            <span className="text-[10px] mt-2 font-bold uppercase tracking-tighter text-slate-400">No Layers</span>
          </div>
        ) : (
          [...layers].reverse().map(([id, config]: any) => {
            const Icon = getIcon(id, config);
            const name = getDefaultName(id, config);
            const isSelected = selectedId === id;
            const isHidden = config.visible === false;

            return (
              <div
                key={id}
                onClick={() => setSelectedId(id)}
                onDoubleClick={() => startRename(id, config)}
                className={`
                  group flex items-center gap-2 px-2 py-2 rounded-xl transition-all cursor-pointer border
                  ${isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                    : 'hover:bg-slate-50 border-transparent text-slate-500 hover:text-slate-900'
                  }
                  ${isHidden ? 'opacity-50' : ''}
                `}
              >
                {/* Drag handle (visual affordance) */}
                <GripVertical
                  size={12}
                  className={`shrink-0 cursor-grab ${isSelected ? 'text-white/30' : 'text-slate-200 group-hover:text-slate-300'}`}
                />

                {/* Type icon */}
                <div className={`p-1 rounded-lg shrink-0 ${isSelected ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-white group-hover:border group-hover:border-slate-200'}`}>
                  <Icon size={11} className={isSelected ? 'text-white' : 'text-slate-400'} />
                </div>

                {/* Name — editable on double-click */}
                {editingId === id ? (
                  <input
                    ref={inputRef}
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null); }}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 min-w-0 text-[11px] font-bold bg-white text-slate-900 rounded-md px-1.5 py-0.5 outline-none border border-slate-300 shadow-sm"
                  />
                ) : (
                  <span className={`flex-1 text-[11px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-600'}`} title={config.name || name}>
                    {config.name || name}
                  </span>
                )}

                {/* Action icons */}
                <div className={`flex items-center gap-0.5 transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button
                    onClick={e => { e.stopPropagation(); handleToggleVisibility(id); }}
                    className={`p-1 rounded-md transition-colors ${isSelected ? 'hover:bg-white/20 text-white/70 hover:text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'}`}
                    title={isHidden ? 'Show Layer' : 'Hide Layer'}
                  >
                    {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleAutoFitLayer(id); }}
                    className={`p-1 rounded-md transition-colors ${isSelected ? 'hover:bg-white/20 text-white/70 hover:text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'}`}
                    title="Auto-fit Layer"
                  >
                    <Focus size={11} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(id); }}
                    className={`p-1 rounded-md transition-colors ${isSelected ? 'hover:bg-red-500 text-white/70 hover:text-white' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
                    title="Delete Layer"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 border border-slate-200 text-[9px]">
            {layers.length} layer{layers.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {editSide}
          </span>
        </div>
      </div>
    </div>
  );
};
