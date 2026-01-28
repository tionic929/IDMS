import React from 'react';
import { Layout } from 'lucide-react';
import Templates from './Templates';
import CardDesigner from './CardDesigner';
import type { Students } from '../types/students';

interface DesignerWorkspaceProps {
  selectedTemplate: any;
  setSelectedTemplate: (template: any) => void;
  saveCount: number;
  setSaveCount: React.Dispatch<React.SetStateAction<number>>;
  allStudents: Students[];
}

const DesignerWorkspace: React.FC<DesignerWorkspaceProps> = ({
  selectedTemplate,
  setSelectedTemplate,
  saveCount,
  setSaveCount,
  allStudents
}) => {
  return (
    <div className="flex h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* LEFT SIDEBAR: Template Library */}
      <div className="w-46 border-r border-slate-100 dark:border-slate-800 shrink-0">
        <Templates 
          activeId={selectedTemplate?.id} 
          onSelect={(t) => setSelectedTemplate(t)} 
          refreshTrigger={saveCount}
        />
      </div>

      {/* MAIN AREA: Card Designer */}
      <div className="flex-1 relative min-w-0 bg-zinc-950">
        {selectedTemplate ? (
          <CardDesigner 
            templateId={selectedTemplate.id}
            templateName={selectedTemplate.name}
            currentLayout={{
              front: { ...selectedTemplate.front_config },
              back: { ...selectedTemplate.back_config }
            }}
            allStudents={allStudents}
            onSave={(updatedConfig) => {
              setSelectedTemplate((prev: any) => ({
                ...prev,
                front_config: updatedConfig.front,
                back_config: updatedConfig.back
              }));
              setSaveCount(prev => prev + 1);
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-zinc-900">
            <div className="p-8 rounded-full bg-zinc-800 mb-4 text-zinc-600">
              <Layout size={48} strokeWidth={1} />
            </div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
              Select a template to begin designing
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerWorkspace;