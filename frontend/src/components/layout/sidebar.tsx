import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Home as HomeIcon,
  User as UserIcon,
  Clock as ClockIcon,
  Settings as SettingsIcon,
  Briefcase as BriefcaseIcon,
  ChevronDown as ChevronDownIcon,
  List as ListIcon,
  Activity as ActivityIcon,
  CheckSquare as CheckSquareIcon,
  CreditCard,
  Fingerprint,
  LayoutDashboard,
  Wallet,
  FileText,
  PieChart,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Command
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import nclogo from '@/assets/nc_logo.png';

// shadcn UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NavItem {
  to?: string;
  label: string;
  icon: React.ElementType;
  children?: { label: string; to: string }[];
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Cards",
    icon: Wallet,
    children: [
      { label: "Records", to: "/card-management" },
      { label: "Designer", to: "/card-designer" },
    ],
  },
  {
    label: "Students",
    icon: FileText,
    children: [
      { label: "Registry", to: "/applicants" },
      { label: "Departments", to: "/departments" },
      { label: "Import", to: "/reports/import" },
    ],
  },
  {
    label: "System",
    icon: SettingsIcon,
    children: [
      { label: "Logs", to: "/history/logs" },
      { label: "Settings", to: "/settings" },
    ],
  },
];

const NavItemComponent: React.FC<{ item: NavItem; isCollapsed: boolean }> = ({ item, isCollapsed }) => {
  const location = useLocation();
  const isChildActive = item.children?.some((child) => location.pathname === child.to);
  const [isOpen, setIsOpen] = useState<boolean>(!!isChildActive);

  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.to ? location.pathname === item.to : isChildActive;

  return (
    <li className="list-none px-4 mb-1">
      {item.to && !hasChildren ? (
        <NavLink
          to={item.to}
          className={({ isActive }) => cn(
            "group flex items-center gap-3 h-11 px-4 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300",
            isActive
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
              : "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]"
          )}
        >
          <Icon className={cn("w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} strokeWidth={2.5} />
          {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
          {isActive && !isCollapsed && (
            <motion.div layoutId="active-nav-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/80" />
          )}
        </NavLink>
      ) : (
        <div className="flex flex-col">
          <button
            onClick={() => !isCollapsed && setIsOpen(!isOpen)}
            className={cn(
              "group flex items-center gap-3 h-11 px-4 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300 w-full",
              isOpen && !isCollapsed
                ? "text-foreground bg-muted/60"
                : "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]"
            )}
          >
            <Icon className={cn("w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110", isOpen && !isCollapsed ? "text-primary" : "text-muted-foreground group-hover:text-primary")} strokeWidth={2.5} />
            {!isCollapsed && (
              <>
                <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>
                <ChevronRight className={cn("w-3.5 h-3.5 ml-auto transition-transform duration-300 opacity-40 group-hover:opacity-100", isOpen ? "rotate-90 text-primary" : "")} />
              </>
            )}
          </button>

          <AnimatePresence>
            {hasChildren && !isCollapsed && isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0, x: -10 }}
                animate={{ height: "auto", opacity: 1, x: 0 }}
                exit={{ height: 0, opacity: 0, x: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="ml-5 pl-4 border-l-2 border-primary/10 mt-2 space-y-1.5 py-1">
                  {item.children!.map((child, cIndex) => {
                    const isChildActive = location.pathname === child.to;
                    return (
                      <NavLink
                        key={cIndex}
                        to={child.to}
                        className={cn(
                          "flex items-center h-9 px-4 text-[12px] font-bold rounded-xl transition-all duration-200",
                          isChildActive
                            ? "text-primary bg-primary/5 scale-[1.02]"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {child.label}
                        {isChildActive && (
                          <div className="ml-auto w-1 h-1 rounded-full bg-primary animate-pulse" />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </li>
  );
};

const SideBar: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const { logout } = useAuth();

  return (
    <div className="flex shrink-0">
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-card text-card-foreground flex flex-col border-r border-border/40 z-40 transition-all duration-500 ease-[0.22,1,0.36,1]",
          isCollapsed ? "w-[80px]" : "w-[280px]"
        )}
      >
        <div className="h-20 flex items-center px-6 shrink-0 border-b border-border/40 bg-card">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 bg-primary/10 shadow-inner border border-primary/20 overflow-hidden group hover:scale-105 transition-transform duration-500">
              <img src={nclogo} alt="NC Logo" className="w-8 h-8 object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="font-black text-lg tracking-tighter text-foreground uppercase italic leading-none">
                  NC<span className="text-primary">nian</span>
                </span>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-1 flex items-center gap-1.5 leading-none">
                  <ShieldCheck className="w-2.5 h-2.5 text-primary/60" /> System Core
                </span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-10 overflow-y-auto scrollbar-none scroll-smooth">
          <ul className="space-y-6">
            <li className="px-8 flex items-center justify-between">
              <span className={cn(
                "text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]",
                isCollapsed ? "hidden" : "block"
              )}>
                Navigation
              </span>
              {!isCollapsed && <Command size={10} className="text-muted-foreground/20" />}
            </li>
            <div className="space-y-1">
              {navItems.map((item, index) => (
                <NavItemComponent key={index} item={item} isCollapsed={isCollapsed} />
              ))}
            </div>
          </ul>

          {!isCollapsed && (
            <div className="mx-6 mt-12 px-6 py-6 rounded-[2rem] bg-zinc-900 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <Zap size={80} className="fill-current text-primary" />
              </div>
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-widest">Terminal Active</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                  Secure node communication established.
                </p>
                <Button size="sm" variant="ghost" className="h-8 w-full rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 border-none transition-all">
                  View Statistics
                </Button>
              </div>
            </div>
          )}
        </nav>

        <div className="p-6 mt-auto">
          <Button
            variant="ghost"
            onClick={() => logout()}
            className={cn(
              "flex items-center justify-center gap-3 w-full h-14 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 group overflow-hidden",
              isCollapsed ? "px-0" : "px-6 border border-border/40 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive/50"
            )}
          >
            <LogOut className={cn("w-4.5 h-4.5 group-hover:translate-x-1 transition-transform", isCollapsed ? "" : "")} />
            {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Authorize Sign Out</span>}
          </Button>
        </div>
      </aside>

      <div className={cn("transition-all duration-500 ease-[0.22,1,0.36,1] shrink-0", isCollapsed ? "w-[80px]" : "w-[280px]")} />
    </div>
  );
};

export default SideBar;
