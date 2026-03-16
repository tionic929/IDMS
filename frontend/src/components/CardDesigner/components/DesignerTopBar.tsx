
import React from 'react';
import {
  Save, Minus, Plus, ChevronRight, Magnet, Download, RefreshCw, Maximize,
  Grid3X3, Focus, Ruler, Minimize, RotateCcw, RotateCw, Eye, Layout, Command,
  UserCircle
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
    className={`p-2 rounded-lg transition-all flex items-center gap-1.5 justify-center duration-150 border ${active
        ? 'bg-primary border-primary text-primary-foreground shadow-md'
        : 'text-muted-foreground bg-card border-transparent hover:bg-accent hover:text-foreground'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
  >
    <Icon size={15} strokeWidth={2.5} />
    {badge && (
      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${active ? 'bg-primary-foreground/20 border-primary-foreground/20 text-primary-foreground' : 'bg-muted border-border text-muted-foreground'
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
  const { 
    templateName, isSaving, handleSave, handleExport, previewData,
    allStudents, activeStudentId, setActiveStudentId 
  } = useDesignerContext();
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
    <div className="h-13 border-b border-border bg-card px-4 flex items-center justify-between z-30 shrink-0 gap-3">

      {/* LEFT: Breadcrumb */}
      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Workspace</span>
        <ChevronRight size={11} className="opacity-40 shrink-0" />
        <span className="text-xs font-bold text-foreground truncate max-w-32">{templateName}</span>
      </div>

      {/* CENTER: Canvas Controls */}
      <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-1.5 rounded-2xl border border-border shadow-sm shrink-0">

        {/* Undo / Redo */}
        <IconButton icon={RotateCcw} onClick={undo} disabled={!canUndo} label="Undo (Ctrl+Z)" />
        <IconButton icon={RotateCw} onClick={redo} disabled={!canRedo} label="Redo (Ctrl+Y)" />

        <div className="w-px h-5 bg-border mx-1" />

        {/* Zoom */}
        <IconButton icon={Minus} onClick={() => setZoom(prev => Math.max(MIN_ZOOM, prev - 0.1))} label="Zoom Out" disabled={zoom <= MIN_ZOOM} />
        <button
          onClick={() => setZoom(1)}
          title="Reset Zoom"
          className="text-[10px] w-11 text-center font-black text-muted-foreground hover:text-foreground transition-colors"
        >
          {Math.round(zoom * 100)}%
        </button>
        <IconButton icon={Plus} onClick={() => setZoom(prev => Math.min(MAX_ZOOM, prev + 0.1))} label="Zoom In" disabled={zoom >= MAX_ZOOM} />

        <div className="w-px h-5 bg-border mx-1" />

        {/* View controls */}
        <IconButton icon={Maximize} onClick={() => window.dispatchEvent(new CustomEvent('recenter-canvas'))} label="Recenter View" />
        <IconButton icon={Minimize} onClick={() => window.dispatchEvent(new CustomEvent('autofit-canvas'))} label="Fit to Screen" />

        <div className="w-px h-5 bg-border mx-1" />

        {/* Snap */}
        <IconButton icon={Magnet} active={snapEnabled} onClick={() => setSnapEnabled(!snapEnabled)} label="Toggle Snapping" />
        <IconButton icon={Focus} active={snapEnabled} onClick={cycleSnapMode} label={`Snap Mode: ${snapMode}`} badge={snapMode} />

        <div className="w-px h-5 bg-border mx-1" />

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
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-accent transition-all text-[9px] font-black text-muted-foreground hover:text-foreground tracking-widest"
        >
          <Command size={11} />
          ⌃⇧P
        </button>

        {/* Preview mode toggle */}
        <button
          onClick={onTogglePreviewMode}
          title={isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${isPreviewMode
              ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
              : 'bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
        >
          {isPreviewMode ? <Layout size={14} /> : <Eye size={14} />}
          {isPreviewMode ? 'Design' : 'Preview'}
        </button>

        <div className="w-px h-5 bg-border" />

        {/* Export */}
        <button
          onClick={() => handleExport(stageRef, previewData)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:text-foreground text-xs font-bold transition-all hover:bg-accent rounded-lg border border-transparent hover:border-border"
        >
          <Download size={14} />
          Export
        </button>

        {/* Save */}
        <button
          onClick={() => handleSave(stageRef)}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/10 active:scale-95"
        >
          {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
};
