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
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import nclogo from '../../assets/nc_logo.png';

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
    <li className="list-none px-3 mb-1">
      {item.to && !hasChildren ? (
        <NavLink
          to={item.to}
          className={({ isActive }) => `
            group flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200
            ${isActive
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}
          `}
        >
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"}`} strokeWidth={2} />
          {!isCollapsed && <span className="animate-fade-in">{item.label}</span>}
        </NavLink>
      ) : (
        <div className="flex flex-col">
          <button
            onClick={() => !isCollapsed && setIsOpen(!isOpen)}
            className={`
              group flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200 w-full
              ${isOpen && !isCollapsed
                ? "text-foreground bg-accent/50"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}
            `}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isOpen && !isCollapsed ? "text-foreground" : "text-muted-foreground group-hover:text-accent-foreground"}`} strokeWidth={2} />
            {!isCollapsed && (
              <>
                <span className="animate-fade-in">{item.label}</span>
                <ChevronRight className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
              </>
            )}
          </button>

          <AnimatePresence>
            {hasChildren && !isCollapsed && isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="ml-4 pl-5 border-l border-border mt-1 space-y-1 py-1">
                  {item.children!.map((child, cIndex) => {
                    const isChildActive = location.pathname === child.to;
                    return (
                      <NavLink
                        key={cIndex}
                        to={child.to}
                        className={`
                          flex items-center h-8 px-3 text-xs font-medium rounded-md transition-colors
                          ${isChildActive
                            ? "text-primary bg-primary/5"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}
                        `}
                      >
                        {child.label}
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
        className={`fixed top-0 left-0 h-screen bg-card text-card-foreground flex flex-col border-r border-border z-40
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-[64px]" : "w-[264px]"}`}
      >
        <div className="h-16 flex items-center px-5 shrink-0 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 bg-white shadow-sm border border-border overflow-hidden">
              <img src={nclogo} alt="NC Logo" className="w-7 h-7 object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-fade-in truncate">
                <span className="font-bold text-sm tracking-tighter text-foreground">NC ID <span className="text-primary truncate">TECH</span></span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] -mt-0.5">System</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-6 overflow-y-auto scrollbar-none">
          <ul className="space-y-1">
            <li className="px-6 mb-2">
              <span className={`text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest ${isCollapsed ? "hidden" : "block"}`}>
                Menu
              </span>
            </li>
            {navItems.map((item, index) => (
              <NavItemComponent key={index} item={item} isCollapsed={isCollapsed} />
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <button
            onClick={() => logout()}
            className={`
              flex items-center justify-center gap-3 w-full h-10 px-3 rounded-lg text-sm font-medium transition-all
              bg-secondary hover:bg-destructive hover:text-destructive-foreground text-secondary-foreground
              ${isCollapsed ? "px-0" : ""}
            `}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span className="animate-fade-in">Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className={`transition-all duration-300 ease-in-out shrink-0 ${isCollapsed ? "w-[64px]" : "w-[264px]"}`} />
    </div>
  );
};

export default SideBar;
