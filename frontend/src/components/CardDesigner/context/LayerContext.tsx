import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useDesignerContext } from './DesignerContext';
import { reorderLayer } from '../../../utils/designerUtils';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../../../constants/dimensions';

interface LayerContextType {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addShape: (type: 'rect' | 'circle') => void;
  addText: () => void;
  handleDelete: (id?: string) => void;
  handleDuplicate: (id: string) => void;
  handleRename: (oldId: string, newName: string) => void;
  handleToggleVisibility: (id: string) => void;
  moveLayer: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
  handleImageUpload: (file: File) => void;
}

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export const LayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { editSide, tempLayout, setTempLayout } = useDesignerContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addShape = useCallback((type: 'rect' | 'circle') => {
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
  }, [editSide, setTempLayout]);

  const addText = useCallback(() => {
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
  }, [editSide, setTempLayout]);

  const handleImageUpload = useCallback((file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
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
  }, [editSide, setTempLayout]);

  const handleDelete = useCallback((id?: string) => {
    const targetId = id || selectedId;
    if (!targetId) return;

    const side = editSide.toLowerCase();
    const newLayout = { ...tempLayout };
    delete newLayout[side][targetId];
    setTempLayout(newLayout);

    if (targetId === selectedId) {
      setSelectedId(null);
    }
  }, [selectedId, editSide, tempLayout, setTempLayout]);

  const handleDuplicate = useCallback((id: string) => {
    const side = editSide.toLowerCase();
    const source = tempLayout[side][id];
    if (!source) return;

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

      // Insert duplicate right after original
      Object.keys(currentSide).forEach(key => {
        newSideConfig[key] = currentSide[key];
        if (key === id) {
          newSideConfig[newId] = duplicate;
        }
      });

      return { ...prev, [side]: newSideConfig };
    });
    setSelectedId(newId);
  }, [editSide, tempLayout, setTempLayout]);

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

    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: reorderLayer(prev[side], selectedId, direction)
    }));
  }, [selectedId, editSide, setTempLayout]);

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
    handleImageUpload
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
