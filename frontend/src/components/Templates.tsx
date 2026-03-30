import React, { useEffect, useState } from 'react';
import { Layout, Plus, Loader2, Layers, Sparkles, Copy, Trash2, Edit3, AlertCircle, Image as ImageIcon, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Template, TemplatesProps } from '../types/templates';
import { useTemplates } from '../context/TemplateContext';
import { useSystemSettings } from '../context/SystemSettingsContext';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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

const Templates: React.FC<TemplatesProps & { isCollapsed?: boolean; onToggleCollapse?: () => void }> = ({ onSelect, activeId, refreshTrigger, isCollapsed, onToggleCollapse }) => {
  const { templates, loading, createTemplate, refreshTemplates, deleteTemplate, duplicateTemplate, renameTemplate } = useTemplates();
  const { settings } = useSystemSettings();
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
  const renameLogoInputRef = React.useRef<HTMLInputElement>(null);
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
      const templateId = String(duplicatingTemplate.id);
      setActionLoading("duplicate-" + templateId);
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
      setActionLoading("delete-" + deletingTemplate.id);
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
      setActionLoading("rename-" + renamingTemplate.id);
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
    <div className="flex flex-col h-full font-sans bg-background/50 backdrop-blur-md">
      {/* Header */}
      <div
        style={{ height: `${80 * settings.componentScale}px` }}
        className={cn(
          "flex items-center px-5 shrink-0 border-b border-border transition-all duration-300",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <div className="flex flex-col">
            <span
              className="font-black tracking-tight text-foreground leading-none"
              style={{ fontSize: `${15 * settings.componentScale}px` }}
            >
              Template
            </span>
            <span
              className="font-black uppercase text-primary tracking-[0.2em] mt-1.5 leading-none"
              style={{ fontSize: `${9 * settings.componentScale}px` }}
            >
              Library
            </span>
          </div>
        )}

          <div className="flex items-center gap-1.5 shrink-0">
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
              <DialogContent className="bg-white border-zinc-200 rounded-[2rem] p-8 max-w-sm shadow-2xl shadow-black/10">
                <DialogHeader className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles size={24} />
                  </div>
                  <DialogTitle className="text-2xl font-black text-zinc-900 italic uppercase">New Template</DialogTitle>
                  <DialogDescription className="text-zinc-500 font-medium">
                    Define a new layout identifier for your ID card designs.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <Input
                    placeholder="e.g. Science Dept 2026"
                    className="bg-zinc-50 border-zinc-200 h-12 rounded-xl text-zinc-900 font-bold placeholder:text-zinc-400"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                  />

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Logo</label>
                      <button
                        onClick={() => document.getElementById('new-template-logo-input')?.click()}
                        className="w-full h-12 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all overflow-hidden relative group text-zinc-500"
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

            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleCollapse}
              className="h-8 w-8 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 transition-all rounded-lg border border-zinc-200"
            >
              {isCollapsed ? <ChevronRight size={16} strokeWidth={3} /> : <ChevronLeft size={16} strokeWidth={3} />}
            </Button>
          </div>
      </div>

      {/* List */}
      <div className={cn(
        "flex-1 py-6 space-y-1.5 scrollbar-none",
        isCollapsed ? "overflow-visible" : "overflow-y-auto"
      )}>
        {loading && templates.length === 0 ? (
          <div className="px-3 space-y-2">
            <TemplateSkeleton />
            <TemplateSkeleton />
            <TemplateSkeleton />
          </div>
        ) : (
          <ul className="space-y-1">
            {templates.map((template) => {
              const isActive = activeId === template.id;
              const meta = (template as any).front_config?.template_meta || {};
              const logo = template.logo || meta.logo || "";

              return (
                <li key={template.id} className="list-none px-3 mb-1 relative group/template-item">
                  {/* Flyout for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full top-0 z-[100] min-w-[220px] pl-2 invisible opacity-0 translate-x-[-10px] group-hover/template-item:visible group-hover/template-item:opacity-100 group-hover/template-item:translate-x-0 transition-all duration-200">
                      <div className="bg-popover text-popover-foreground border border-border rounded-xl shadow-xl overflow-hidden py-2 px-1 backdrop-blur-md">
                        <div className="px-3 py-1.5 mb-1 border-b border-border/50">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis block">
                            {template.name}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleTemplateClick(template)}
                            className={cn(
                              "flex items-center px-3 py-2 rounded-lg text-[12px] font-bold transition-all w-full text-left",
                              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                          >
                            Select Template
                          </button>
                          <div className="flex items-center gap-1 p-1 mt-1 border-t border-border/50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenameInput(template.name);
                                setRenameBgColor(meta.bg_color || "");
                                setRenameLogo(template.logo || meta.logo || "");
                                setRenameLogoFile(null);
                                setRenamingTemplate(template);
                              }}
                              className="flex-1 flex items-center justify-center h-8 rounded-md text-[10px] font-bold uppercase tracking-tight text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                            >
                              <Edit3 size={12} className="mr-1.5" /> Rename
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDuplicatingTemplate(template); }}
                              className="flex-1 flex items-center justify-center h-8 rounded-md text-[10px] font-bold uppercase tracking-tight text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                            >
                              <Copy size={12} className="mr-1.5" /> Copy
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeletingTemplate(template); }}
                              className="flex-1 flex items-center justify-center h-8 rounded-md text-[10px] font-bold uppercase tracking-tight text-red-500 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 size={12} className="mr-1.5" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    onClick={() => handleTemplateClick(template)}
                    className={cn(
                      "group flex items-center rounded-3xl border-2 transition-all duration-300 w-full cursor-pointer overflow-hidden relative",
                      isCollapsed ? "p-2 justify-center" : "p-4",
                      isActive
                        ? "border-primary bg-white shadow-lg ring-2 ring-primary/20 scale-[1.02]"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 shadow-sm",
                      "text-zinc-600 hover:text-zinc-900"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 shrink-0 p-1.5 rounded-2xl transition-all duration-300 flex items-center justify-center overflow-hidden relative z-10",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-primary"
                    )}>
                      {logo ? (
                        <img src={logo} className="w-full h-full object-contain scale-125" alt="" />
                      ) : (
                        <Layers size={28} strokeWidth={2.5} />
                      )}
                    </div>

                    {!isCollapsed && (
                      <div className={cn(
                        "flex-1 flex items-center justify-between ml-4 transition-all duration-300 origin-left shrink-0 relative z-10",
                        "opacity-100 scale-100"
                      )}>
                        <div className="flex flex-col min-w-0">
                          <span
                            className={cn(
                              "whitespace-nowrap truncate font-black uppercase tracking-tight leading-none",
                              isActive ? "text-primary" : "text-zinc-900"
                            )}
                            style={{ fontSize: `${13 * settings.componentScale}px` }}
                          >
                            {template.name}
                          </span>
                          <span className="text-[9px] font-mono uppercase mt-1 text-zinc-400">ID: {template.id}</span>
                        </div>

                        <div className="flex items-center ml-2 relative z-20">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 w-8 rounded-xl hover:bg-black/5 text-muted-foreground hover:text-foreground transition-all"
                              >
                                <MoreVertical size={16} strokeWidth={2.5} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 border-zinc-200 bg-white shadow-xl">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameInput(template.name);
                                  setRenameBgColor(meta.bg_color || "");
                                  setRenameLogo(template.logo || meta.logo || "");
                                  setRenameLogoFile(null);
                                  setRenamingTemplate(template);
                                }}
                                className="rounded-lg font-bold text-xs gap-2 cursor-pointer text-zinc-900 focus:bg-zinc-100"
                              >
                                <Edit3 size={14} className="text-blue-500" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); setDuplicatingTemplate(template); }}
                                className="rounded-lg font-bold text-xs gap-2 cursor-pointer text-zinc-900 focus:bg-zinc-100"
                              >
                                <Copy size={14} className="text-primary" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); setDeletingTemplate(template); }}
                                className="rounded-lg font-bold text-xs gap-2 cursor-pointer text-rose-500 focus:text-rose-600 focus:bg-rose-500/10"
                              >
                                <Trash2 size={14} /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && templates.length === 0 && (
          <div className="py-20 text-center opacity-10">
            <Layout size={32} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No Library Nodes</p>
          </div>
        )}
      </div>

      {/* Action Modals */}
      <Dialog open={!!switchingTemplate} onOpenChange={(open) => !open && setSwitchingTemplate(null)}>
              <DialogContent className="bg-white border-zinc-200 rounded-[2rem] p-8 max-w-sm shadow-2xl shadow-black/10">
          <DialogHeader className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertCircle size={24} />
            </div>
            <DialogTitle className="text-2xl font-black text-zinc-900 italic uppercase">Switch Template</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium">
              Are you sure you want to open <span className="text-zinc-900 font-bold">"{switchingTemplate?.name}"</span>? Unsaved changes in your current session might be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setSwitchingTemplate(null)}
              className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
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

      <Dialog open={!!renamingTemplate} onOpenChange={(open) => !open && setRenamingTemplate(null)}>
              <DialogContent className="bg-white border-zinc-200 rounded-[2rem] p-8 max-w-sm shadow-2xl shadow-black/10">
          <DialogHeader className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Edit3 size={24} />
            </div>
            <DialogTitle className="text-2xl font-black text-zinc-900 italic uppercase">Rename Template</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium">
              Update the name identifier for this layout.
            </DialogDescription>
          </DialogHeader>
            <div className="py-4 space-y-4">
              <Input
                placeholder="Template name"
                className="bg-zinc-50 border-zinc-200 h-12 rounded-xl text-zinc-900 font-bold"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
              />

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Logo</label>
                  <button
                    onClick={() => {
                      if (renameLogoInputRef.current) {
                        renameLogoInputRef.current.value = '';
                        renameLogoInputRef.current.click();
                      }
                    }}
                    className="w-full h-12 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all overflow-hidden relative group text-zinc-500"
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
                    ref={renameLogoInputRef}
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
              className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameConfirm}
              disabled={!!actionLoading}
              className="h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px]"
            >
              {actionLoading === "rename-" + renamingTemplate?.id ? <Loader2 className="animate-spin" /> : "Save Name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!duplicatingTemplate} onOpenChange={(open) => !open && setDuplicatingTemplate(null)}>
              <DialogContent className="bg-white border-zinc-200 rounded-[2rem] p-8 max-w-sm shadow-2xl shadow-black/10">
          <DialogHeader className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Copy size={24} />
            </div>
            <DialogTitle className="text-2xl font-black text-zinc-900 italic uppercase">Duplicate Template</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium leading-relaxed">
              Are you sure you want to create a copy of <span className="text-indigo-600 font-black">"{duplicatingTemplate?.name || 'this template'}"</span>? It will appear in your library immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setDuplicatingTemplate(null)}
              className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDuplicateConfirm}
              disabled={!!actionLoading}
              className="h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px]"
            >
              {actionLoading === "duplicate-" + duplicatingTemplate?.id ? <Loader2 className="animate-spin" /> : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <DialogContent className="bg-white border-zinc-200 rounded-[2rem] p-8 max-w-sm shadow-2xl shadow-black/10">
          <DialogHeader className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertCircle size={24} />
            </div>
            <DialogTitle className="text-2xl font-black text-red-500 italic uppercase">Delete Template</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium">
              Are you sure you want to permanently delete <span className="text-zinc-900 font-bold">"{deletingTemplate?.name}"</span>? This action cannot be undone.
              {deletingTemplate?.is_active && <div className="mt-2 text-red-500/80 font-bold">Warning: This is the active template.</div>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setDeletingTemplate(null)}
              className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={!!actionLoading}
              className="h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px]"
            >
              {actionLoading === "delete-" + deletingTemplate?.id ? <Loader2 className="animate-spin" /> : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;