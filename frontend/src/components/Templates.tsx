import React, { useState } from 'react';
import { Layout, Plus, CheckCircle2, Trash2, Edit3, Loader2, Layers, Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Template } from '../types/templates';
import TemplateModal from '../components/Modals/TemplateModal';
import { 
  getTemplate, 
  createNewTemplate, 
  handleActiveLayouts, 
  deleteTemplate, 
  duplicateTemplate, 
  saveLayout 
} from '../api/templates';

interface ExtendedTemplatesProps {
  onSelect: (t: Template) => void;
  activeId?: number;
  refreshTrigger?: number;
  isCollapsed: boolean;
}

const Templates: React.FC<ExtendedTemplatesProps> = ({ onSelect, activeId, refreshTrigger, isCollapsed }) => {
  const queryClient = useQueryClient();
  const [modalType, setModalType] = useState<'create' | 'rename' | 'delete' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [inputValue, setInputValue] = useState('');

  // ✅ Use React Query for automatic caching and refetching
  const { data: templates = [], isLoading: loading } = useQuery({
    queryKey: ['templates', refreshTrigger], // Include refreshTrigger to force refetch
    queryFn: getTemplate,
    staleTime: 2 * 60 * 1000, // Keep data fresh for 2 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  // ✅ Optimistic updates with React Query mutations
  const createMutation = useMutation({
    mutationFn: createNewTemplate,
    onMutate: async (newName) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['templates'] });

      // Snapshot previous value
      const previousTemplates = queryClient.getQueryData(['templates']);

      // Optimistically update with temporary template
      queryClient.setQueryData(['templates', refreshTrigger], (old: Template[] = []) => [
        { id: Date.now(), name: newName, is_active: false, front_config: {}, back_config: {} } as Template,
        ...old
      ]);

      return { previousTemplates };
    },
    onError: (err, newName, context) => {
      // Rollback on error
      queryClient.setQueryData(['templates', refreshTrigger], context?.previousTemplates);
      toast.error("Error creating template");
    },
    onSuccess: (data) => {
      toast.success("Template created!");
      closeModal();
    },
    onSettled: () => {
      // Refetch to ensure we have latest data
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name, config }: { id: number; name: string; config: any }) => 
      saveLayout(id, name, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success("Template renamed");
      closeModal();
    },
    onError: () => {
      toast.error("Failed to rename");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['templates'] });
      const previousTemplates = queryClient.getQueryData(['templates']);

      // Optimistically remove from UI
      queryClient.setQueryData(['templates', refreshTrigger], (old: Template[] = []) => 
        old.filter(t => t.id !== deletedId)
      );

      return { previousTemplates };
    },
    onError: (err, deletedId, context) => {
      queryClient.setQueryData(['templates', refreshTrigger], context?.previousTemplates);
      toast.error("Error deleting template");
    },
    onSuccess: () => {
      toast.success("Template deleted");
      closeModal();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateTemplate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success("Template duplicated");
    },
    onError: () => {
      toast.error("Failed to duplicate");
    },
  });

  const closeModal = () => { 
    setModalType(null); 
    setSelectedTemplate(null); 
    setInputValue(''); 
  };

  const handleConfirmCreate = () => {
    if (!inputValue.trim()) return;
    createMutation.mutate(inputValue);
  };

  const handleConfirmRename = () => {
    if (!selectedTemplate || !inputValue.trim() || inputValue === selectedTemplate.name) { 
      closeModal(); 
      return; 
    }
    renameMutation.mutate({ 
      id: selectedTemplate.id, 
      name: inputValue, 
      config: { 
        front: selectedTemplate.front_config, 
        back: selectedTemplate.back_config 
      } 
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedTemplate) return;
    deleteMutation.mutate(selectedTemplate.id);
  };

  const handleDuplicate = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    duplicateMutation.mutate(id);
  };

  const isProcessing = createMutation.isPending || renameMutation.isPending || deleteMutation.isPending;

  return (
    <div className="flex flex-col h-full bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b border-zinc-800 flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex flex-col transition-all duration-300 origin-left ${isCollapsed ? 'w-0 opacity-0 scale-x-0' : 'w-auto opacity-100 scale-x-100'}`}>
          <h3 className="text-[11px] font-black uppercase text-zinc-100 tracking-wider whitespace-nowrap">Library</h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight whitespace-nowrap">Templates</p>
        </div>
        <button 
          onClick={() => { setInputValue(''); setModalType('create'); }}
          className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-all shadow-lg shadow-indigo-500/20 shrink-0"
          aria-label="Create new template"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-20">
            <Loader2 size={18} className="animate-spin text-zinc-400" />
            {!isCollapsed && <p className="text-[9px] text-zinc-500 mt-2 uppercase font-bold">Loading...</p>}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Layout size={32} className="text-zinc-700 mb-2" />
            {!isCollapsed && (
              <>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">No Templates</p>
                <p className="text-[9px] text-zinc-600 mt-1">Create your first template</p>
              </>
            )}
          </div>
        ) : (
          templates.map((template) => (
            <div 
              key={template.id}
              onClick={() => onSelect(template)}
              className={`group relative rounded-lg border transition-all duration-300 cursor-pointer overflow-hidden ${
                isCollapsed ? 'p-2' : 'p-3'
              } ${
                activeId === template.id 
                  ? 'bg-indigo-500/10 border-indigo-500/50' 
                  : 'bg-transparent border-transparent hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Icon - Stays fixed */}
                <div className={`p-2 rounded-md shrink-0 transition-colors ${activeId === template.id ? 'bg-indigo-500 text-white' : 'bg-zinc-950 text-zinc-600 group-hover:text-zinc-400'}`}>
                  <Layers size={14} />
                </div>

                {/* Text Content - Transforms on X-axis */}
                <div className={`flex flex-col text-left transition-all duration-300 origin-left overflow-hidden ${
                  isCollapsed ? 'w-0 opacity-0 scale-x-0 invisible' : 'w-full opacity-100 scale-x-100 visible'
                }`}>
                  <h4 className={`text-[11px] font-bold truncate whitespace-nowrap ${activeId === template.id ? 'text-indigo-400' : 'text-zinc-300'}`}>
                    {template.name}
                  </h4>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-[8px] font-mono text-zinc-600 uppercase">ID: {template.id}</span>
                    {template.is_active && (
                      <span className="text-[7px] bg-emerald-500/10 text-emerald-500 px-1 rounded font-black uppercase">Active</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Slide/Fade */}
                {!isCollapsed && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setSelectedTemplate(template); 
                        setInputValue(template.name); 
                        setModalType('rename'); 
                      }} 
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-500 hover:text-zinc-100 transition-colors"
                      aria-label="Rename template"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button 
                      onClick={(e) => handleDuplicate(e, template.id)} 
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-500 hover:text-zinc-100 transition-colors"
                      disabled={duplicateMutation.isPending}
                      aria-label="Duplicate template"
                    >
                      <Copy size={11} />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setSelectedTemplate(template); 
                        setModalType('delete'); 
                      }} 
                      className="p-1 hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-500 transition-colors"
                      aria-label="Delete template"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODALS */}
      <TemplateModal 
        isOpen={modalType === 'create' || modalType === 'rename'} 
        onClose={closeModal} 
        title={modalType === 'create' ? "New Template" : "Rename Template"} 
        footer={
          <>
            <button 
              onClick={closeModal} 
              className="px-4 py-2 text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={modalType === 'create' ? handleConfirmCreate : handleConfirmRename} 
              disabled={isProcessing || !inputValue.trim()} 
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
            Display Name
          </label>
          <input 
            autoFocus 
            type="text" 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors" 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim()) {
                modalType === 'create' ? handleConfirmCreate() : handleConfirmRename();
              }
            }}
            placeholder="Enter template name..."
          />
        </div>
      </TemplateModal>

      <TemplateModal 
        isOpen={modalType === 'delete'} 
        onClose={closeModal} 
        title="Delete Template" 
        footer={
          <>
            <button 
              onClick={closeModal} 
              className="px-4 py-2 text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors"
            >
              Go Back
            </button>
            <button 
              onClick={handleConfirmDelete} 
              disabled={isProcessing} 
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : 'Delete Permanently'}
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
            <AlertTriangle size={32} />
          </div>
          <div>
            <p className="text-sm text-zinc-300">
              Delete <span className="text-white font-bold">"{selectedTemplate?.name}"</span>?
            </p>
            <p className="text-xs text-zinc-500 mt-2">This action cannot be undone</p>
          </div>
        </div>
      </TemplateModal>
    </div>
  );
};

export default Templates;