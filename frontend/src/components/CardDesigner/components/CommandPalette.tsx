
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, MousePointer2, Move, Square, Circle as CircleIcon,
    Type, Image as ImageIcon, Save, Download, Grid3X3, Magnet,
    Maximize, Minimize, Eye, EyeOff, RotateCcw, RotateCw,
    ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown, Trash2,
    Command, ChevronRight, Zap, Layers
} from 'lucide-react';

export interface PaletteCommand {
    id: string;
    label: string;
    description?: string;
    icon: React.ElementType;
    category: 'Elements' | 'View' | 'Edit' | 'Arrange';
    shortcut?: string;
    action: () => void;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    commands: PaletteCommand[];
}

function fuzzyMatch(query: string, text: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t.includes(q)) return true;
    let qi = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) qi++;
    }
    return qi === q.length;
}

const CategoryBadge: Record<PaletteCommand['category'], string> = {
    Elements: 'bg-violet-100 text-violet-600 border-violet-200',
    View: 'bg-sky-100 text-sky-600 border-sky-200',
    Edit: 'bg-amber-100 text-amber-600 border-amber-200',
    Arrange: 'bg-emerald-100 text-emerald-600 border-emerald-200',
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const filtered = commands.filter(c =>
        fuzzyMatch(query, c.label) || fuzzyMatch(query, c.description || '') || fuzzyMatch(query, c.category)
    );

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    const execute = useCallback((cmd: PaletteCommand) => {
        cmd.action();
        onClose();
    }, [onClose]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(i => Math.max(i - 1, 0));
            }
            if (e.key === 'Enter' && filtered[activeIndex]) {
                execute(filtered[activeIndex]);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, filtered, activeIndex, execute, onClose]);

    // Scroll active item into view
    useEffect(() => {
        const el = listRef.current?.children[activeIndex] as HTMLElement;
        el?.scrollIntoView?.({ block: 'nearest' });
    }, [activeIndex]);

    if (!isOpen) return null;

    const grouped = filtered.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {} as Record<string, PaletteCommand[]>);

    const allFiltered = Object.values(grouped).flat();

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-full max-w-xl bg-card rounded-lg shadow-2xl shadow-primary/20 border border-border overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">

                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                    <Search size={16} className="text-muted-foreground shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search commands..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="flex-1 text-sm font-medium text-foreground placeholder-muted-foreground outline-none bg-transparent"
                    />
                    <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground bg-muted border border-border px-2 py-1 rounded-md">
                        <Command size={10} />
                        ESC
                    </div>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-80 overflow-y-auto py-2 scrollbar-hide">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Zap size={24} strokeWidth={1.5} className="mb-3 opacity-40" />
                            <p className="text-xs font-bold uppercase tracking-widest">No commands found</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([category, cmds]) => (
                            <div key={category}>
                                <div className="px-4 py-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{category}</span>
                                </div>
                                {cmds.map((cmd) => {
                                    const globalIdx = allFiltered.indexOf(cmd);
                                    const isActive = globalIdx === activeIndex;
                                    return (
                                        <button
                                            key={cmd.id}
                                            onClick={() => execute(cmd)}
                                            onMouseEnter={() => setActiveIndex(globalIdx)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'
                                                }`}
                                        >
                                            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                                                <cmd.icon size={14} className={isActive ? 'text-primary-foreground' : 'text-muted-foreground'} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-bold truncate ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>{cmd.label}</p>
                                                {cmd.description && (
                                                    <p className={`text-[10px] truncate hidden sm:block ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{cmd.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end max-w-[40%] sm:max-w-max">
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border hidden sm:block ${CategoryBadge[cmd.category as PaletteCommand['category']]}`}>
                                                    {category}
                                                </span>
                                                {cmd.shortcut && (
                                                    <span className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded border ${isActive ? 'bg-primary-foreground/20 border-primary-foreground/20 text-primary-foreground' : 'bg-muted border-border text-muted-foreground'}`}>
                                                        {cmd.shortcut}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-border bg-muted/50 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                        <span className="flex items-center gap-1"><kbd className="bg-card border border-border rounded px-1">↑↓</kbd> Navigate</span>
                        <span className="flex items-center gap-1"><kbd className="bg-card border border-border rounded px-1">↵</kbd> Execute</span>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">{filtered.length} command{filtered.length !== 1 ? 's' : ''}</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
