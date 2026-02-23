import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, PanelLeft, Bell, Search } from 'lucide-react';

interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const PAGE_META: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Dashboard' },
  '/card-management': { title: 'Card Management', subtitle: 'Records' },
  '/card-designer': { title: 'Card Management', subtitle: 'Designer' },
  '/applicants': { title: 'Reports', subtitle: 'Applicants' },
  '/departments': { title: 'Reports', subtitle: 'Departments' },
  '/reports/import': { title: 'Reports', subtitle: 'Import' },
  '/history/logs': { title: 'History', subtitle: 'Logs' },
  '/history/activity': { title: 'History', subtitle: 'Activity' },
  '/settings': { title: 'Settings' },
};

export default function Header({ isCollapsed, setIsCollapsed }: HeaderProps) {
  const location = useLocation();
  const { user } = useAuth();

  const ctx = PAGE_META[location.pathname] ?? { title: 'Admin' };
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-4 shrink-0 transition-all duration-200 ease-in-out">
      <div className="flex items-center gap-3">
        {/* Sidebar toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <PanelLeft size={17} />
        </button>

        <div className="h-4 w-px bg-zinc-200" />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-400">Platform</span>
          <ChevronRight size={13} className="text-zinc-300" />
          <span className="text-xs font-semibold text-zinc-700">{ctx.title}</span>
          {ctx.subtitle && (
            <>
              <ChevronRight size={13} className="text-zinc-300" />
              <span className="text-xs font-medium text-zinc-400">{ctx.subtitle}</span>
            </>
          )}
        </nav>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors">
          <Search size={16} />
        </button>
        <button className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>
        <div className="h-4 w-px bg-zinc-200 mx-1" />
        <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-[9px] font-bold text-white uppercase">
          {initials}
        </div>
      </div>
    </header>
  );
}