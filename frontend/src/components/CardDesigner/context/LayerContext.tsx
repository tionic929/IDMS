
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

import { toast } from 'react-toastify';
import { useDesignerContext } from './DesignerContext';
import { reorderLayer } from '../../../utils/designerUtils';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../../../constants/dimensions';

interface LayerContextType {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  addShape: (type: 'rect' | 'circle') => void;
  addText: () => void;
  handleDelete: (id?: string) => void;
  handleDuplicate: (id: string) => void;
  handleRename: (oldId: string, newName: string) => void;
  handleToggleVisibility: (id: string) => void;
  moveLayer: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
  handleImageUpload: (file: File) => void;
  handleAutoFitLayer: (id: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const LayerContext = createContext<LayerContextType | undefined>(undefined);

const MAX_HISTORY = 50;

export const LayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { editSide, tempLayout, setTempLayout } = useDesignerContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Undo/redo stacks (store snapshots of tempLayout)
  const pastRef = useRef<any[]>([]);
  const futureRef = useRef<any[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0); // trigger re-render on change

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  /** Push current layout to undo stack before a mutation. Must call BEFORE setTempLayout. */
  const pushHistory = useCallback((snapshot: any) => {
    pastRef.current = [...pastRef.current.slice(-MAX_HISTORY + 1), snapshot];
    futureRef.current = [];
    setHistoryVersion(v => v + 1);
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [tempLayout, ...futureRef.current.slice(0, MAX_HISTORY - 1)];
    setTempLayout(previous);
    setHistoryVersion(v => v + 1);
    toast.info('Undone', { autoClose: 800 });
  }, [tempLayout, setTempLayout]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current.slice(-MAX_HISTORY + 1), tempLayout];
    setTempLayout(next);
    setHistoryVersion(v => v + 1);
    toast.info('Redone', { autoClose: 800 });
  }, [tempLayout, setTempLayout]);

  const addShape = useCallback((type: 'rect' | 'circle') => {
    pushHistory(tempLayout);
    const side = editSide.toLowerCase();
    const id = `${type}_${Date.now()}`;
    const newShape = {
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      fill: '#6366f1',
      rotation: 0,
      opacity: 1,
      type,
      fit: 'none',
      visible: true
    };
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: { ...prev[side], [id]: newShape }
    }));
    setSelectedId(id);
  }, [editSide, setTempLayout, tempLayout, pushHistory]);

  const addText = useCallback(() => {
    pushHistory(tempLayout);
    const side = editSide.toLowerCase();
    const id = `text_${Date.now()}`;
    const newText = {
      type: 'text',
      x: 50,
      y: 50,
      width: 200,
      height: 40,
      text: 'New Text',
      fontSize: 20,
      fill: '#000000',
      rotation: 0,
      fit: 'none',
      visible: true
    };
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: { ...prev[side], [id]: newText }
    }));
    setSelectedId(id);
  }, [editSide, setTempLayout, tempLayout, pushHistory]);

  const handleImageUpload = useCallback((file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        pushHistory(tempLayout);
        const side = editSide.toLowerCase();
        const id = `img_${Date.now()}`;
        const aspectRatio = img.height / img.width;
        const width = Math.min(DESIGN_WIDTH * 0.4, 200);
        const height = width * aspectRatio;

        const newImage = {
          type: 'image',
          src,
          x: (DESIGN_WIDTH - width) / 2,
          y: (DESIGN_HEIGHT - height) / 2,
          width: Math.round(width),
          height: Math.round(height),
          opacity: 1,
          rotation: 0,
          visible: true
        };

        setTempLayout((prev: any) => ({
          ...prev,
          [side]: { ...prev[side], [id]: newImage }
        }));
        setSelectedId(id);
        toast.success("Image uploaded");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, [editSide, setTempLayout, tempLayout, pushHistory]);

  const handleDelete = useCallback((id?: string) => {
    const targetId = id || selectedId;
    if (!targetId) return;

    pushHistory(tempLayout);
    const side = editSide.toLowerCase();
    const newLayout = { ...tempLayout };
    newLayout[side] = { ...newLayout[side] };
    delete newLayout[side][targetId];
    setTempLayout(newLayout);

    if (targetId === selectedId) {
      setSelectedId(null);
    }
  }, [selectedId, editSide, tempLayout, setTempLayout, pushHistory]);

  const handleDuplicate = useCallback((id: string) => {
    const side = editSide.toLowerCase();
    const source = tempLayout[side][id];
    if (!source) return;

    pushHistory(tempLayout);
    const newId = `${source.type || 'copy'}_${Date.now()}`;
    const duplicate = {
      ...source,
      x: source.x + 20,
      y: source.y + 20,
      visible: true
    };

    setTempLayout((prev: any) => {
      const currentSide = prev[side];
      const newSideConfig: any = {};

      Object.keys(currentSide).forEach(key => {
        newSideConfig[key] = currentSide[key];
        if (key === id) {
          newSideConfig[newId] = duplicate;
        }
      });

      return { ...prev, [side]: newSideConfig };
    });
    setSelectedId(newId);
  }, [editSide, tempLayout, setTempLayout, pushHistory]);

  const handleRename = useCallback((oldId: string, newName: string) => {
    if (!newName || oldId === newName) return;

    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => {
      const newSideConfig: any = {};
      Object.keys(prev[side]).forEach(key => {
        if (key === oldId) {
          newSideConfig[newName] = { ...prev[side][oldId] };
        } else {
          newSideConfig[key] = prev[side][key];
        }
      });
      return { ...prev, [side]: newSideConfig };
    });
    setSelectedId(newName);
  }, [editSide, setTempLayout]);

  const handleToggleVisibility = useCallback((id: string) => {
    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: {
        ...prev[side],
        [id]: {
          ...prev[side][id],
          visible: prev[side][id].visible === false ? true : false
        }
      }
    }));
  }, [editSide, setTempLayout]);

  const moveLayer = useCallback((direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!selectedId) return;

    pushHistory(tempLayout);
    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: reorderLayer(prev[side], selectedId, direction)
    }));
  }, [selectedId, editSide, setTempLayout, tempLayout, pushHistory]);

  const handleAutoFitLayer = useCallback((id: string) => {
    const side = editSide.toLowerCase();
    const item = tempLayout[side][id];
    if (!item) return;

    let updates: any = {};

    if (id.includes('text') || item.type === 'text') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const text = item.text || '';
        ctx.font = `${item.fontStyle || 'bold'} ${item.fontSize || 20}px ${item.fontFamily || 'Arial'}`;
        const metrics = ctx.measureText(text);
        updates.width = Math.ceil(metrics.width + 10);
        if (item.fit !== 'none') {
          updates.fit = 'none';
        }
        toast.info(`Auto-fitted text to ${updates.width}px`);
      }
    } else if (id.includes('img') || item.type === 'image') {
      pushHistory(tempLayout);
      setTempLayout((prev: any) => ({
        ...prev,
        [side]: {
          ...prev[side],
          [id]: {
            ...prev[side][id],
            x: 0,
            y: 0,
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            rotation: 0
          }
        }
      }));
      toast.info("Image fitted to full canvas");
      return;
    } else if (id.includes('rect') || id.includes('circle')) {
      const size = Math.max(item.width || 100, item.height || 100);
      updates.width = size;
      updates.height = size;
      toast.info("Shape proportions reset");
    }

    if (Object.keys(updates).length > 0) {
      pushHistory(tempLayout);
      setTempLayout((prev: any) => ({
        ...prev,
        [side]: {
          ...prev[side],
          [id]: { ...prev[side][id], ...updates }
        }
      }));
    }
  }, [editSide, tempLayout, setTempLayout, pushHistory]);

  // ── Custom event listeners for keyboard shortcuts / command palette ────────
  useEffect(() => {
    const onAddShape = (e: Event) => { addShape((e as CustomEvent).detail); };
    const onAddText = () => { addText(); };
    const onDelete = () => { handleDelete(); };
    const onUndo = () => { undo(); };
    const onRedo = () => { redo(); };
    const onMoveLayer = (e: Event) => { moveLayer((e as CustomEvent).detail); };

    window.addEventListener('designer:add-shape', onAddShape);
    window.addEventListener('designer:add-text', onAddText);
    window.addEventListener('designer:delete-selected', onDelete);
    window.addEventListener('designer:undo', onUndo);
    window.addEventListener('designer:redo', onRedo);
    window.addEventListener('designer:move-layer', onMoveLayer);

    return () => {
      window.removeEventListener('designer:add-shape', onAddShape);
      window.removeEventListener('designer:add-text', onAddText);
      window.removeEventListener('designer:delete-selected', onDelete);
      window.removeEventListener('designer:undo', onUndo);
      window.removeEventListener('designer:redo', onRedo);
      window.removeEventListener('designer:move-layer', onMoveLayer);
    };
  }, [addShape, addText, handleDelete, undo, redo, moveLayer]);

  const value = {
    selectedId,
    setSelectedId,
    addShape,
    addText,
    handleDelete,
    handleDuplicate,
    handleRename,
    handleToggleVisibility,
    moveLayer,
    handleImageUpload,
    handleAutoFitLayer,
    hoveredId,
    setHoveredId,
    undo,
    redo,
    canUndo,
    canRedo,
  };

  return (
    <LayerContext.Provider value={value}>
      {children}
    </LayerContext.Provider>
  );
};

export const useLayerContext = () => {
  const context = useContext(LayerContext);
  if (!context) {
    throw new Error('useLayerContext must be used within LayerProvider');
  }
  return context;
};
