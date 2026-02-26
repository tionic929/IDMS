
﻿import React from 'react';

import { useDesignerContext } from '../context/DesignerContext';
import { useLayerContext } from '../context/LayerContext';
import PropertyPanel from '../../../components/Designer/PropertyPanel';


import {
  AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, Trash2, MousePointer2,
  ArrowUpToLine, ArrowDownToLine, Unlock, Lock,
  Type, Image as ImageIcon, Layers, Move,
  ChevronDown, Hexagon
} from 'lucide-react';

const PropertyGroup = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) => (
  <div className="border-b border-slate-100 pb-5 mb-5 last:border-0">
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={12} className="text-slate-400" />}
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const LabelWrapper = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={className}>
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block mb-1.5 ml-0.5">{label}</span>
    {children}
  </div>
);


export const DesignerPropertyPanel: React.FC = () => {
  const { currentSideData, updateItem } = useDesignerContext();
  const { selectedId, handleDelete, moveLayer } = useLayerContext();


  if (!selectedId || !currentSideData[selectedId]) {
    return (
      <div className="w-72 border-l border-slate-200 bg-white flex flex-col items-center justify-center p-8 text-center shrink-0">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
          <MousePointer2 size={24} className="text-slate-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Selection Properies</h3>
        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-bold tracking-tight px-4">
          Select an element on the canvas to view and edit its properties.
        </p>
      </div>
    );
  }

  const config = currentSideData[selectedId];
  const isText = config.type === 'text' || (!config.type && !['photo', 'signature'].includes(selectedId));
  const isImage = config.type === 'image' || ['photo', 'signature'].includes(selectedId);

  return (
    <div className="w-72 border-l border-slate-200 bg-white p-6 flex flex-col overflow-y-auto shrink-0 scrollbar-hide">

      {/* HEADER WITH ID/NAME */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/10">
            {isText ? <Type size={16} className="text-white" /> : isImage ? <ImageIcon size={16} className="text-white" /> : <Layers size={16} className="text-white" />}
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-tight text-slate-900">{config.type || 'ELEMENT'}</h2>
            <span className="text-[10px] text-slate-400 font-bold font-mono">#{selectedId.split('_')[0]}</span>
          </div>
        </div>

        <button
          onClick={() => updateItem(selectedId, { locked: !config.locked })}
          className={`p-2 rounded-xl border transition-all ${config.locked
            ? 'bg-orange-500/10 border-orange-200 text-orange-600'
            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-900'
            }`}
        >
          {config.locked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      </div>

      <PropertyGroup title="Alignment" icon={Layers}>
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-50 rounded-xl border border-slate-200">
          <button onClick={() => moveLayer('top')} title="Bring to Front" className="p-2 hover:bg-white text-slate-400 hover:text-slate-900 rounded-lg transition-all hover:shadow-sm"><ArrowUpToLine size={14} /></button>
          <button onClick={() => moveLayer('up')} title="Bring Forward" className="p-2 hover:bg-white text-slate-400 hover:text-slate-900 rounded-lg transition-all hover:shadow-sm"><ArrowUp size={14} /></button>
          <button onClick={() => moveLayer('down')} title="Send Backward" className="p-2 hover:bg-white text-slate-400 hover:text-slate-900 rounded-lg transition-all hover:shadow-sm"><ArrowDown size={14} /></button>
          <button onClick={() => moveLayer('bottom')} title="Send to Back" className="p-2 hover:bg-white text-slate-400 hover:text-slate-900 rounded-lg transition-all hover:shadow-sm"><ArrowDownToLine size={14} /></button>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Layout" icon={Move}>
        <div className="grid grid-cols-2 gap-4">
          <LabelWrapper label="Position X">
            <input type="number" value={Math.round(config.x || 0)} onChange={(e) => updateItem(selectedId, { x: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-900 transition-colors" />
          </LabelWrapper>
          <LabelWrapper label="Position Y">
            <input type="number" value={Math.round(config.y || 0)} onChange={(e) => updateItem(selectedId, { y: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-900 transition-colors" />
          </LabelWrapper>
          <LabelWrapper label="Width (W)">
            <input type="number" value={Math.round(config.width || 0)} onChange={(e) => updateItem(selectedId, { width: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-900 transition-colors" />
          </LabelWrapper>
          <LabelWrapper label="Height (H)">
            <input type="number" value={Math.round(config.height || 0)} onChange={(e) => updateItem(selectedId, { height: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-900 transition-colors" />
          </LabelWrapper>
          <LabelWrapper label="Rotation">
            <input type="number" value={config.rotation || 0} onChange={(e) => updateItem(selectedId, { rotation: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-900 transition-colors" />
          </LabelWrapper>
          <LabelWrapper label="Opacity">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <input type="number" min="0" max="100" value={Math.round((config.opacity ?? 1) * 100)} onChange={(e) => updateItem(selectedId, { opacity: parseInt(e.target.value) / 100 })} className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none" />
              <span className="text-[10px] font-black text-slate-400">%</span>
            </div>
          </LabelWrapper>
        </div>
      </PropertyGroup>

      {isText && (
        <PropertyGroup title="Typography" icon={Type}>
          <LabelWrapper label="Content">
            <textarea
              value={config.text || ''}
              onChange={(e) => updateItem(selectedId, { text: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 outline-none focus:border-slate-900 transition-colors h-24 resize-none leading-relaxed"
              placeholder="Enter text..."
            />
          </LabelWrapper>

          <div className="grid grid-cols-2 gap-4">
            <LabelWrapper label="Font Size">
              <input type="number" value={config.fontSize || 18} onChange={(e) => updateItem(selectedId, { fontSize: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none" />
            </LabelWrapper>
            <LabelWrapper label="Alignment">
              <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button onClick={() => updateItem(selectedId, { align: 'left' })} className={`flex-1 flex items-center justify-center p-1.5 rounded-lg ${config.align === 'left' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}><AlignLeft size={14} /></button>
                <button onClick={() => updateItem(selectedId, { align: 'center' })} className={`flex-1 flex items-center justify-center p-1.5 rounded-lg ${config.align === 'center' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}><AlignCenter size={14} /></button>
                <button onClick={() => updateItem(selectedId, { align: 'right' })} className={`flex-1 flex items-center justify-center p-1.5 rounded-lg ${config.align === 'right' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}><AlignRight size={14} /></button>
              </div>
            </LabelWrapper>
          </div>

          <LabelWrapper label="Fill Color">
            <div className="flex items-center gap-3 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <input type="color" value={config.fill || '#000000'} onChange={(e) => updateItem(selectedId, { fill: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
              <input
                type="text"
                value={(config.fill || '#000000').toUpperCase()}
                onChange={(e) => updateItem(selectedId, { fill: e.target.value })}
                className="flex-1 bg-transparent text-[10px] font-black font-mono tracking-widest text-slate-600 outline-none uppercase"
              />
            </div>
          </LabelWrapper>

          <LabelWrapper label="Fitting Mode">
            <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              {['none', 'wrap', 'shrink', 'stretch'].map((m) => (
                <button
                  key={m}
                  onClick={() => updateItem(selectedId, { fit: m })}
                  className={`px-2 py-1.5 text-[9px] uppercase font-black rounded-lg transition-all ${config.fit === m ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </LabelWrapper>

          {config.fit === 'shrink' && (
            <LabelWrapper label="Max Lines" className="mt-4">
              <input
                type="number"
                min="1"
                max="20"
                value={config.maxLines || 1}
                onChange={(e) => updateItem(selectedId, { maxLines: parseInt(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
              />
            </LabelWrapper>
          )}
        </PropertyGroup>
      )}

      {/* DELETE SECTION */}
      <div className="mt-auto pt-6 border-t border-slate-100">
        <button
          onClick={() => handleDelete(selectedId)}
          className="w-full py-3 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 group border border-red-200 hover:border-red-500"
        >
          <Trash2 size={14} className="group-hover:animate-bounce" />
          Remove Element
        </button>
      </div>
    </div>
  );
};


