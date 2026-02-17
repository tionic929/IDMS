import React, { useState } from 'react';
import { Layout, ChevronLeft, ChevronRight } from 'lucide-react';
import Templates from './Templates';
import CardDesigner from './CardDesigner';

interface DesignerWorkspaceProps {
  selectedTemplate: any;
  setSelectedTemplate: (template: any) => void;
  saveCount: number;
  setSaveCount: React.Dispatch<React.SetStateAction<number>>;
}

const DesignerWorkspace: React.FC<DesignerWorkspaceProps> = ({
  selectedTemplate,
  setSelectedTemplate,
  saveCount,
  setSaveCount,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-full bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden relative">
      
      {/* SIDEBAR: Template Library */}
      <div 
        className={`transition-all duration-300 ease-in-out border-r border-zinc-800 shrink-0 relative ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <Templates 
          activeId={selectedTemplate?.id} 
          onSelect={(t) => setSelectedTemplate(t)} 
          refreshTrigger={saveCount}
          isCollapsed={isCollapsed}
        />

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white p-1 rounded-full shadow-md transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
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
          <div className="h-full flex flex-col items-center justify-center bg-zinc-900/30">
            <div className="p-8 rounded-full bg-zinc-900/50 mb-4 text-zinc-700 border border-zinc-800">
              <Layout size={48} strokeWidth={1} />
            </div>
            <p className="text-zinc-600 font-black uppercase tracking-[0.2em] text-[10px]">
              Select a template to begin designing
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerWorkspace;