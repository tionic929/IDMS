import React, { useRef } from 'react';
import { DesignerProvider } from './context/DesignerContext';
import { CanvasProvider } from './context/CanvasContext';
import { LayerProvider } from './context/LayerContext';

import { DesignerTopBar } from './components/DesignerTopBar';
import { DesignerLeftToolbar } from './components/DesignerLeftToolbar';
import { DesignerLayersSidebar } from './components/DesignerLayersSidebar';
import { DesignerCanvas } from './components/DesignerCanvas';
import { DesignerPropertyPanel } from './components/DesignerPropertyPanel';
import { usePreviewData } from './hooks/usePreviewData';

interface CardDesignerProps {
  templateId: number | null;
  templateName: string;
  onSave: (newLayout: any) => void;
  currentLayout: any;
}

const CardDesignerContent: React.FC<{ templateId: number | null; templateName: string }> = ({
  templateId,
  templateName
}) => {
  const stageRef = useRef<any>(null);
  const { previewData } = usePreviewData(templateId, templateName);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-200 overflow-hidden font-sans border border-zinc-800 shadow-2xl select-none">
      <DesignerTopBar stageRef={stageRef} previewData={previewData} />

      <div className="flex flex-1 overflow-hidden">
        <DesignerLeftToolbar />
        <DesignerLayersSidebar />
        <DesignerCanvas stageRef={stageRef} />
        <DesignerPropertyPanel />
      </div>
    </div>
  );
};

const CardDesigner: React.FC<CardDesignerProps> = ({
  templateId,
  templateName,
  onSave,
  currentLayout
}) => {
  return (
    <DesignerProvider
      templateId={templateId}
      templateName={templateName}
      currentLayout={currentLayout}
      onSave={onSave}
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