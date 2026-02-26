import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface DesignerContextType {
  editSide: 'FRONT' | 'BACK';
  setEditSide: (side: 'FRONT' | 'BACK') => void;
  tempLayout: any;
  setTempLayout: React.Dispatch<React.SetStateAction<any>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  zoom: number;
  setZoom: (z: number | ((p: number) => number)) => void;
  snapEnabled: boolean;
  setSnapEnabled: (v: boolean) => void;
  updateItem: (id: string, attrs: any) => void;
}

const DesignerContext = createContext<DesignerContextType | undefined>(undefined);

export const DesignerProvider: React.FC<{ children: React.ReactNode, initialLayout: any }> = ({ children, initialLayout }) => {
  const [editSide, setEditSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [tempLayout, setTempLayout] = useState(initialLayout);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.8);
  const [snapEnabled, setSnapEnabled] = useState(true);

  useEffect(() => { if (initialLayout) setTempLayout(initialLayout); }, [initialLayout]);

  const updateItem = useCallback((id: string, attrs: any) => {
    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => ({
      ...prev, [side]: { ...prev[side], [id]: { ...prev[side][id], ...attrs } }
    }));
  }, [editSide]);

  return (
    <DesignerContext.Provider value={{
      editSide, setEditSide, tempLayout, setTempLayout,
      selectedId, setSelectedId, zoom, setZoom,
      snapEnabled, setSnapEnabled, updateItem
    }}>
      {children}
    </DesignerContext.Provider>
  );
};

export const useDesigner = () => {
  const context = useContext(DesignerContext);
  if (!context) throw new Error('useDesigner must be used within DesignerProvider');
  return context;
};