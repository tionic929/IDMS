import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, PanelLeft, Bell, Search } from 'lucide-react';

interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function Header({ isCollapsed, setIsCollapsed }: HeaderProps) {
  const location = useLocation();

  const getPageContext = () => {
    const path = location.pathname;
    if (path === '/dashboard') return { title: 'Dashboard' };
    if (path === '/applicants') return { title: 'Applicants', subtitle: 'Directory List' };
    if (path === '/reports/import') return { title: 'Importer', subtitle: 'CSV/Excel Upload' };
    if (path === '/departments') return { title: 'Departments', subtitle: 'Organization' };
    return { title: 'Admin', subtitle: 'Portal' };
  };

  const context = getPageContext();

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 transition-all duration-200 ease-in-out">
      <div className="flex items-center gap-4">
        {/* Shadcn-style Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 mr-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <PanelLeft size={18} />
        </button>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Breadcrumb Pattern */}
        <nav className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-400 hover:text-slate-200 cursor-default">
            Platform
          </span>
          <ChevronRight size={14} className="text-slate-600" />
          <h1 className="text-sm font-medium text-slate-100">
            {context.title}
          </h1>
          {context.subtitle && (
            <>
              <ChevronRight size={14} className="text-slate-600" />
              <span className="text-sm font-medium text-slate-400">
                {context.subtitle}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        <button className="p-2 text-slate-400 hover:text-slate-100 transition-colors">
          <Search size={18} />
        </button>
        <button className="p-2 text-slate-400 hover:text-slate-100 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-slate-950"></span>
        </button>
        <div className="h-4 w-[1px] bg-slate-800 mx-1" />
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase">
          AD
        </div>
      </div>
    </header>
  );
}