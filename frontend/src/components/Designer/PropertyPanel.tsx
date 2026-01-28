import React from 'react';
import { 
  AlignLeft, ArrowUp, ArrowDown, Trash2, MousePointer2, 
  ArrowUpToLine, ArrowDownToLine, Unlock, Lock,
  Move, Type, Layers, Maximize
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

const InputGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-2 border-b border-zinc-800 pb-4 last:border-0">
    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{label}</label>
    {children}
  </div>
);

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedId, config, onUpdate, onDelete, onMoveLayer, isTextLayer
}) => {
  if (!selectedId || !config) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 p-8">
        <MousePointer2 size={48} strokeWidth={1} className="text-zinc-500 mb-4" />
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">No Selection</p>
        <p className="text-[10px] text-zinc-600 mt-2">Click on the canvas or layers to edit properties.</p>
      </div>
    );
  }

  const isText = isTextLayer(selectedId) || config.type === 'text';

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Layer Order & Lock */}
      <InputGroup label="Arrangement">
        <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button onClick={() => onMoveLayer('top')} title="To Front" className="flex-1 flex items-center justify-center p-2 hover:bg-zinc-800 text-zinc-400 rounded-md transition-colors"><ArrowUpToLine size={14} /></button>
          <button onClick={() => onMoveLayer('up')} title="Forward" className="flex-1 flex items-center justify-center p-2 hover:bg-zinc-800 text-zinc-400 rounded-md transition-colors"><ArrowUp size={14} /></button>
          <button onClick={() => onMoveLayer('down')} title="Backward" className="flex-1 flex items-center justify-center p-2 hover:bg-zinc-800 text-zinc-400 rounded-md transition-colors"><ArrowDown size={14} /></button>
          <button onClick={() => onMoveLayer('bottom')} title="To Back" className="flex-1 flex items-center justify-center p-2 hover:bg-zinc-800 text-zinc-400 rounded-md transition-colors"><ArrowDownToLine size={14} /></button>
          <div className="w-[1px] bg-zinc-800 mx-1" />
          <button 
            onClick={() => onUpdate(selectedId, { locked: !config.locked })}
            className={`flex-1 flex items-center justify-center p-2 rounded-md transition-all ${config.locked ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            {config.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
        </div>
      </InputGroup>

      {/* Geometry */}
      <InputGroup label="Dimensions">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2">
            <span className="text-[8px] text-zinc-600 font-bold block mb-1">WIDTH (W)</span>
            <input type="number" value={Math.round(config.width || 0)} onChange={(e) => onUpdate(selectedId, { width: parseInt(e.target.value) })} className="w-full bg-transparent text-xs font-mono outline-none text-zinc-200" />
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2">
            <span className="text-[8px] text-zinc-600 font-bold block mb-1">HEIGHT (H)</span>
            <input type="number" value={Math.round(config.height || 0)} onChange={(e) => onUpdate(selectedId, { height: parseInt(e.target.value) })} className="w-full bg-transparent text-xs font-mono outline-none text-zinc-200" />
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2">
            <span className="text-[8px] text-zinc-600 font-bold block mb-1">ROTATION (°)</span>
            <input type="number" value={config.rotation || 0} onChange={(e) => onUpdate(selectedId, { rotation: parseInt(e.target.value) })} className="w-full bg-transparent text-xs font-mono outline-none text-zinc-200" />
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2">
            <span className="text-[8px] text-zinc-600 font-bold block mb-1">FILL COLOR</span>
            <div className="flex items-center gap-2">
               <input type="color" value={config.fill || '#000000'} onChange={(e) => onUpdate(selectedId, { fill: e.target.value })} className="w-4 h-4 rounded-full bg-transparent cursor-pointer border-none overflow-hidden" />
               <span className="text-[9px] font-mono uppercase text-zinc-400">{config.fill || '#000000'}</span>
            </div>
          </div>
        </div>
      </InputGroup>

      {/* Text Specifics */}
      {isText && (
        <>
          <InputGroup label="Content">
            <textarea 
              value={config.text || ''} 
              onChange={(e) => onUpdate(selectedId, { text: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-indigo-500/50 h-16 resize-none"
              placeholder="Enter text..."
            />
          </InputGroup>

          <InputGroup label={`Font Size: ${config.fontSize || 18}px`}>
             <input type="range" min="8" max="100" value={config.fontSize || 18} onChange={(e) => onUpdate(selectedId, { fontSize: parseInt(e.target.value) })} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
          </InputGroup>

          <InputGroup label="Fit Mode">
            <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              {['none', 'wrap', 'shrink', 'stretch'].map((m) => (
                <button
                  key={m}
                  onClick={() => onUpdate(selectedId, { fit: m })}
                  className={`px-2 py-1.5 text-[8px] uppercase font-bold rounded-md transition-all ${config.fit === m ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </InputGroup>
        </>
      )}

      {/* Common: Opacity */}
      <InputGroup label={`Opacity: ${Math.round((config.opacity ?? 1) * 100)}%`}>
         <input type="range" min="0" max="1" step="0.1" value={config.opacity ?? 1} onChange={(e) => onUpdate(selectedId, { opacity: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
      </InputGroup>

      {/* Actions */}
      <div className="pt-4 mt-auto">
        <button onClick={onDelete} className="w-full py-2.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md border border-transparent hover:border-red-500/20 flex items-center justify-center gap-2 transition-colors">
          <Trash2 size={14} /> Delete Layer
        </button>
      </div>
    </div>
  );
};

export default PropertyPanel;