import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Wallet,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  Fingerprint,
  Users,
  Building2,
  FileDown,
  FileUp,
  History,
  Settings2,
  List,
  Activity,
  CheckSquare,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import nclogo from '@/assets/nc_logo.png';

// shadcn UI
import { Button } from "@/components/ui/button";
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

  // Reverting to simpler original styles (zinc/teal)
  const iconClass = cn(
    "w-4 h-4 shrink-0 transition-all duration-200",
    isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
  );

  return (
    <li className="list-none px-3 mb-1 relative group/nav-item">
      {/* 
        Hover Bubble / Flyout Menu for Collapsed State 
        Kept but styled with the original zinc theme
      */}
      {isCollapsed && (
        <div 
          className={cn(
            "absolute left-[calc(100%+0px)] top-0 z-[100] min-w-[200px] pl-[8px]",
            "invisible opacity-0 translate-x-[-10px] group-hover/nav-item:visible group-hover/nav-item:opacity-100 group-hover/nav-item:translate-x-0 transition-all duration-200"
          )}
        >
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-xl overflow-hidden py-1.5 px-1">
            <div className="px-3 py-1 mb-1 border-b border-zinc-100 dark:border-zinc-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {item.label}
              </span>
            </div>
            
            {hasChildren ? (
              <div className="flex flex-col gap-0.5">
                {item.children!.map((child, cIndex) => {
                  const childActive = location.pathname === child.to;
                  return (
                    <NavLink
                      key={cIndex}
                      to={child.to}
                      className={cn(
                        "flex items-center px-3 py-1.5 rounded-md text-[12px] font-medium transition-all",
                        childActive
                          ? "bg-zinc-100 dark:bg-zinc-800 text-teal-600 dark:text-teal-400"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                      )}
                    >
                      {child.label}
                    </NavLink>
                  );
                })}
              </div>
            ) : (
              item.to && (
                <NavLink
                  to={item.to}
                  className={cn(
                    "flex items-center px-3 py-1.5 rounded-md text-[12px] font-medium transition-all",
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 text-teal-600 dark:text-teal-400"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                  )}
                >
                  {item.label}
                </NavLink>
              )
            )}
          </div>
        </div>
      )}

      {/* Main Sidebar Item Button/Link */}
      {item.to && !hasChildren ? (
        <NavLink
          to={item.to}
          className={cn(
            "group flex items-center h-9 rounded-md text-[13px] font-medium transition-all duration-200 relative",
            isCollapsed ? "justify-center w-full px-0" : "px-3 w-full",
            isActive
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 border border-zinc-200/50 dark:border-zinc-700/50"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          )}
        >
          <Icon className={iconClass} strokeWidth={2} />
          {!isCollapsed && <span className="ml-3 whitespace-nowrap">{item.label}</span>}
          {isActive && isCollapsed && (
            <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-md bg-teal-500" />
          )}
        </NavLink>
      ) : (
        <div className="flex flex-col">
          {isCollapsed && hasChildren ? (
            <NavLink
              to={item.children![0].to}
              className={cn(
                "group flex items-center justify-center h-9 rounded-md text-[13px] font-medium transition-all duration-200 relative px-0 w-full",
                isChildActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <Icon className={iconClass} strokeWidth={2} />
              {isChildActive && (
                <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-md bg-teal-500" />
              )}
            </NavLink>
          ) : (
            <button
              onClick={() => !isCollapsed && setIsOpen(!isOpen)}
              className={cn(
                "group flex items-center h-9 rounded-md text-[13px] font-medium transition-all duration-200 relative",
                isCollapsed ? "justify-center w-full px-0" : "px-3 w-full",
                isOpen && !isCollapsed
                  ? "text-zinc-900 dark:text-zinc-100 bg-zinc-100/50 dark:bg-zinc-900/40"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <Icon className={iconClass} strokeWidth={2} />
              {!isCollapsed && (
                <>
                  <span className="ml-3 whitespace-nowrap">{item.label}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 ml-auto transition-transform duration-300", isOpen ? "rotate-180" : "opacity-40")} />
                </>
              )}
              {isChildActive && isCollapsed && (
                <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-md bg-teal-500" />
              )}
            </button>
          )}

          {/* Expanded Accordion */}
          {!isCollapsed && isOpen && hasChildren && (
            <div className="ml-5 pl-4 border-l border-zinc-200 dark:border-zinc-800 mt-1 mb-2 space-y-1">
              {item.children!.map((child, cIndex) => {
                const childActive = location.pathname === child.to;
                return (
                  <NavLink
                    key={cIndex}
                    to={child.to}
                    className={cn(
                      "flex items-center h-8 px-3 text-[12px] font-medium rounded-md transition-colors",
                      childActive
                        ? "text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-500/10"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    )}
                  >
                    {child.label}
                  </NavLink>
                );
              })}
            </div>
          )}
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
          "fixed top-0 left-0 h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 flex flex-col border-r border-zinc-200 dark:border-zinc-900 z-50 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[64px] overflow-visible" : "w-[260px] overflow-hidden"
        )}
      >
        <div className="h-20 flex items-center px-4 shrink-0 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-3 relative w-full overflow-hidden px-2">
            <div className="p-2 bg-zinc-950 dark:bg-white rounded-lg shrink-0 shadow-lg shadow-zinc-500/10">
              <Fingerprint className="w-5 h-5 text-white dark:text-zinc-950" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-bold text-sm tracking-tight">NC ID Tech</span>
                <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest leading-tight">Management</span>
              </div>
            )}
          </div>
        </div>

        <nav className={cn(
          "flex-1 py-6 space-y-6 scrollbar-none scroll-smooth",
          isCollapsed ? "overflow-visible" : "overflow-y-auto"
        )}>
          <ul className="space-y-1">
            {navItems.map((item, index) => (
              <NavItemComponent key={index} item={item} isCollapsed={isCollapsed} />
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-zinc-100 dark:border-zinc-900 shrink-0 bg-white dark:bg-zinc-950">
          <Button
            variant="ghost"
            onClick={() => logout()}
            className={cn(
              "flex items-center gap-3 h-10 w-full px-3 rounded-md transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-500 hover:text-red-500 justify-start",
              isCollapsed ? "justify-center p-0" : ""
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="text-[13px] font-bold uppercase tracking-tight">Sign Out</span>}
          </Button>
        </div>
      </aside>

      <div className={cn("transition-all duration-300 ease-in-out shrink-0", isCollapsed ? "w-[64px]" : "w-[260px]")} />
    </div>
  );
};

export default SideBar;
