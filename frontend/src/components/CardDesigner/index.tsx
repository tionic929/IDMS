import React, { useRef } from 'react';
import { DesignerProvider } from './context/DesignerContext';
import { CanvasProvider } from './context/CanvasContext';
import { LayerProvider } from './context/LayerContext';

import { DesignerTopBar } from './components/DesignerTopBar';
import { DesignerLeftToolbar } from './components/DesignerLeftToolbar';
import { DesignerLayersSidebar } from './components/DesignerLayersSidebar';
import { DesignerCanvas } from './components/DesignerCanvas';
import { DesignerPropertyPanel } from './components/DesignerPropertyPanel';

import type { Students } from '../../types/students';

interface CardDesignerProps {
  templateId: number | null;
  templateName: string;
  onSave: (newLayout: any) => void;
  currentLayout: any;
  allStudents: Students[];
}


const CardDesignerContent: React.FC<{ templateId: number | null; templateName: string }> = ({
  templateId,
  templateName
}) => {
  const stageRef = useRef<any>(null);

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 overflow-hidden font-sans border border-slate-200 shadow-2xl select-none">
      <DesignerTopBar stageRef={stageRef} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Workspace Group */}
        <div className="flex bg-white border-r border-slate-200">
          <DesignerLeftToolbar />
          <DesignerLayersSidebar />
        </div>

        {/* Main Editor Canvas */}
        <DesignerCanvas stageRef={stageRef} />

        {/* Right Property Sidebar */}
        <DesignerPropertyPanel />
      </div>
    </div>
  );
};

const CardDesigner: React.FC<CardDesignerProps> = ({
  templateId,
  templateName,
  onSave,
  currentLayout,
  allStudents
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
