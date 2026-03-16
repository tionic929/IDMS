import React, { useRef, useState, useEffect, useCallback } from 'react';
import { DesignerProvider } from './context/DesignerContext';
import { CanvasProvider } from './context/CanvasContext';
import { LayerProvider } from './context/LayerContext';

import { DesignerTopBar } from './components/DesignerTopBar';
import { DesignerLeftToolbar } from './components/DesignerLeftToolbar';
import { DesignerLayersSidebar } from './components/DesignerLayersSidebar';
import { DesignerCanvas } from './components/DesignerCanvas';
import { DesignerPropertyPanel } from './components/DesignerPropertyPanel';
import { CommandPalette, type PaletteCommand } from './components/CommandPalette';

import {
  Square, Circle, Type, RotateCcw, RotateCw, Trash2, Save,
  Grid3X3, Magnet, Maximize, Minimize, Eye, ArrowUpToLine, ArrowDownToLine
} from 'lucide-react';

import { useDesignerContext } from './context/DesignerContext';
import { useLayerContext } from './context/LayerContext';
import type { Students } from '../../types/students';

interface CardDesignerProps {
  templateId: number | null;
  templateName: string;
  onSave: (newLayout: any) => void;
  currentLayout: any;
  allStudents: Students[];
}

// ─── Inner component (has context access via hooks within providers) ──────────

