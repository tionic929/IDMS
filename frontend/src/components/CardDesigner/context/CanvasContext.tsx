import React, { createContext, useContext, useState } from 'react';
import { DEFAULT_ZOOM } from '../../../constants/dimensions';

// Define the available modes and units
export type SnapMode = 'smart' | 'grid' | 'both';
export type GridUnit = 'px' | 'inch' | 'mm';

interface CanvasContextType {
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  activeTool: 'select' | 'hand';
  setActiveTool: (tool: 'select' | 'hand') => void;
  snapEnabled: boolean;
  setSnapEnabled: (enabled: boolean) => void;
  // Added Snap Mode and Grid Unit states
  snapMode: SnapMode;
  setSnapMode: (mode: SnapMode) => void;
  gridUnit: GridUnit;
  setGridUnit: (unit: GridUnit) => void;
  showSnapGuides: boolean;
  setShowSnapGuides: (show: boolean) => void;
  snapLines: { vertical: number[]; horizontal: number[] };
  setSnapLines: (lines: { vertical: number[]; horizontal: number[] }) => void;
  isTransforming: boolean;
  setIsTransforming: (transforming: boolean) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [showGrid, setShowGrid] = useState(true);
  const [activeTool, setActiveTool] = useState<'select' | 'hand'>('select');
  const [snapEnabled, setSnapEnabled] = useState(true);
  // Default states for new features
  const [snapMode, setSnapMode] = useState<SnapMode>('both');
  const [gridUnit, setGridUnit] = useState<GridUnit>('px');
  const [showSnapGuides, setShowSnapGuides] = useState(true);
  const [snapLines, setSnapLines] = useState<{ vertical: number[]; horizontal: number[] }>({
    vertical: [],
    horizontal: []
  });
  const [isTransforming, setIsTransforming] = useState(false);

  const value = {
    zoom,
    setZoom,
    showGrid,
    setShowGrid,
    activeTool,
    setActiveTool,
    snapEnabled,
    setSnapEnabled,
    snapMode,
    setSnapMode,
    gridUnit,
    setGridUnit,
    showSnapGuides,
    setShowSnapGuides,
    snapLines,
    setSnapLines,
    isTransforming,
    setIsTransforming
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvasContext = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within CanvasProvider');
  }
  return context;
};
