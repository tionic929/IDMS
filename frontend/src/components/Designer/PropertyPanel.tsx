import React from 'react';
import { AlignLeft, ArrowUp, ArrowDown, Trash2, MousePointer2, ArrowUpToLine, ArrowDownToLine, Unlock, Lock } from 'lucide-react';
import { type LayoutItemSchema } from '../../types/designer';

interface PropertyPanelProps {
  selectedId: string | null;
  config: LayoutItemSchema | null;
  onUpdate: (id: string, attrs: any) => void;
  onDelete: () => void;
  onMoveLayer: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
  isTextLayer: (id: string) => boolean;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedId,
  config,
  onUpdate,
  onDelete,
  onMoveLayer,
  isTextLayer
}) => {
  if (!selectedId || !config) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
        <MousePointer2 size={32} />
        <p className="text-[10px] mt-2 font-bold uppercase tracking-widest">Select Layer</p>
      </div>
    );
  }

  const isText = isTextLayer(selectedId) || config.type === 'text';

  return (
    <div className="space-y-6">
      <div className="flex gap-1">
        <button onClick={() => onMoveLayer('top')} title="Bring to Front" className="flex-1 flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 rounded-lg">
          <ArrowUpToLine size={14} />
        </button>
        <button onClick={() => onMoveLayer('up')} title="Bring Forward" className="flex-1 flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 rounded-lg">
          <ArrowUp size={14} />
        </button>
        <button onClick={() => onMoveLayer('down')} title="Send Backward" className="flex-1 flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 rounded-lg">
          <ArrowDown size={14} />
        </button>
        <button onClick={() => onMoveLayer('bottom')} title="Send to Back" className="flex-1 flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 rounded-lg">
          <ArrowDownToLine size={14} />
        </button>
        <div className="w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
        <button 
          onClick={() => onUpdate(selectedId, { locked: !config.locked })}
          className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors ${config.locked ? 'bg-orange-500 text-white' : 'bg-slate-50 dark:bg-slate-800'}`}
        >
          {config.locked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      </div>

      {isText && (
        <>
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Fit Mode</label>
            <div className="grid grid-cols-2 gap-1">
              {['none', 'wrap', 'shrink', 'stretch'].map((m) => (
                <button
                  key={m}
                  onClick={() => onUpdate(selectedId, { fit: m })}
                  className={`px-2 py-1 text-[8px] uppercase font-bold rounded border ${config.fit === m ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          
          {/* text content input  */}
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Text Content</label>
            <input 
              type="text" 
              value={config.text || ''} 
              onChange={(e) => onUpdate(selectedId, { text: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs"
              placeholder="Enter text..."
            />
          </div>

          <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><AlignLeft size={10} /> Max Lines</label>
              <span className="text-[10px] font-mono text-teal-500 font-bold">{config.maxLines || 1}</span>
            </div>
            <input type="range" min="1" max="5" value={config.maxLines || 1} onChange={(e) => onUpdate(selectedId, { maxLines: parseInt(e.target.value) })} className="w-full accent-teal-500" />
            <p className="text-[7px] text-slate-400 italic">When in 'shrink' mode, font will reduce to fit this many lines.</p>
          </div>

          <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Base Font Size</label>
              <span className="text-[10px] font-mono text-teal-500 font-bold">{config.fontSize || 18}px</span>
            </div>
            <input type="range" min="8" max="100" value={config.fontSize || 18} onChange={(e) => onUpdate(selectedId, { fontSize: parseInt(e.target.value) })} className="w-full accent-teal-500" />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase">Width</label>
          <input type="number" value={Math.round(config.width || 200)} onChange={(e) => onUpdate(selectedId, { width: parseInt(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800 rounded p-2 text-xs font-mono" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase">Height</label>
          <input type="number" value={Math.round(config.height || 180)} onChange={(e) => onUpdate(selectedId, { height: parseInt(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800 rounded p-2 text-xs font-mono" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] font-bold text-slate-400 uppercase">Opacity</label>
        <input type="range" min="0" max="1" step="0.1" value={config.opacity ?? 1} onChange={(e) => onUpdate(selectedId, { opacity: parseFloat(e.target.value) })} className="w-full accent-teal-500" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase">Rotation</label>
          <input type="number" value={config.rotation || 0} onChange={(e) => onUpdate(selectedId, { rotation: parseInt(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800 rounded p-2 text-xs font-mono" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase">Color</label>
          <input type="color" value={config.fill || '#1e293b'} onChange={(e) => onUpdate(selectedId, { fill: e.target.value })} className="w-full h-8 bg-transparent cursor-pointer border-none" />
        </div>
      </div>
      <button onClick={onDelete} className="w-full py-2.5 text-[9px] font-black uppercase text-red-500 hover:bg-red-50 rounded-xl border border-red-500/20 flex items-center justify-center gap-2"><Trash2 size={12} /> Delete</button>
    </div>
  );
};

export default PropertyPanel;