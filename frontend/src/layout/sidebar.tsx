import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home as HomeIcon,
  Users as UsersIcon,
  BookOpen as BookOpenIcon,
  User as UserIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  Briefcase as BriefcaseIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  List as ListIcon,
  Activity as ActivityIcon,
  CheckSquare as CheckSquareIcon,
  CreditCard,
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
  { to: "/departments", label: "Departments", icon: BriefcaseIcon },
  // { to: "/courses", label: "Courses", icon: BookOpenIcon },
  { to: "/applicants", label: "Applicants", icon: UserIcon },
  {
    label: "Reports",
    icon: ClockIcon,
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

const NavItemComponent: React.FC<{ item: NavItem }> = ({ item }) => {
  const location = useLocation();
  // Keep parent open if a child route is active
  const isChildActive = item.children?.some(child => location.pathname === child.to);
  const [isOpen, setIsOpen] = useState(isChildActive || false);

  const historyChildIcons: { [key: string]: React.ElementType } = {
    Logs: ListIcon,
    Activity: ActivityIcon,
    Attendance: CheckSquareIcon,
  };

  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) setIsOpen(!isOpen);
  };

  // Content shared between Button and NavLink to preserve your original structure
  const NavContent = ({ isActive }: { isActive?: boolean }) => (
    <>
      <div className="flex items-center">
        <Icon className={`w-5 h-5 mr-3 transition-colors ${(isActive || isOpen) ? "text-teal-400" : "group-hover:text-teal-400"}`} />
        <span>{item.label}</span>
      </div>
      {hasChildren && (
        isOpen ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4 opacity-50" />
      )}
    </>
  );

  return (
    <li className="list-none">
      {item.to && !hasChildren ? (
        <NavLink
          to={item.to}
          className={({ isActive }) => `
            w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group
            ${isActive 
              ? "bg-slate-800 text-white" 
              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
            }
          `}
        >
          {({ isActive }) => <NavContent isActive={isActive} />}
        </NavLink>
      ) : (
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group
            ${isOpen 
              ? "bg-slate-800 text-white" 
              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
            }
          `}
        >
          <NavContent />
        </button>
      )}

      {hasChildren && (
        <div 
          className={`overflow-hidden transition-all duration-300 ml-6 border-l border-slate-800
            ${isOpen ? "max-h-40 opacity-100 mt-1 mb-2" : "max-h-0 opacity-0"}
          `}
        >
          {item.children!.map((child, cIndex) => {
            const ChildIcon = historyChildIcons[child.label] || ListIcon;
            return (
              <NavLink
                key={cIndex}
                to={child.to}
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-[13px] font-medium cursor-pointer transition-colors relative group
                  ${isActive ? "text-teal-400" : "text-slate-500 hover:text-teal-400"}
                `}
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator dot */}
                    <div className={`absolute left-0 w-1 h-1 rounded-full -translate-x-[4.5px] 
                      ${isActive ? "bg-teal-400" : "bg-slate-700 group-hover:bg-teal-400"}
                    `} />
                    <ChildIcon className="w-4 h-4 mr-2.5" />
                    {child.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      )}
    </li>
  );
};

const SideBar: React.FC = () => {
  const { logout } = useAuth();

  return (
    <aside className="w-[256px] min-h-screen bg-slate-950 text-slate-200 flex flex-col shadow-2xl border-r border-slate-900">
      {/* Brand Section */}
      <div className="p-8 mb-2">
        <div className="flex items-center gap-3 group cursor-default">
          <div className="p-2 bg-teal-500 rounded-xl shadow-lg shadow-teal-500/20 group-hover:rotate-12 transition-transform">
            <CreditCard className="w-6 h-6 text-slate-950" />
          </div>
          <h2 className="text-xl font-black tracking-tighter text-white">
            NC ID<span className="text-teal-500">TECH</span>
          </h2>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
          Management
        </p>
        <ul className="space-y-1.5">
          {navItems.map((item, index) => (
            <NavItemComponent key={index} item={item} />
          ))}
        </ul>
      </nav>

      {/* Profile & Logout Section */}
      <div className="p-4 mt-auto border-t border-slate-900 bg-slate-950/50">
        <button
          onClick={() => logout()}
          className="group flex items-center justify-between w-full p-3 rounded-xl bg-slate-900/50 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/50 transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-red-500/20 transition-colors">
              <FaArrowRightFromBracket className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
            </div>
            <span className="text-sm font-bold text-slate-300 group-hover:text-red-500">Sign Out</span>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default SideBar;