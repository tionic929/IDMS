
﻿import React from 'react';
import { useDesignerContext } from '../context/DesignerContext';
import { useLayerContext } from '../context/LayerContext';
import { Layers, Type, Square, Circle as CircleIcon, Image as ImageIcon, Eye, EyeOff, Trash2 } from 'lucide-react';

export const DesignerLayersSidebar: React.FC = () => {
  const { currentSideData, editSide, setEditSide } = useDesignerContext();
  const {
    selectedId,
    setSelectedId,
    handleDelete,
    handleToggleVisibility
  } = useLayerContext();

  const layers = currentSideData ? Object.entries(currentSideData) : [];

  return (
    <div className="w-64 border-r border-slate-200 bg-white flex flex-col z-10 shrink-0">
      {/* SIDE SWITCHER TABS */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50">
        <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200 shadow-inner">
          {['FRONT', 'BACK'].map((s: any) => (
            <button
              key={s}
              onClick={() => {
                setEditSide(s);
                setSelectedId(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${editSide === s
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Layers</h2>
        <Layers size={14} className="text-slate-300" />
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-1 scrollbar-hide">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-20 grayscale">
            <Layers size={32} strokeWidth={1} />
            <span className="text-[10px] mt-2 font-bold uppercase tracking-tighter text-slate-400">No Layers Available</span>
          </div>
        ) : (
          [...layers].reverse().map(([id, config]: any) => (
            <div
              key={id}
              onClick={() => setSelectedId(id)}
              className={`group flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer border ${selectedId === id
                ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-[1.02]'
                : 'hover:bg-slate-50 border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              <div className={`p-1.5 rounded-lg flex items-center justify-center ${selectedId === id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white border group-hover:border-slate-200'
                }`}>
                {id.includes('text') ? <Type size={14} /> : id.includes('rect') ? <Square size={14} /> : id.includes('circle') ? <CircleIcon size={14} /> : <ImageIcon size={14} />}
              </div>

              <span className={`text-[11px] flex-1 truncate font-bold tracking-tight ${selectedId === id ? 'text-white' : 'text-slate-600'}`}>
                {config.name || id.split('_')[0].toUpperCase()}
              </span>

              <div className={`flex items-center gap-1 transition-opacity duration-200 ${selectedId === id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleVisibility(id); }}
                  className={`p-1.5 rounded-lg transition-colors ${selectedId === id
                    ? 'hover:bg-white/20 text-white/70 hover:text-white'
                    : 'hover:bg-slate-200 text-slate-400 hover:text-slate-900'
                    }`}
                  title={config.visible !== false ? "Hide Layer" : "Show Layer"}
                >
                  {config.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(id); }}
                  className={`p-1.5 rounded-lg transition-colors ${selectedId === id
                    ? 'hover:bg-red-500 text-white/70 hover:text-white'
                    : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                    }`}
                  title="Delete Layer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 border border-slate-200">{layers.length} Elements</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {editSide} VIEW
          </span>
        </div>
      </div>
    </div>
  );
};


