import React, { useEffect, useState } from 'react';
import { Layout, Plus, Loader2, Layers, Sparkles, Copy, Trash2, Edit3, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Template, TemplatesProps } from '../types/templates';
import { useTemplates } from '../context/TemplateContext';

// shadcn UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CURATED_THEMES = [
  { id: 'default', name: 'Default', value: '' },
  { id: 'ocean', name: 'Ocean', value: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' },
  { id: 'peach', name: 'Peach', value: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)' },
  { id: 'emerald', name: 'Emerald', value: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { id: 'amethyst', name: 'Amethyst', value: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' },
  { id: 'midnight', name: 'Midnight', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' },
  { id: 'cherry', name: 'Cherry', value: 'linear-gradient(135deg, #be123c 0%, #e11d48 100%)' },
  { id: 'amber', name: 'Amber', value: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' },
];

const TemplateSkeleton = () => (
  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
    </div>
    <div className="space-y-2">
      <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-800 rounded shadow-sm" />
      <div className="h-2.5 w-1/3 bg-slate-50 dark:bg-slate-900 rounded shadow-sm" />
    </div>
  </div>
);

const Templates: React.FC<TemplatesProps> = ({ onSelect, activeId, refreshTrigger }) => {
  const { templates, loading, createTemplate, refreshTemplates, deleteTemplate, duplicateTemplate, renameTemplate } = useTemplates();
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Modal states for actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [switchingTemplate, setSwitchingTemplate] = useState<Template | null>(null);
  const [duplicatingTemplate, setDuplicatingTemplate] = useState<Template | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);
  const [renamingTemplate, setRenamingTemplate] = useState<Template | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [newBgColor, setNewBgColor] = useState("");
  const [newLogo, setNewLogo] = useState("");
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);

  const [renameBgColor, setRenameBgColor] = useState("");
  const [renameLogo, setRenameLogo] = useState("");
  const [renameLogoFile, setRenameLogoFile] = useState<File | null>(null);

  useEffect(() => {
    refreshTemplates();
  }, [refreshTrigger, refreshTemplates]);

  const handleCreateNew = async () => {
    if (!newTemplateName.trim()) return;
    setIsCreating(true);
    try {
      await createTemplate(newTemplateName, newBgColor, newLogoFile || newLogo);
      setNewTemplateName("");
      setNewBgColor("");
      setNewLogo("");
      setNewLogoFile(null);
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled in context
    } finally {
      setIsCreating(false);
    }
  };

  const handleTemplateClick = (template: Template) => {
    if (activeId && activeId !== template.id) {
      setSwitchingTemplate(template);
    } else {
      onSelect(template);
    }
  };

  const handleSwitchConfirm = () => {
    if (switchingTemplate) {
      onSelect(switchingTemplate);
      setSwitchingTemplate(null);
    }
  };

  const handleDuplicateConfirm = async () => {
    if (duplicatingTemplate) {
      setActionLoading(`duplicate-${duplicatingTemplate.id}`);
      try {
        await duplicateTemplate(duplicatingTemplate.id);
        setDuplicatingTemplate(null);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingTemplate) {
      setActionLoading(`delete-${deletingTemplate.id}`);
      try {
        await deleteTemplate(deletingTemplate.id);
        setDeletingTemplate(null);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleRenameConfirm = async () => {
    if (renamingTemplate && renameInput.trim()) {
      setActionLoading(`rename-${renamingTemplate.id}`);
      try {
        await renameTemplate(renamingTemplate.id, renameInput, renameBgColor, renameLogoFile || renameLogo);
        setRenamingTemplate(null);
        setRenameLogoFile(null);
      } finally {
        setActionLoading(null);
      }
    } else {
        setRenamingTemplate(null);
    }
  };

  return (
    <div className="flex flex-col h-full font-sans">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[1rem] text-slate-900 dark:text-white font-black uppercase tracking-tight">Templates</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all rounded-lg"
              >
                <Plus size={16} strokeWidth={3} />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-border/40 rounded-[2rem] p-8 max-w-sm">
              <DialogHeader className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles size={24} />
                </div>
                <DialogTitle className="text-2xl font-black text-white italic uppercase">New Template</DialogTitle>
                <DialogDescription className="text-zinc-400 font-medium">
                  Define a new layout identifier for your ID card designs.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <Input
                  placeholder="e.g. Science Dept 2026"
                  className="bg-zinc-950/50 border-border/40 h-12 rounded-xl text-white font-bold"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Theme</label>
                    <div className="flex flex-wrap gap-1.5 p-1.5 bg-zinc-950/50 border border-border/40 rounded-xl">
                      {CURATED_THEMES.map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => setNewBgColor(theme.value)}
                          title={theme.name}
                          className={cn(
                            "w-6 h-6 rounded-lg transition-all border-2",
                            newBgColor === theme.value ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105",
                            !theme.value && "bg-zinc-800"
                          )}
                          style={theme.value ? { background: theme.value } : undefined}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Logo</label>
                    <button 
                      onClick={() => document.getElementById('new-template-logo-input')?.click()}
                      className="w-full h-12 bg-zinc-950/50 rounded-xl border border-border/40 flex items-center justify-center gap-2 hover:bg-zinc-900 transition-all overflow-hidden relative group text-zinc-400"
                    >
                      {newLogo ? (
                        <div className="flex items-center gap-2">
                            <img src={newLogo} className="w-6 h-6 object-contain" />
                            <span className="text-[10px] text-primary font-bold">Logo Set</span>
                        </div>
                      ) : (
                        <>
                          <ImageIcon size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Upload</span>
                        </>
                      )}
                    </button>
                    <input 
                      id="new-template-logo-input"
                      type="file" 
                      hidden 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewLogoFile(file);
                          setNewLogo(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateNew}
                  disabled={isCreating}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px]"
                >
                  {isCreating ? <Loader2 className="animate-spin" /> : "Initialize Template"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-none pb-10">
        {loading && templates.length === 0 ? (
          <>
            <TemplateSkeleton />
            <TemplateSkeleton />
            <TemplateSkeleton />
          </>
        ) : templates.map((template) => {
          const isActive = activeId === template.id;
          const meta = (template as any).front_config?.template_meta || {};
          const bgColor = meta.bg_color && meta.bg_color !== '#ffffff' ? meta.bg_color : undefined;
          const logo = template.logo || meta.logo || "";
          
          return (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              style={bgColor ? { background: bgColor } : undefined}
              className={cn(
                "group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden",
                isActive
                  ? (bgColor ? 'border-white/40 shadow-sm shadow-black/20 text-white' : 'bg-primary/5 border-primary/40 shadow-sm shadow-primary/5')
                  : (bgColor ? 'border-transparent hover:border-white/30 text-white shadow-sm' : 'border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800/40')
              )}
            >
              {isActive && !bgColor && (
                <motion.div layoutId="active-template-glow" className="absolute -left-10 -top-10 w-24 h-24 bg-primary/20 blur-[40px] pointer-events-none" />
              )}
              {isActive && bgColor && (
                <div className="absolute inset-0 bg-white/10 pointer-events-none" />
              )}

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "w-10 h-10 rounded-xl transition-colors shrink-0 flex items-center justify-center overflow-hidden",
                    isActive && !bgColor ? "bg-primary text-white" : (!bgColor ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-zinc-600 group-hover:text-primary/60" : "bg-white/20 text-white")
                  )}
                  style={bgColor ? { backdropFilter: 'blur(8px)' } : undefined}
                  >
                    {logo ? (
                      <img src={logo} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Layers size={14} strokeWidth={2.5} />
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setRenameInput(template.name);
                        setRenameBgColor(meta.bg_color || "");
                        setRenameLogo(template.logo || meta.logo || "");
                        setRenameLogoFile(null);
                        setRenamingTemplate(template); 
                      }}
                      className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center transition-all",
                        bgColor ? "text-white/70 hover:text-white hover:bg-white/20" : "text-slate-400 hover:text-blue-500 hover:bg-blue-500/10"
                      )}
                      title="Rename Template"
                    >
                      <Edit3 size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDuplicatingTemplate(template); }}
                      className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center transition-all",
                        bgColor ? "text-white/70 hover:text-white hover:bg-white/20" : "text-slate-400 hover:text-primary hover:bg-primary/10"
                      )}
                      title="Duplicate Template"
                      disabled={actionLoading === `duplicate-${template.id}`}
                    >
                      {actionLoading === `duplicate-${template.id}` ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} strokeWidth={2.5} />}
                    </button>
                    <div className={cn("w-px h-4 mx-1", bgColor ? "bg-white/20" : "bg-slate-200 dark:bg-slate-800")} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingTemplate(template); }}
                      className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center transition-all",
                        bgColor ? "text-white/70 hover:text-white hover:bg-red-500/40" : "text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                      )}
                      title="Delete Template"
                      disabled={actionLoading === `delete-${template.id}`}
                    >
                      {actionLoading === `delete-${template.id}` ? <Loader2 size={14} className="animate-spin text-red-500" /> : <Trash2 size={14} strokeWidth={2.5} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className={cn(
                    "text-[11px] font-black uppercase tracking-tight truncate",
                    isActive ? (bgColor ? 'text-white' : 'text-primary') : (bgColor ? 'text-white/90' : 'text-slate-700 dark:text-zinc-200')
                  )}>
                    {template.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      "text-[8px] h-4 px-1 py-0 font-bold border-slate-200 dark:border-white/5 tracking-widest uppercase",
                      bgColor ? "bg-white/10 text-white/80 border-white/10" : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-zinc-500"
                    )}>
                      UID: {template.id}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && templates.length === 0 && (
          <div className="py-20 text-center opacity-10">
            <Layout size={32} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No Library Nodes</p>
          </div>
        )}
      </div>

      {/* Action Modals */}
      {/* Switch Warning Modal */}
      <Dialog open={!!switchingTemplate} onOpenChange={(open) => !open && setSwitchingTemplate(null)}>
        <DialogContent className="bg-zinc-900 border-border/40 rounded-[2rem] p-8 max-w-sm">
          <DialogHeader className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertCircle size={24} />
            </div>
            <DialogTitle className="text-2xl font-black text-white italic uppercase">Switch Template</DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">
              Are you sure you want to open <span className="text-white font-bold">"{switchingTemplate?.name}"</span>? Unsaved changes in your current session might be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setSwitchingTemplate(null)}
              className="text-zinc-400 hover:text-white hover:bg-white/5 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSwitchConfirm}
              className="h-12 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black uppercase tracking-widest text-[10px]"
            >
              Open Designer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Modal */}
      <Dialog open={!!renamingTemplate} onOpenChange={(open) => !open && setRenamingTemplate(null)}>
        <DialogContent className="bg-zinc-900 border-border/40 rounded-[2rem] p-8 max-w-sm">
          <DialogHeader className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Edit3 size={24} />
            </div>
            <DialogTitle className="text-2xl font-black text-white italic uppercase">Rename Template</DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">
              Update the name identifier for this layout.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              placeholder="Template name"
              className="bg-zinc-950/50 border-border/40 h-12 rounded-xl text-white font-bold"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
            />
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Theme</label>
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-zinc-950/50 border border-border/40 rounded-xl">
                  {CURATED_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setRenameBgColor(theme.value)}
                      title={theme.name}
                      className={cn(
                        "w-6 h-6 rounded-lg transition-all border-2",
                        renameBgColor === theme.value ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105",
                        !theme.value && "bg-zinc-800"
                      )}
                      style={theme.value ? { background: theme.value } : undefined}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Logo</label>
                <button 
                  onClick={() => document.getElementById('rename-template-logo-input')?.click()}
                  className="w-full h-12 bg-zinc-950/50 rounded-xl border border-border/40 flex items-center justify-center gap-2 hover:bg-zinc-900 transition-all overflow-hidden relative group text-zinc-400"
                >
                  {renameLogo ? (
                    <div className="flex items-center gap-2">
                        <img src={renameLogo} className="w-6 h-6 object-contain" />
                        <span className="text-[10px] text-primary font-bold">Logo Set</span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Upload</span>
                    </>
                  )}
                </button>
                <input 
                  id="rename-template-logo-input"
                  type="file" 
                  hidden 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setRenameLogoFile(file);
                      setRenameLogo(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setRenamingTemplate(null)}
              className="text-zinc-400 hover:text-white hover:bg-white/5 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameConfirm}
              disabled={!!actionLoading}
              className="h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px]"
            >
              {actionLoading === `rename-${renamingTemplate?.id}` ? <Loader2 className="animate-spin" /> : "Save Name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Modal */}
      <Dialog open={!!duplicatingTemplate} onOpenChange={(open) => !open && setDuplicatingTemplate(null)}>
        <DialogContent className="bg-zinc-900 border-border/40 rounded-[2rem] p-8 max-w-sm">
          <DialogHeader className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Copy size={24} />
            </div>
            <DialogTitle className="text-2xl font-black text-white italic uppercase">Duplicate Template</DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">
              Are you sure you want to create a copy of <span className="text-white font-bold">"{duplicatingTemplate?.name}"</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setDuplicatingTemplate(null)}
              className="text-zinc-400 hover:text-white hover:bg-white/5 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDuplicateConfirm}
              disabled={!!actionLoading}
              className="h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px]"
            >
              {actionLoading === `duplicate-${duplicatingTemplate?.id}` ? <Loader2 className="animate-spin" /> : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <DialogContent className="bg-zinc-900 border-border/40 rounded-[2rem] p-8 max-w-sm">
          <DialogHeader className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertCircle size={24} />
            </div>
            <DialogTitle className="text-2xl font-black text-red-500 italic uppercase">Delete Template</DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">
              Are you sure you want to permanently delete <span className="text-white font-bold">"{deletingTemplate?.name}"</span>? This action cannot be undone.
              {deletingTemplate?.is_active && <div className="mt-2 text-red-400/80 font-bold">Warning: This is the active template.</div>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setDeletingTemplate(null)}
              className="text-zinc-400 hover:text-white hover:bg-white/5 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={!!actionLoading}
              className="h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px]"
            >
              {actionLoading === `delete-${deletingTemplate?.id}` ? <Loader2 className="animate-spin" /> : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;