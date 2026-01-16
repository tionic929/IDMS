import React, { useEffect, useState } from 'react';
import { Layout, Plus, CheckCircle2, Trash2, Edit3 } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter">Saved <span className="text-teal-500">Templates</span></h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select or manage ID designs</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="p-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl transition-all shadow-lg shadow-teal-500/20"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {templates.map((template) => (
          <div 
            key={template.id}
            onClick={() => onSelect(template)}
            className={`group relative p-4 rounded-3xl border-2 transition-all cursor-pointer ${
              activeId === template.id 
                ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-500/5' 
                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${activeId === template.id ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <Layout size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">{template.name}</h4>
                  <p className="text-[9px] font-mono text-slate-400 uppercase">ID: {template.id}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleSetActive(template.id); }}
                  className={`p-2 rounded-lg transition-colors ${template.is_active ? 'text-teal-500' : 'text-slate-300 hover:text-teal-400'}`}
                >
                  <CheckCircle2 size={16} fill={template.is_active ? 'currentColor' : 'none'} className={template.is_active ? 'text-white' : ''}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Templates;