const CardDesignerContent: React.FC<{
  templateId: number | null;
  templateName: string;
}> = ({ templateId, templateName }) => {
  const stageRef = useRef<any>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const { handleSave, previewData, handleExport } = useDesignerContext();
  const { undo, redo } = useLayerContext();

  const openPalette = useCallback(() => setIsPaletteOpen(true), []);
  const closePalette = useCallback(() => setIsPaletteOpen(false), []);

  // Expose save via custom event (needed by command palette)
  useEffect(() => {
    const onSave = () => handleSave(stageRef);
    window.addEventListener('designer:save', onSave);
    return () => window.removeEventListener('designer:save', onSave);
  }, [handleSave]);

  // ── Global keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable;

      // Ctrl+Shift+P → Command Palette (always intercept)
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsPaletteOpen(p => !p);
        return;
      }

      // Ctrl+S → Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('designer:save'));
        return;
      }

      if (e.key === 'Escape' && isPaletteOpen) {
        setIsPaletteOpen(false);
        return;
      }

      if (isEditing) return;

      switch (e.key.toLowerCase()) {
        case 'v':
          window.dispatchEvent(new CustomEvent('designer:set-tool', { detail: 'select' }));
          break;
        case 'h':
          window.dispatchEvent(new CustomEvent('designer:set-tool', { detail: 'hand' }));
          break;
        case 'r':
          window.dispatchEvent(new CustomEvent('designer:add-shape', { detail: 'rect' }));
          break;
        case 'o':
          window.dispatchEvent(new CustomEvent('designer:add-shape', { detail: 'circle' }));
          break;
        case 't':
          window.dispatchEvent(new CustomEvent('designer:add-text'));
          break;
        case 'delete':
        case 'backspace':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('designer:delete-selected'));
          break;
        case 'z':
          if (e.ctrlKey) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('designer:undo'));
          }
          break;
        case 'y':
          if (e.ctrlKey) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('designer:redo'));
          }
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPaletteOpen]);

  // ── Command palette commands ─────────────────────────────────────────────
  const paletteCommands: PaletteCommand[] = [
    // Elements
    { id: 'add-rect', label: 'Add Rectangle', description: 'Insert a rectangle shape', icon: Square, category: 'Elements', shortcut: 'R', action: () => window.dispatchEvent(new CustomEvent('designer:add-shape', { detail: 'rect' })) },
    { id: 'add-circle', label: 'Add Circle', description: 'Insert a circle shape', icon: Circle, category: 'Elements', shortcut: 'O', action: () => window.dispatchEvent(new CustomEvent('designer:add-shape', { detail: 'circle' })) },
    { id: 'add-text', label: 'Add Text', description: 'Insert a text element', icon: Type, category: 'Elements', shortcut: 'T', action: () => window.dispatchEvent(new CustomEvent('designer:add-text')) },
    // Edit
    { id: 'undo', label: 'Undo', description: 'Undo last action', icon: RotateCcw, category: 'Edit', shortcut: 'Ctrl+Z', action: () => window.dispatchEvent(new CustomEvent('designer:undo')) },
    { id: 'redo', label: 'Redo', description: 'Redo last action', icon: RotateCw, category: 'Edit', shortcut: 'Ctrl+Y', action: () => window.dispatchEvent(new CustomEvent('designer:redo')) },
    { id: 'delete', label: 'Delete Selected', description: 'Remove the selected element', icon: Trash2, category: 'Edit', shortcut: 'Del', action: () => window.dispatchEvent(new CustomEvent('designer:delete-selected')) },
    { id: 'save', label: 'Save Changes', description: 'Save current layout', icon: Save, category: 'Edit', shortcut: 'Ctrl+S', action: () => window.dispatchEvent(new CustomEvent('designer:save')) },
    // View
    { id: 'toggle-grid', label: 'Toggle Grid', description: 'Show or hide canvas grid', icon: Grid3X3, category: 'View', action: () => window.dispatchEvent(new CustomEvent('designer:toggle-grid')) },
    { id: 'toggle-snap', label: 'Toggle Snapping', description: 'Enable or disable snapping', icon: Magnet, category: 'View', action: () => window.dispatchEvent(new CustomEvent('designer:toggle-snap')) },
    { id: 'recenter', label: 'Recenter Canvas', description: 'Reset canvas view to center', icon: Maximize, category: 'View', action: () => window.dispatchEvent(new CustomEvent('recenter-canvas')) },
    { id: 'fit-screen', label: 'Fit to Screen', description: 'Auto-fit canvas to window', icon: Minimize, category: 'View', action: () => window.dispatchEvent(new CustomEvent('autofit-canvas')) },
    { id: 'preview', label: isPreviewMode ? 'Exit Preview' : 'Enter Preview Mode', description: 'Toggle distraction-free preview', icon: Eye, category: 'View', action: () => setIsPreviewMode(p => !p) },
    // Arrange
    { id: 'bring-front', label: 'Bring to Front', description: 'Move layer to top', icon: ArrowUpToLine, category: 'Arrange', action: () => window.dispatchEvent(new CustomEvent('designer:move-layer', { detail: 'top' })) },
    { id: 'send-back', label: 'Send to Back', description: 'Move layer to bottom', icon: ArrowDownToLine, category: 'Arrange', action: () => window.dispatchEvent(new CustomEvent('designer:move-layer', { detail: 'bottom' })) },
  ];

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden font-sans border border-border shadow-2xl select-none">
      <DesignerTopBar
        stageRef={stageRef}
        isPreviewMode={isPreviewMode}
        onTogglePreviewMode={() => setIsPreviewMode(p => !p)}
        onOpenCommandPalette={openPalette}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — hidden in Preview mode */}
        {!isPreviewMode && (
          <div className="flex bg-card border-r border-border">
            <DesignerLeftToolbar />
            <DesignerLayersSidebar />
          </div>
        )}

        {/* Main canvas */}
        <DesignerCanvas stageRef={stageRef} />

        {/* Right inspector — hidden in Preview mode */}
        {!isPreviewMode && <DesignerPropertyPanel />}
      </div>

      {/* Command Palette overlay */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={closePalette}
        commands={paletteCommands}
      />
    </div>
  );
};

// ─── Root component with providers ───────────────────────────────────────────

const CardDesigner: React.FC<CardDesignerProps> = ({
  templateId, templateName, onSave, currentLayout, allStudents
}) => {
  return (
    <DesignerProvider
      templateId={templateId}
      templateName={templateName}
      currentLayout={currentLayout}
      onSave={onSave}
      allStudents={allStudents}
    >
      <CanvasProvider>
        <LayerProvider>
          <CardDesignerContent templateId={templateId} templateName={templateName} />
        </LayerProvider>
      </CanvasProvider>
    </DesignerProvider>
  );
};

export default CardDesigner;
