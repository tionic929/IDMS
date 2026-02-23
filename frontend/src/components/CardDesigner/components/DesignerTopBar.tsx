
﻿import React from 'react';
import {
  Save, Minus, Plus, ChevronRight, Magnet, Download, RefreshCw, Maximize,
  Grid3X3, Focus, Ruler

} from 'lucide-react';
import { useDesignerContext } from '../context/DesignerContext';
import { useCanvasContext } from '../context/CanvasContext';
import { MIN_ZOOM, MAX_ZOOM } from '../../../constants/dimensions';


const IconButton = ({ icon: Icon, label, active, onClick, disabled, badge }: any) => (

  <button
    onClick={onClick}
    disabled={disabled}
    title={label}

    className={`p-2 rounded-xl transition-all flex items-center gap-2 justify-center duration-200 border ${active
      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
      : 'text-slate-500 bg-white border-transparent hover:bg-slate-100 hover:text-slate-900'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
  >
    <Icon size={16} strokeWidth={2.5} />
    {badge && (
      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${active ? 'bg-white/20 border-white/20 text-white' : 'bg-slate-100 border-slate-200 text-slate-500'
        }`}>
        {badge}
      </span>
    )}

  </button>
);

interface DesignerTopBarProps {
  stageRef: React.RefObject<any>;

  onRecenter?: () => void;
}

export const DesignerTopBar: React.FC<DesignerTopBarProps> = ({ stageRef }) => {
  const { templateName, isSaving, handleSave, handleExport, previewData } = useDesignerContext();

  const {
    zoom, setZoom,
    showGrid, setShowGrid,
    snapEnabled, setSnapEnabled,
    snapMode, setSnapMode,
    gridUnit, setGridUnit
  } = useCanvasContext();

  const cycleSnapMode = () => {
    const modes: ('smart' | 'grid' | 'both')[] = ['smart', 'grid', 'both'];
    const currentIndex = modes.indexOf(snapMode);
    setSnapMode(modes[(currentIndex + 1) % modes.length]);
  };

  const cycleGridUnit = () => {
    const units: ('px' | 'inch' | 'mm')[] = ['px', 'inch', 'mm'];
    const currentIndex = units.indexOf(gridUnit);
    setGridUnit(units[(currentIndex + 1) % units.length]);
  };

  return (
    <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Workspace</span>
          <ChevronRight size={12} className="opacity-50" />
          <span className="text-sm font-bold text-slate-900">{templateName}</span>
        </div>
      </div>

      {/* Unified Canvas Controls */}
      <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1">
          <IconButton
            icon={Minus}
            onClick={() => setZoom(prev => Math.max(MIN_ZOOM, prev - 0.1))}
            label="Zoom Out"
            disabled={zoom <= MIN_ZOOM}
          />
          <span className="text-[10px] w-12 text-center font-black text-slate-600">
            {Math.round(zoom * 100)}%
          </span>
          <IconButton
            icon={Plus}
            onClick={() => setZoom(prev => Math.min(MAX_ZOOM, prev + 0.1))}
            label="Zoom In"
            disabled={zoom >= MAX_ZOOM}
          />
        </div>

        <div className="w-px h-6 bg-slate-200 mx-2" />

        <div className="flex items-center gap-1">
          <IconButton
            icon={Maximize}
            onClick={() => window.dispatchEvent(new CustomEvent('recenter-canvas'))}
            label="Recenter View"
          />
        </div>

        <div className="w-px h-6 bg-slate-200 mx-2" />

        <div className="flex items-center gap-1">
          <IconButton
            icon={Magnet}
            active={snapEnabled}
            onClick={() => setSnapEnabled(!snapEnabled)}
            label="Toggle Snapping"
          />
          <IconButton
            icon={Focus}
            active={snapEnabled}
            onClick={cycleSnapMode}
            label={`Snap Mode: ${snapMode}`}
            badge={snapMode}
          />
        </div>

        <div className="w-px h-6 bg-slate-200 mx-2" />

        <div className="flex items-center gap-1">
          <IconButton
            icon={Grid3X3}
            active={showGrid}
            onClick={() => setShowGrid(!showGrid)}
            label="Toggle Grid"
          />
          <IconButton
            icon={Ruler}
            onClick={cycleGridUnit}
            label={`Grid Unit: ${gridUnit}`}
            badge={gridUnit}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleExport(stageRef, previewData)}
          className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition-all"
        >
          <Download size={16} />

          Export
        </button>
        <button
          onClick={() => handleSave(stageRef)}
          disabled={isSaving}

          className="flex items-center gap-3 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10 active:scale-95"

        >
          {isSaving ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}

          {isSaving ? 'Saving...' : 'Save Changes'}

        </button>
      </div>
    </div>
  );

};


