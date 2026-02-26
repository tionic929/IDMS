import React from 'react';
import { 
  AlignLeft, ArrowUp, ArrowDown, Trash2, MousePointer2, 
  ArrowUpToLine, ArrowDownToLine, Unlock, Lock,
  Move, Type, Layers, Maximize, List, Hash, Palette, RotateCw
} from 'lucide-react';
import { type LayoutItemSchema } from '../../types/designer';

interface PropertyPanelProps {
  selectedId: string | null;
  config: LayoutItemSchema | null;
  onUpdate: (id: string, attrs: any) => void;
  onDelete: () => void;
  onMoveLayer: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
  isTextLayer: (id: string) => boolean;
}

// Reusable Header for sections to improve scannability
const SectionHeader = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <div className="flex items-center gap-2 mb-3 mt-2">
    <Icon size={12} className="text-zinc-500" />
    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.1em]">{label}</span>
  </div>
);

const InputGroup = ({ label, children, className = "" }: { label?: string, children: React.ReactNode, className?: string }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label className="text-[9px] font-medium text-zinc-500 ml-1">{label}</label>}
    {children}
  </div>
);

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedId, config, onUpdate, onDelete, onMoveLayer, isTextLayer
}) => {
  if (!selectedId || !config) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-zinc-900/50">
        <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 border border-zinc-700/50">
          <MousePointer2 size={24} strokeWidth={1.5} className="text-zinc-600 animate-pulse" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Select an object</p>
        <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">Select a layer on the canvas to inspect and edit its properties.</p>
      </div>
    );
  }

  const isText = isTextLayer(selectedId) || config.type === 'text';

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 overflow-y-auto no-scrollbar">
      {/* Active Layer Badge */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            {isText ? <Type size={16} /> : <Layers size={16} />}
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 truncate max-w-[120px]">
              {isText ? 'Text Layer' : 'Shape Object'}
            </h3>
            <p className="text-[9px] text-zinc-500 font-mono">ID: {selectedId.slice(0, 8)}</p>
          </div>
        </div>
        <button 
          onClick={() => onUpdate(selectedId, { locked: !config.locked })}
          className={`p-2 rounded-lg transition-all ${config.locked ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
        >
          {config.locked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      </div>

      <div className="p-4 space-y-8">
        {/* Layout & Transform Section */}
        <section>
          <SectionHeader icon={Move} label="Transform" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <InputGroup label="Width">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md px-2 focus-within:border-indigo-500/50 transition-colors">
                <span className="text-[9px] text-zinc-600 font-bold mr-2">W</span>
                <input type="number" value={Math.round(config.width || 0)} onChange={(e) => onUpdate(selectedId, { width: parseInt(e.target.value) })} className="w-full bg-transparent py-1.5 text-xs font-mono text-zinc-200 outline-none" />
              </div>
            </InputGroup>
            <InputGroup label="Height">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md px-2 focus-within:border-indigo-500/50 transition-colors">
                <span className="text-[9px] text-zinc-600 font-bold mr-2">H</span>
                <input type="number" value={Math.round(config.height || 0)} onChange={(e) => onUpdate(selectedId, { height: parseInt(e.target.value) })} className="w-full bg-transparent py-1.5 text-xs font-mono text-zinc-200 outline-none" />
              </div>
            </InputGroup>
            <InputGroup label="Rotation">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md px-2 focus-within:border-indigo-500/50 transition-colors">
                <RotateCw size={10} className="text-zinc-600 mr-2" />
                <input type="number" value={config.rotation || 0} onChange={(e) => onUpdate(selectedId, { rotation: parseInt(e.target.value) })} className="w-full bg-transparent py-1.5 text-xs font-mono text-zinc-200 outline-none" />
                <span className="text-[9px] text-zinc-600">°</span>
              </div>
            </InputGroup>
            <InputGroup label="Opacity">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md px-2 focus-within:border-indigo-500/50 transition-colors">
                <Hash size={10} className="text-zinc-600 mr-2" />
                <input type="number" min="0" max="100" value={Math.round((config.opacity ?? 1) * 100)} onChange={(e) => onUpdate(selectedId, { opacity: parseFloat(e.target.value) / 100 })} className="w-full bg-transparent py-1.5 text-xs font-mono text-zinc-200 outline-none" />
                <span className="text-[9px] text-zinc-600">%</span>
              </div>
            </InputGroup>
          </div>
        </section>

        {/* Styling Section */}
        <section>
          <SectionHeader icon={Palette} label="Appearance" />
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between group hover:border-zinc-700 transition-colors">
             <div className="flex items-center gap-3">
               <div className="relative w-6 h-6 rounded-md border border-zinc-700 overflow-hidden shadow-inner">
                 <input type="color" value={config.fill || '#000000'} onChange={(e) => onUpdate(selectedId, { fill: e.target.value })} className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
               </div>
               <span className="text-[11px] font-mono uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors">{config.fill || '#000000'}</span>
             </div>
             <span className="text-[9px] text-zinc-600 font-bold">100%</span>
          </div>
        </section>

        {/* Text Section */}
        {isText && (
          <section className="space-y-6">
            <SectionHeader icon={Type} label="Typography" />
            <InputGroup label="Content">
              <textarea 
                value={config.text || ''} 
                onChange={(e) => onUpdate(selectedId, { text: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 outline-none focus:border-indigo-500/50 h-24 resize-none leading-relaxed transition-all"
                placeholder="Enter text..."
              />
            </InputGroup>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Font Size</span>
                <span className="text-[10px] font-mono text-indigo-400">{config.fontSize || 18}px</span>
              </div>
              <input type="range" min="8" max="100" value={config.fontSize || 18} onChange={(e) => onUpdate(selectedId, { fontSize: parseInt(e.target.value) })} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            </div>

            <InputGroup label="Fit Mode">
              <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                {['none', 'wrap', 'shrink', 'stretch'].map((m) => (
                  <button
                    key={m}
                    onClick={() => onUpdate(selectedId, { fit: m })}
                    className={`py-1.5 text-[8px] uppercase font-black rounded-md transition-all ${config.fit === m ? 'bg-zinc-800 text-indigo-400 shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </InputGroup>
          </section>
        )}

        {/* Arrangement Section */}
        <section>
          <SectionHeader icon={List} label="Arrangement" />
          <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <ArrangementBtn onClick={() => onMoveLayer('top')} icon={<ArrowUpToLine size={14} />} title="Bring to Front" />
            <ArrangementBtn onClick={() => onMoveLayer('up')} icon={<ArrowUp size={14} />} title="Bring Forward" />
            <ArrangementBtn onClick={() => onMoveLayer('down')} icon={<ArrowDown size={14} />} title="Send Backward" />
            <ArrangementBtn onClick={() => onMoveLayer('bottom')} icon={<ArrowDownToLine size={14} />} title="Send to Back" />
          </div>
        </section>

        {/* Danger Zone */}
        <div className="pt-6">
          <button 
            onClick={onDelete} 
            className="w-full py-3 text-[11px] font-bold text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl border border-zinc-800 hover:border-red-500/20 flex items-center justify-center gap-2 transition-all group"
          >
            <Trash2 size={14} className="group-hover:scale-110 transition-transform" /> 
            Delete Layer
          </button>
        </div>
      </div>
    </div>
  );
};

const ArrangementBtn = ({ onClick, icon, title }: { onClick: () => void, icon: any, title: string }) => (
  <button 
    onClick={onClick} 
    title={title} 
    className="flex-1 flex items-center justify-center p-2.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 rounded-lg transition-all active:scale-90"
  >
    {icon}
  </button>
);

export default PropertyPanel;