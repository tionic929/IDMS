import React from 'react';
import {
  Save, Minus, Plus, ChevronRight, Magnet, Download, RefreshCw, Maximize
} from 'lucide-react';
import { useDesignerContext } from '../context/DesignerContext';
import { useCanvasContext } from '../context/CanvasContext';
import { MIN_ZOOM, MAX_ZOOM } from '../../../constants/dimensions';

const IconButton = ({ icon: Icon, label, active, onClick, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={`p-2 rounded-lg transition-all flex items-center justify-center ${
      active
        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <Icon size={18} strokeWidth={2} />
  </button>
);

interface DesignerTopBarProps {
  stageRef: React.RefObject<any>;
  previewData: any;
  onRecenter?: () => void; // Added new prop
}

export const DesignerTopBar: React.FC<DesignerTopBarProps> = ({ stageRef, previewData, onRecenter }) => {
  const { templateName, isSaving, handleSave, handleExport } = useDesignerContext();
  const { zoom, setZoom, snapEnabled, setSnapEnabled } = useCanvasContext();

  return (
    <div className="h-14 border-b border-zinc-800 bg-zinc-900 px-6 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="text-xs font-medium hover:text-zinc-300 cursor-pointer transition-colors">Templates</span>
          <ChevronRight size={14} />
          <span className="text-xs font-bold text-zinc-100">{templateName}</span>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex items-center gap-1 bg-zinc-950/50 p-1 rounded-xl border border-zinc-800/50">
        <IconButton
          icon={Minus}
          onClick={() => setZoom(prev => Math.max(MIN_ZOOM, prev - 0.1))}
          label="Zoom Out"
          disabled={zoom <= MIN_ZOOM}
        />
        <span className="text-[10px] w-10 text-center font-mono text-zinc-400 font-bold">
          {Math.round(zoom * 100)}%
        </span>
        <IconButton
          icon={Plus}
          onClick={() => setZoom(prev => Math.min(MAX_ZOOM, prev + 0.1))}
          label="Zoom In"
          disabled={zoom >= MAX_ZOOM}
        />
        
        <div className="w-px h-4 bg-zinc-800 mx-1" />

        {/* RE-CENTER BUTTON */}
        <IconButton
          icon={Maximize}
          onClick={() => {
            // Dispatch custom event that DesignerCanvas is listening for
            window.dispatchEvent(new CustomEvent('recenter-canvas'));
          }}
          label="Recenter View"
        />

        <div className="w-px h-4 bg-zinc-800 mx-1" />
        
        <IconButton
          icon={Magnet}
          active={snapEnabled}
          onClick={() => setSnapEnabled(!snapEnabled)}
          label={`Snapping ${snapEnabled ? 'ON' : 'OFF'}`}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleExport(stageRef, previewData)}
          className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-zinc-100 text-xs font-semibold transition-all"
        >
          <Download size={14} />
          Export
        </button>
        <button
          onClick={() => handleSave(stageRef)}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20"
        >
          {isSaving ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {isSaving ? 'Saving...' : 'Save Design'}
        </button>
      </div>
    </div>
  );
};