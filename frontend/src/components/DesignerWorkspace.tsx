import React from 'react';
import { Layout, ChevronLeft, ChevronRight } from 'lucide-react';
import Templates from './Templates';
import { useTemplates } from '../context/TemplateContext';
import CardDesigner from './CardDesigner';
import type { Students } from '../types/students';
import { cn } from "@/lib/utils";


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
  const { templates } = useTemplates();
  const [isTemplatesCollapsed, setIsTemplatesCollapsed] = React.useState(false);

  return (
    <div className="flex h-full bg-card border border-border overflow-hidden rounded-lg relative">
      {/* LEFT SIDEBAR: Template Library */}
      <div 
        className={cn(
          "relative border-r border-border shrink-0 bg-background/50 backdrop-blur-md transition-all duration-500 ease-in-out group/sidebar",
          isTemplatesCollapsed ? "w-[72px]" : "w-[280px]"
        )}
      >

        <div className="h-full">
          <Templates
            activeId={selectedTemplate?.id}
            onSelect={(t) => setSelectedTemplate(t)}
            refreshTrigger={saveCount}
            isCollapsed={isTemplatesCollapsed}
            onToggleCollapse={() => setIsTemplatesCollapsed(!isTemplatesCollapsed)}
          />
        </div>
      </div>

      {/* MAIN AREA: Card Designer */}
      <div className="flex-1 relative min-w-0">
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
          <div className="h-full flex flex-col items-center justify-center">
            <div className="p-8 rounded-lg bg-muted mb-4 text-muted-foreground">
              <Layout size={48} strokeWidth={1} />
            </div>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
              Select a template to begin designing
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerWorkspace;