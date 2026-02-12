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
  DatabaseIcon,
  Edit2Icon,
  Fingerprint
} from "lucide-react";
import { FaArrowRightFromBracket } from "react-icons/fa6";

interface NavItem {
  to?: string;
  label: string;
  icon: React.ElementType;
  children?: { label: string; to: string }[];
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: HomeIcon },
  {
    label: "Card Management",
    icon: CardSimIcon,
    children: [
      { label: "Records", to: "/card-management"},
      { label: "Designer", to: "/card-designer" },
    ],
  },
  {
    label: "Reports",
    icon: BookIcon,
    children: [
      { label: "Applicants", to: "/applicants" },
      { label: "Departments", to: "/departments" },
      { label: "Import", to: "/reports/import" },
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
  const [isOpen, setIsOpen] = useState(isChildActive || true);

  const historyChildIcons: { [key: string]: React.ElementType } = {
    Logs: ListIcon,
    Activity: ActivityIcon,
    Attendance: CheckSquareIcon,
    Import: ArrowBigDown,
    Export: ArrowUpWideNarrow,
    Departments: BriefcaseIcon,
    Applicants: UserIcon,
    Records: DatabaseIcon,
    Designer: Edit2Icon,
  };

  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li className="list-none px-3">
      {item.to && !hasChildren ? (
        <NavLink
          to={item.to}
          className={({ isActive }) => `
            w-full flex items-center h-9 px-3 rounded-md text-[13px] font-medium transition-all duration-200 ease-in-out group relative overflow-hidden
            ${isActive 
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700" 
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"}
          `}
        >
          {/* Note: I removed the logic that used isActive outside of the className function to avoid the ReferenceError */}
          <Icon className="w-4 h-4 min-w-[16px] shrink-0" strokeWidth={2} />
          <span className={`ml-3 transition-all duration-200 ease-in-out whitespace-nowrap absolute left-10
            ${isCollapsed ? "opacity-0 -translate-x-4 pointer-events-none" : "opacity-100 translate-x-0"}`}>
            {item.label}
          </span>
        </NavLink>
      ) : (
        <button
          onClick={() => !isCollapsed && setIsOpen(!isOpen)}
          className={`w-full flex items-center h-9 px-3 rounded-md text-[13px] font-medium transition-all duration-200 ease-in-out group relative overflow-hidden
            ${isOpen && !isCollapsed 
              ? "text-zinc-900 dark:text-zinc-100 bg-zinc-100/50 dark:bg-zinc-900/40" 
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"}
          `}
        >
          <div className="flex items-center">
            <Icon className="w-4 h-4 min-w-[16px] shrink-0" strokeWidth={2} />
            <span className={`ml-3 transition-all duration-200 ease-in-out whitespace-nowrap absolute left-10
              ${isCollapsed ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0"}`}>
              {item.label}
            </span>
          </div>
          {!isCollapsed && hasChildren && (
            <ChevronDownIcon className={`w-3.5 h-3.5 ml-auto transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
          )}
        </button>
      )}

      {hasChildren && !isCollapsed && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out
          ${isOpen ? "max-h-60 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
          <div className="ml-5 pl-4 border-l border-zinc-200 dark:border-zinc-800 space-y-1 my-1">
            {item.children!.map((child, cIndex) => {
              const ChildIcon = historyChildIcons[child.label] || ListIcon;
              const isThisChildActive = location.pathname === child.to;
              return (
                <NavLink
                  key={cIndex}
                  to={child.to}
                  className={`
                    flex items-center h-8 px-3 text-[12px] font-medium transition-colors rounded-md whitespace-nowrap
                    ${isThisChildActive 
                      ? "text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-500/10" 
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"}
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
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 flex flex-col border-r border-zinc-200 dark:border-zinc-900 z-40
        transition-all duration-300 ease-in-out overflow-hidden
        ${isCollapsed ? "w-[64px]" : "w-[260px]"}`}
      >
        <div className="h-20 flex justify-center items-center px-4 shrink-0 overflow-hidden border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-3 relative w-full">
            <div className="p-2 bg-zinc-950 dark:bg-white rounded-lg shrink-0 shadow-lg shadow-zinc-500/10">
              <Fingerprint className="w-5 h-5 text-white dark:text-zinc-950" />
            </div>
            <div className={`flex flex-col transition-all duration-300 whitespace-nowrap absolute left-12
              ${isCollapsed ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0"}`}>
              <span className="font-bold text-sm tracking-tight">NC ID Tech</span>
              <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Management</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div>
            <ul className="space-y-1.5">
              {navItems.map((item, index) => (
                <NavItemComponent key={index} item={item} isCollapsed={isCollapsed} />
              ))}
            </ul>
          </div>
        </nav>

        <div className="p-3 border-t border-zinc-100 dark:border-zinc-900 shrink-0 bg-white dark:bg-zinc-950">
          <button
            onClick={() => logout()}
            className="group flex items-center h-10 w-full px-3 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 relative overflow-hidden"
          >
            <FaArrowRightFromBracket className="w-4 h-4 text-zinc-400 group-hover:text-red-500 shrink-0" />
            <span className={`ml-3 text-[13px] font-bold text-zinc-500 group-hover:text-red-500 transition-all duration-200 whitespace-nowrap absolute left-10 uppercase tracking-tight
              ${isCollapsed ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0"}`}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      <div className={`transition-all duration-300 ease-in-out shrink-0 ${isCollapsed ? "w-[64px]" : "w-[260px]"}`} />
    </div>
  );
};

export default SideBar;