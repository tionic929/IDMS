
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

import { toast } from 'react-toastify';
import { useDesignerContext } from './DesignerContext';
import { reorderLayer } from '../../../utils/designerUtils';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../../../constants/dimensions';

interface LayerContextType {
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  toggleSelection: (id: string, multi: boolean) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  addShape: (type: 'rect' | 'circle') => void;
  addText: () => void;
  handleDelete: (ids?: string[]) => void;
  handleDuplicate: (ids?: string[]) => void;
  handleGroupSelected: () => void;
  handleUngroup: (groupId: string) => void;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleSelection = useCallback((id: string, multi: boolean) => {
    if (multi) {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedIds([id]);
    }
  }, []);

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
    setSelectedIds([id]);
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
    setSelectedIds([id]);
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
        setSelectedIds([id]);
        toast.success("Image uploaded");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, [editSide, setTempLayout, tempLayout, pushHistory]);

  const handleDelete = useCallback((ids?: string[]) => {
    const targetIds = ids || selectedIds;
    if (!targetIds.length) return;

    pushHistory(tempLayout);
    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => {
      const newSideConfig = { ...prev[side] };
      targetIds.forEach(id => {
        // If it's a group, we might want to ungroup or delete children? 
        // For now, simple delete.
        delete newSideConfig[id];
        // Also remove from any group children list if it was a child
        Object.keys(newSideConfig).forEach(k => {
          if (newSideConfig[k].children) {
            newSideConfig[k].children = newSideConfig[k].children.filter((cid: string) => cid !== id);
          }
        });
      });
      return { ...prev, [side]: newSideConfig };
    });

    setSelectedIds(prev => prev.filter(id => !targetIds.includes(id)));
  }, [selectedIds, editSide, tempLayout, setTempLayout, pushHistory]);

  const handleDuplicate = useCallback((ids?: string[]) => {
    const targetIds = ids || selectedIds;
    if (!targetIds.length) return;

    const side = editSide.toLowerCase();
    pushHistory(tempLayout);

    setTempLayout((prev: any) => {
      const newSideConfig = { ...prev[side] };
      const newSelectedIds: string[] = [];

      targetIds.forEach(id => {
        const source = newSideConfig[id];
        if (!source) return;

        const newId = `${source.type || 'copy'}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const duplicate = {
          ...source,
          x: source.x + 20,
          y: source.y + 20,
          visible: true
        };
        
        newSideConfig[newId] = duplicate;
        newSelectedIds.push(newId);
      });

      return { ...prev, [side]: newSideConfig };
    });
  }, [editSide, selectedIds, tempLayout, setTempLayout, pushHistory]);

  const handleGroupSelected = useCallback(() => {
    if (selectedIds.length < 2) {
      toast.warn("Select at least 2 layers to group");
      return;
    }

    pushHistory(tempLayout);
    const side = editSide.toLowerCase();
    const id = `group_${Date.now()}`;
    
    // Calculate bounding box
    const items = selectedIds.map(id => tempLayout[side][id]).filter(Boolean);
    const minX = Math.min(...items.map(i => i.x));
    const minY = Math.min(...items.map(i => i.y));
    const maxX = Math.max(...items.map(i => i.x + (i.width || 0)));
    const maxY = Math.max(...items.map(i => i.y + (i.height || 0)));

    const newGroup = {
      type: 'group',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      children: [...selectedIds],
      visible: true
    };

    setTempLayout((prev: any) => {
      const newSideConfig = { ...prev[side] };
      // Assign groupId to children
      selectedIds.forEach(cid => {
        if (newSideConfig[cid]) {
          newSideConfig[cid] = { ...newSideConfig[cid], groupId: id };
        }
      });
      newSideConfig[id] = newGroup;
      return { ...prev, [side]: newSideConfig };
    });

    setSelectedIds([id]);
    toast.success("Layers grouped");
  }, [selectedIds, editSide, tempLayout, setTempLayout, pushHistory]);

  const handleUngroup = useCallback((groupId: string) => {
    const side = editSide.toLowerCase();
    const group = tempLayout[side][groupId];
    if (!group || group.type !== 'group' || !group.children) return;

    pushHistory(tempLayout);
    setTempLayout((prev: any) => {
      const newSideConfig = { ...prev[side] };
      const children = group.children || [];
      
      children.forEach((cid: string) => {
        if (newSideConfig[cid]) {
          const { groupId: _, ...rest } = newSideConfig[cid];
          newSideConfig[cid] = rest;
        }
      });
      
      delete newSideConfig[groupId];
      return { ...prev, [side]: newSideConfig };
    });
    
    setSelectedIds(group.children);
    toast.info("Ungrouped");
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
    setSelectedIds([newName]);
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
    if (selectedIds.length !== 1) return;
    const selectedId = selectedIds[0];

    pushHistory(tempLayout);
    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: reorderLayer(prev[side], selectedId, direction)
    }));
  }, [selectedIds, editSide, setTempLayout, tempLayout, pushHistory]);

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
    selectedIds,
    setSelectedIds,
    toggleSelection,
    addShape,
    addText,
    handleDelete,
    handleDuplicate,
    handleGroupSelected,
    handleUngroup,
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
