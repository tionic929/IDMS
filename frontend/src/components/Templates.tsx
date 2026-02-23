import React, { useEffect, useState } from 'react';
import { Layout, Plus, CheckCircle2, Loader2, Layers, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TemplatesProps } from '../types/templates';
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
  const { templates, loading, setActiveTemplate, createTemplate, refreshTemplates } = useTemplates();
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    refreshTemplates();
  }, [refreshTrigger, refreshTemplates]);

  const handleCreateNew = async () => {
    if (!newTemplateName.trim()) return;
    setIsCreating(true);
    try {
      await createTemplate(newTemplateName);
      setNewTemplateName("");
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled in context
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetActive = async (id: number) => {
    await setActiveTemplate(id);
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
              <div className="py-4">
                <Input
                  placeholder="e.g. Science Dept 2026"
                  className="bg-zinc-950/50 border-border/40 h-12 rounded-xl text-white font-bold"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
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
          return (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className={cn(
                "group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden",
                isActive
                  ? 'bg-primary/5 border-primary/40 shadow-sm shadow-primary/5'
                  : 'border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              )}
            >
              {isActive && (
                <motion.div layoutId="active-template-glow" className="absolute -left-10 -top-10 w-24 h-24 bg-primary/20 blur-[40px] pointer-events-none" />
              )}

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "p-2 rounded-xl transition-colors",
                    isActive ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-zinc-600 group-hover:text-primary/60"
                  )}>
                    <Layers size={14} strokeWidth={2.5} />
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleSetActive(template.id); }}
                    className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center transition-all",
                      template.is_active
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'text-zinc-700 hover:text-emerald-500 hover:bg-emerald-500/10'
                    )}
                    title={template.is_active ? "Current Active Layout" : "Publish Layout"}
                  >
                    {template.is_active ? <Check size={14} strokeWidth={4} /> : <CheckCircle2 size={14} strokeWidth={2.5} />}
                  </button>
                </div>

                <div className="space-y-1">
                  <h4 className={cn(
                    "text-[11px] font-black uppercase tracking-tight truncate",
                    isActive ? 'text-primary' : 'text-slate-700 dark:text-zinc-200'
                  )}>
                    {template.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[8px] h-4 px-1 py-0 font-bold border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-zinc-500 tracking-widest uppercase">
                      UID: {template.id}
                    </Badge>
                    {template.is_active && (
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[7px] text-emerald-500 font-black uppercase tracking-widest">Live</span>
                      </div>
                    )}
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
    </div>
  );
};

export default Templates;