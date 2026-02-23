import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { saveLayout } from '../../../api/templates';
import { EXPORT_PIXEL_RATIO } from '../../../constants/dimensions';
import type { Students } from '../../../types/students';


import { usePreviewData } from '../hooks/usePreviewData';

interface DesignerContextType {
  templateId: number | null;
  templateName: string;
  editSide: 'FRONT' | 'BACK';
  setEditSide: (side: 'FRONT' | 'BACK') => void;
  tempLayout: any;
  setTempLayout: React.Dispatch<React.SetStateAction<any>>;
  currentSideData: any;
  isSaving: boolean;
  handleSave: (stageRef: any) => Promise<void>;
  handleExport: (stageRef: any, previewData: any) => void;
  onSave: (layout: any) => void;
  updateItem: (id: string, attrs: any) => void;
  allStudents: Students[];
  previewData: any;
}

const DesignerContext = createContext<DesignerContextType | undefined>(undefined);

export const DesignerProvider: React.FC<{
  children: React.ReactNode;
  templateId: number | null;
  templateName: string;
  currentLayout: any;
  onSave: (layout: any) => void;
  allStudents: Students[];
}> = ({ children, templateId, templateName, currentLayout, onSave, allStudents }) => {
  const { previewData } = usePreviewData(templateId, templateName, allStudents);


  const [editSide, setEditSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [tempLayout, setTempLayout] = useState(currentLayout);
  const [isSaving, setIsSaving] = useState(false);

  // Update layout when currentLayout prop changes
  useEffect(() => {
    if (currentLayout) {
      setTempLayout(currentLayout);
    }
  }, [currentLayout]);

  const currentSideData = tempLayout[editSide.toLowerCase()] || {};

  const updateItem = useCallback((id: string, attrs: any) => {
    const side = editSide.toLowerCase();
    setTempLayout((prev: any) => ({
      ...prev,
      [side]: {
        ...prev[side],
        [id]: { ...prev[side][id], ...attrs }
      }
    }));
  }, [editSide]);

  const handleSave = useCallback(async (stageRef: any) => {
    if (!templateId) {
      toast.error("Select a template");
      return;
    }
    if (!stageRef?.current) {
      toast.error("Canvas not ready");
      return;
    }

    setIsSaving(true);
    const originalSide = editSide;

    try {
      // Helper to capture PNG for each side
      const getSidePNG = async (side: 'FRONT' | 'BACK') => {
        setEditSide(side);
        await new Promise(r => setTimeout(r, 150)); // Wait for render
        return stageRef.current?.toDataURL({ pixelRatio: EXPORT_PIXEL_RATIO });
      };

      const frontPng = await getSidePNG('FRONT');
      const backPng = await getSidePNG('BACK');

      const updatedLayout = {
        ...tempLayout,
        previewImages: { front: frontPng, back: backPng }
      };

      await saveLayout(templateId, templateName, updatedLayout);
      onSave(updatedLayout);
      setEditSide(originalSide); // Restore original side
      toast.success("Changes saved!");
    } catch (e) {
      console.error('Save error:', e);
      toast.error("Save failed");
      setEditSide(originalSide);
    } finally {
      setIsSaving(false);
    }
  }, [templateId, templateName, tempLayout, onSave, editSide]);

  const handleExport = useCallback((stageRef: any, previewData: any) => {
    if (!stageRef?.current) return;

    setTimeout(() => {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: EXPORT_PIXEL_RATIO });
      const link = document.createElement('a');
      link.download = `${previewData?.idNumber || 'ID'}_${editSide}.png`;
      link.href = dataURL;
      link.click();
      toast.success(`Exported ${editSide} side`);
    }, 50);
  }, [editSide]);

  const value = {
    templateId,
    templateName,
    editSide,
    setEditSide,
    tempLayout,
    setTempLayout,
    currentSideData,
    isSaving,
    handleSave,
    handleExport,
    onSave,
    updateItem,
    allStudents,
    previewData
  };



  return (
    <DesignerContext.Provider value={value}>
      {children}
    </DesignerContext.Provider>
  );
};

export const useDesignerContext = () => {
  const context = useContext(DesignerContext);
  if (!context) {
    throw new Error('useDesignerContext must be used within DesignerProvider');
  }
  return context;
};
