import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, PanelLeft, Bell, Search, Command } from 'lucide-react';

interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function Header({ isCollapsed, setIsCollapsed }: HeaderProps) {
  const location = useLocation();

  const getPageContext = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    const main = parts[0] || 'Dashboard';
    const sub = parts[1] || '';

    return {
      title: main.charAt(0).toUpperCase() + main.slice(1),
      subtitle: sub.charAt(0).toUpperCase() + sub.slice(1)
    };
  };

  const context = getPageContext();

  return (
    <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 shrink-0 z-30 sticky top-0">
      <div className="flex items-center gap-6">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all active:scale-95 border border-transparent hover:border-border"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <PanelLeft size={18} />
        </button>

        <div className="h-4 w-[1px] bg-border" />

        <nav className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium text-xs">
            <span>Admin</span>
          </div>
          <ChevronRight size={14} className="text-muted-foreground/40" />
          <h1 className="text-xs font-bold text-foreground uppercase tracking-widest mt-[1px]">
            {context.title}
          </h1>
          {context.subtitle && (
            <>
              <ChevronRight size={14} className="text-muted-foreground/40" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-[1px]">
                {context.subtitle}
              </span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all cursor-pointer group">
          <Search size={14} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Quick search...</span>
          <span className="text-[10px] font-bold bg-background px-1.5 py-0.5 rounded border border-border ml-2">⌘K</span>
        </div>

        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all relative group">
          <Bell size={18} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full border border-card"></span>
        </button>

        <div className="h-4 w-[1px] bg-border mx-1" />

        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary uppercase shadow-inner cursor-pointer hover:bg-primary/20 transition-all">
          AD
        </div>
      </div>
    </header>
  );
}
