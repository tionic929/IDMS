import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, PanelLeft, Bell, Search, Command, User, Settings, LogOut, Sparkles } from 'lucide-react';

// shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
    <header className="h-20 bg-white dark:bg-zinc-950 border-b border-border/40 flex items-center justify-between px-8 shrink-0 z-30 sticky top-0 font-sans">
      <div className="flex items-center gap-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-95 border border-border/40"
        >
          <PanelLeft size={18} className={cn("transition-transform duration-500", !isCollapsed && "rotate-0", isCollapsed && "rotate-180")} />
        </Button>

        <nav className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest hidden sm:flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> System Admin
          </Badge>
          <ChevronRight size={14} className="text-muted-foreground/30 mx-1" />
          <div className="flex flex-col">
            <h1 className="text-xs font-black text-foreground uppercase tracking-wider leading-none">
              {context.title}
            </h1>
            {context.subtitle && (
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1.5">
                {context.subtitle}
              </span>
            )}
          </div>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-3 px-4 h-11 rounded-2xl bg-muted/50 border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all cursor-pointer group w-64">
          <Search size={16} className="group-hover:scale-110 transition-transform opacity-40 group-hover:opacity-100" />
          <span className="text-[11px] font-bold tracking-tight flex-1">Global Command Search</span>
          <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100">
            <Badge variant="outline" className="h-5 px-1 font-black text-[9px] min-w-[1.25rem] justify-center">⌘</Badge>
            <Badge variant="outline" className="h-5 px-1 font-black text-[9px] min-w-[1.25rem] justify-center">K</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all relative group">
            <Bell size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-zinc-950"></span>
          </Button>

          <div className="h-6 w-[1px] bg-border/40 mx-2" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer group ml-1">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-[11px] font-black text-primary uppercase shadow-inner group-hover:scale-105 transition-all duration-300">
                  AD
                </div>
                <div className="hidden md:flex flex-col items-start pr-2">
                  <span className="text-[11px] font-black text-foreground leading-none uppercase tracking-wider">Admin User</span>
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Super Admin</span>
                </div>
                <ChevronRight size={12} className="text-muted-foreground/40 rotate-90" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] p-2 border-border/40 shadow-xl">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest px-3 py-2 opacity-40">Account Interface</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-xs font-bold gap-3 group cursor-pointer">
                <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" /> Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-xs font-bold gap-3 group cursor-pointer">
                <Settings className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" /> Preference Config
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-xs font-bold gap-3 group text-destructive hover:bg-destructive/5 cursor-pointer">
                <LogOut className="h-4 w-4" /> Terminate Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
