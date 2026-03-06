
import React from 'react';
import {
  Save, Minus, Plus, ChevronRight, Magnet, Download, RefreshCw, Maximize,
  Grid3X3, Focus, Ruler, Minimize, RotateCcw, RotateCw, Eye, Layout, Command
} from 'lucide-react';
import { useDesignerContext } from '../context/DesignerContext';
import { useCanvasContext } from '../context/CanvasContext';
import { useLayerContext } from '../context/LayerContext';
import { MIN_ZOOM, MAX_ZOOM } from '../../../constants/dimensions';

const IconButton = ({ icon: Icon, label, active, onClick, disabled, badge }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={`p-2 rounded-xl transition-all flex items-center gap-1.5 justify-center duration-150 border ${active
        ? 'bg-slate-900 border-slate-900 text-white shadow-md'
        : 'text-slate-500 bg-white border-transparent hover:bg-slate-100 hover:text-slate-900'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
  >
    <Icon size={15} strokeWidth={2.5} />
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
  isPreviewMode: boolean;
  onTogglePreviewMode: () => void;
  onOpenCommandPalette: () => void;
}

export const DesignerTopBar: React.FC<DesignerTopBarProps> = ({
  stageRef,
  isPreviewMode,
  onTogglePreviewMode,
  onOpenCommandPalette
}) => {
  const { templateName, isSaving, handleSave, handleExport, previewData } = useDesignerContext();
  const { undo, redo, canUndo, canRedo } = useLayerContext();

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
    <div className="h-13 border-b border-slate-200 bg-white px-4 flex items-center justify-between z-30 shrink-0 gap-3">

      {/* LEFT: Breadcrumb */}
      <div className="flex items-center gap-2 text-slate-400 min-w-0">
        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Workspace</span>
        <ChevronRight size={11} className="opacity-40 shrink-0" />
        <span className="text-xs font-bold text-slate-900 truncate max-w-32">{templateName}</span>
      </div>

      {/* CENTER: Canvas Controls */}
      <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-1.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">

        {/* Undo / Redo */}
        <IconButton icon={RotateCcw} onClick={undo} disabled={!canUndo} label="Undo (Ctrl+Z)" />
        <IconButton icon={RotateCw} onClick={redo} disabled={!canRedo} label="Redo (Ctrl+Y)" />

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Zoom */}
        <IconButton icon={Minus} onClick={() => setZoom(prev => Math.max(MIN_ZOOM, prev - 0.1))} label="Zoom Out" disabled={zoom <= MIN_ZOOM} />
        <button
          onClick={() => setZoom(1)}
          title="Reset Zoom"
          className="text-[10px] w-11 text-center font-black text-slate-600 hover:text-slate-900 transition-colors"
        >
          {Math.round(zoom * 100)}%
        </button>
        <IconButton icon={Plus} onClick={() => setZoom(prev => Math.min(MAX_ZOOM, prev + 0.1))} label="Zoom In" disabled={zoom >= MAX_ZOOM} />

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* View controls */}
        <IconButton icon={Maximize} onClick={() => window.dispatchEvent(new CustomEvent('recenter-canvas'))} label="Recenter View" />
        <IconButton icon={Minimize} onClick={() => window.dispatchEvent(new CustomEvent('autofit-canvas'))} label="Fit to Screen" />

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Snap */}
        <IconButton icon={Magnet} active={snapEnabled} onClick={() => setSnapEnabled(!snapEnabled)} label="Toggle Snapping" />
        <IconButton icon={Focus} active={snapEnabled} onClick={cycleSnapMode} label={`Snap Mode: ${snapMode}`} badge={snapMode} />

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Grid */}
        <IconButton icon={Grid3X3} active={showGrid} onClick={() => setShowGrid(!showGrid)} label="Toggle Grid" />
        <IconButton icon={Ruler} onClick={cycleGridUnit} label={`Grid Unit: ${gridUnit}`} badge={gridUnit} />
      </div>

      {/* RIGHT: Mode + Actions */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Command Palette shortcut hint */}
        <button
          onClick={onOpenCommandPalette}
          title="Command Palette (Ctrl+Shift+P)"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-[9px] font-black text-slate-400 hover:text-slate-700 tracking-widest"
        >
          <Command size={11} />
          ⌃⇧P
        </button>

        {/* Preview mode toggle */}
        <button
          onClick={onTogglePreviewMode}
          title={isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${isPreviewMode
              ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-600/20'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
        >
          {isPreviewMode ? <Layout size={14} /> : <Eye size={14} />}
          {isPreviewMode ? 'Design' : 'Preview'}
        </button>

        <div className="w-px h-5 bg-slate-200" />

        {/* Export */}
        <button
          onClick={() => handleExport(stageRef, previewData)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition-all hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200"
        >
          <Download size={14} />
          Export
        </button>

        {/* Save */}
        <button
          onClick={() => handleSave(stageRef)}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-900/10 active:scale-95"
        >
          {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
};
