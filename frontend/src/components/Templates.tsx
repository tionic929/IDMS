import React, { useEffect, useState } from 'react';
import { Layout, Plus, CheckCircle2, Trash2, Edit3, Loader2, Layers } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import type { Template, TemplatesProps } from '../types/templates';

import { getTemplate, createNewTemplate, handleActiveLayouts } from '../api/templates';

const Templates: React.FC<TemplatesProps> = ({ onSelect, activeId, refreshTrigger }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    if (templates.length === 0) setLoading(true);
    try {
      const data = await getTemplate();
      setTemplates(data);
    } catch (error) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [refreshTrigger]);

  const handleCreateNew = async () => {
    const templateName = window.prompt("Enter template name:");
    if (!templateName) return;

    try {
      const data = await createNewTemplate(templateName);
      setTemplates([...templates, data]);
      toast.success("Template created!");
    } catch (error) {
      toast.error("Error creating template");
    }
  };

  const handleSetActive = async (id: number) => {
    try {
      await handleActiveLayouts(id);
      fetchTemplates();
      toast.success("Template set as active");
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  return (
    <div className="w-46 flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div>
          <h3 className="text-[11px] font-black uppercase text-zinc-100 tracking-wider">Library</h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">Templates</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-all shadow-lg shadow-indigo-500/20"
          title="New Template"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Loader2 size={24} className="animate-spin mb-2 text-zinc-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Loading...</span>
          </div>
        ) : templates.map((template) => (
          <div 
            key={template.id}
            onClick={() => onSelect(template)}
            className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
              activeId === template.id 
                ? 'bg-indigo-500/10 border-indigo-500/50' 
                : 'bg-transparent border-transparent hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded-md ${activeId === template.id ? 'bg-indigo-500 text-white' : 'bg-zinc-950 text-zinc-600 group-hover:text-zinc-400'}`}>
                  <Layers size={14} />
                </div>
                <div className="overflow-hidden">
                  <h4 className={`text-[11px] font-bold truncate ${activeId === template.id ? 'text-indigo-400' : 'text-zinc-300'}`}>
                    {template.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-zinc-600 uppercase">ID: {template.id}</span>
                    {template.is_active && (
                       <span className="text-[7px] bg-emerald-500/10 text-emerald-500 px-1 rounded font-black uppercase">Active</span>
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); handleSetActive(template.id); }}
                className={`p-1.5 rounded-md transition-all ${template.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-700 hover:text-emerald-500 hover:bg-emerald-500/5'}`}
                title={template.is_active ? "Active Template" : "Set as Active"}
              >
                <CheckCircle2 size={14} />
              </button>
            </div>
          </div>
        ))}
        
        {!loading && templates.length === 0 && (
          <div className="py-20 text-center opacity-20">
            <Layout size={32} className="mx-auto mb-4" />
            <p className="text-[10px] font-bold uppercase">No templates found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;