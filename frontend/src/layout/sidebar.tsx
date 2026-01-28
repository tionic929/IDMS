import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  CardSimIcon,
  BookIcon,
  ArrowUpWideNarrow,
  ArrowBigDown,
} from "lucide-react";
import { FaArrowRightFromBracket } from "react-icons/fa6";

interface NavItem {
  to?: string;
  label: string;
  icon: React.ElementType;
  children?: { label: string; to: string }[];
}

const navItems: NavItem[] = [
  { to: "/card-management", label: "Card Management", icon: CardSimIcon },
  { to: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { to: "/departments", label: "Departments", icon: BriefcaseIcon },
  { to: "/applicants", label: "Applicants", icon: UserIcon },
  {
    label: "Reports",
    icon: BookIcon,
    children: [
      { label: "Import", to: "/reports/import" },
      { label: "Export", to: "/reports/export" },
    ],
  },
  {
    label: "History",
    icon: ClockIcon,
    children: [
      { label: "Logs", to: "/history/logs" },
      { label: "Activity", to: "/history/activity" },
      { label: "Attendance", to: "/history/attendance" },
    ],
  },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const NavItemComponent: React.FC<{ item: NavItem; isCollapsed: boolean }> = ({ item, isCollapsed }) => {
  const location = useLocation();
  const isChildActive = item.children?.some((child) => location.pathname === child.to);
  const [isOpen, setIsOpen] = useState(isChildActive || false);

  const historyChildIcons: { [key: string]: React.ElementType } = {
    Logs: ListIcon,
    Activity: ActivityIcon,
    Attendance: CheckSquareIcon,
    Import: ArrowBigDown,
    Export: ArrowUpWideNarrow,
  };

  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li className="list-none px-2">
      {item.to && !hasChildren ? (
        <NavLink
          to={item.to}
          className={({ isActive }) => `
            w-full flex items-center h-10 px-3 rounded-md text-sm font-medium transition-all duration-200 ease-in-out group relative overflow-hidden
            ${isActive ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-400 hover:bg-slate-100/10 hover:text-slate-100"}
          `}
        >
          <Icon className="w-4 h-4 min-w-[16px] shrink-0" />
          <span className={`ml-3 transition-all duration-200 ease-in-out whitespace-nowrap absolute left-10
            ${isCollapsed ? "opacity-0 -translate-x-4 pointer-events-none" : "opacity-100 translate-x-0"}`}>
            {item.label}
          </span>
        </NavLink>
      ) : (
        <button
          onClick={() => !isCollapsed && setIsOpen(!isOpen)}
          className={`w-full flex items-center h-10 px-3 rounded-md text-sm font-medium transition-all duration-200 ease-in-out group relative overflow-hidden
            ${isOpen && !isCollapsed ? "text-slate-100 bg-slate-900/40" : "text-slate-400 hover:bg-slate-100/10 hover:text-slate-100"}
          `}
        >
          <div className="flex items-center">
            <Icon className="w-4 h-4 min-w-[16px] shrink-0" />
            <span className={`ml-3 transition-all duration-200 ease-in-out whitespace-nowrap absolute left-10
              ${isCollapsed ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0"}`}>
              {item.label}
            </span>
          </div>
          {!isCollapsed && hasChildren && (
            <ChevronDownIcon className={`w-4 h-4 ml-auto transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          )}
        </button>
      )}

      {hasChildren && !isCollapsed && (
        <div className={`overflow-hidden transition-all duration-200 ease-in-out
          ${isOpen ? "max-h-60 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
          <div className="ml-4 pl-3 border-l border-slate-800 space-y-1">
            {item.children!.map((child, cIndex) => {
              const ChildIcon = historyChildIcons[child.label] || ListIcon;
              const isActive = location.pathname === child.to;
              return (
                <NavLink
                  key={cIndex}
                  to={child.to}
                  className={`
                    flex items-center h-8 px-3 text-sm font-medium transition-colors rounded-md whitespace-nowrap
                    ${isActive ? "text-teal-400 bg-slate-900" : "text-slate-500 hover:text-slate-100 hover:bg-slate-800/50"}
                  `}
                >
                  <ChildIcon className="w-3.5 h-3.5 mr-2 shrink-0" />
                  {child.label}
                </NavLink>
              );
            })}
          </div>
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
        className={`fixed top-0 left-0 h-screen bg-slate-950 text-slate-200 flex flex-col border-r border-slate-800 z-40
        transition-all duration-200 ease-in-out overflow-hidden
        ${isCollapsed ? "w-[60px]" : "w-[240px]"}`}
      >
        <div className="h-24 flex justify-center items-center px-3 shrink-0 overflow-hidden border-b border-slate-900/50">
          <div className="flex items-center gap-3 relative w-full">
            <div className="p-1.5 bg-white rounded-md shrink-0">
              <CreditCard className="w-6 h-6 text-slate-950" />
            </div>
            <span className={`font-semibold transition-all duration-200 whitespace-nowrap absolute left-10 text-lg
              ${isCollapsed ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0"}`}>
              NC ID Tech
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div>
            <ul className="space-y-1">
              {navItems.map((item, index) => (
                <NavItemComponent key={index} item={item} isCollapsed={isCollapsed} />
              ))}
            </ul>
          </div>
        </nav>

        <div className="p-2 border-t border-slate-800 shrink-0 bg-slate-950">
          <button
            onClick={() => logout()}
            className="group flex items-center h-10 w-full px-3 rounded-md hover:bg-red-500/10 transition-all duration-200 relative overflow-hidden"
          >
            <FaArrowRightFromBracket className="w-4 h-4 text-slate-400 group-hover:text-red-500 shrink-0" />
            <span className={`ml-3 text-sm font-medium text-slate-400 group-hover:text-red-500 transition-all duration-200 whitespace-nowrap absolute left-10
              ${isCollapsed ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0"}`}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Spacer to push main content right */}
      <div className={`transition-all duration-200 ease-in-out shrink-0 ${isCollapsed ? "w-[60px]" : "w-[240px]"}`} />
    </div>
  );
};

export default SideBar;