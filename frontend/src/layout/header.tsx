import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ChevronRight, PanelLeft, Bell, Search,
  Zap, Shield, Info, AlertCircle, CheckCircle2,
  Clock, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/api/axios";
import { formatDistanceToNow } from "date-fns";
import { echo } from "@/echo";

interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

interface Notification {
  id: string;
  data: {
    title?: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'system';
    action_url?: string;
  };
  read_at: string | null;
  created_at: string;
}

const PAGE_META: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Dashboard' },
  '/card-management': { title: 'Card Management', subtitle: 'Records' },
  '/card-designer': { title: 'Card Management', subtitle: 'Designer' },
  '/applicants': { title: 'Reports', subtitle: 'Applicants' },
  '/reports/archived': { title: 'Reports', subtitle: 'Archived' },
  '/departments': { title: 'Reports', subtitle: 'Departments' },
  '/reports/import': { title: 'Reports', subtitle: 'Import' },
  '/history': { title: 'History', subtitle: 'Logs' },
  '/notifications': { title: 'Notifications' },
  '/settings': { title: 'Settings' },
};

export default function Header({ isCollapsed, setIsCollapsed }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const ctx = PAGE_META[location.pathname] ?? { title: 'Admin' };

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      const data = response.data.data || [];
      setNotifications(data.slice(0, 5));
      setUnreadCount(data.filter((n: Notification) => !n.read_at).length);
    } catch (error) {
      console.error("Header notifications fetch failed:", error);
    }
  };

  // Fetch once on mount
  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  // Real-time updates via Pusher/Echo instead of polling
  useEffect(() => {
    if (!user) return;

    const channel = echo.channel('dashboard');

    // Listen for new application submissions
    const handleNewEvent = () => {
      fetchNotifications();
    };

    channel.listen('.new-submission', handleNewEvent);
    channel.listen('new-submission', handleNewEvent);

    return () => {
      channel.stopListening('.new-submission');
      channel.stopListening('new-submission');
    };
  }, [user]);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return Object.entries(PAGE_META)
      .filter(([path, data]) =>
        data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (data.subtitle && data.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map(([path, data]) => ({ path, ...data }));
  }, [searchQuery]);

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'warning': return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
      case 'error': return <Zap className="w-3.5 h-3.5 text-destructive" />;
      case 'system': return <Shield className="w-3.5 h-3.5 text-blue-500" />;
      default: return <Info className="w-3.5 h-3.5 text-primary" />;
    }
  };

  return (
    <header className="h-14 bg-background border-b border-border flex items-center justify-between px-4 shrink-0 transition-all duration-300 ease-in-out relative">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <PanelLeft size={17} />
        </button>

        <div className="h-4 w-px bg-border" />

        <nav className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground">{ctx.title}</span>
          {ctx.subtitle && (
            <>
              <ChevronRight size={13} className="text-border" />
              <span className="text-xs font-medium text-muted-foreground">{ctx.subtitle}</span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-1">
        {/* Functional Search */}
        <div className="relative">
          <div className={cn(
            "flex items-center bg-muted/50 border border-transparent focus-within:border-primary/30 focus-within:bg-background rounded-lg transition-all duration-300",
            showSearch ? "w-64 pr-2" : "w-10 overflow-hidden"
          )}>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-muted-foreground hover:text-foreground shrink-0"
            >
              <Search size={16} />
            </button>
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "bg-transparent border-none focus:ring-0 text-xs font-medium placeholder:text-muted-foreground/50 w-full transition-opacity duration-300",
                showSearch ? "opacity-100" : "opacity-0"
              )}
            />
          </div>

          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md">
              <div className="p-2 flex flex-col gap-0.5">
                {searchResults.map((res) => (
                  <button
                    key={res.path}
                    onClick={() => {
                      navigate(res.path);
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="flex flex-col p-2.5 rounded-lg hover:bg-accent text-left transition-colors group"
                  >
                    <span className="text-[11px] font-black uppercase text-foreground group-hover:text-primary transition-colors">{res.title}</span>
                    {res.subtitle && <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{res.subtitle}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors relative group">
              <Bell size={16} className="group-hover:rotate-12 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)] border-2 border-background" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 bg-popover border-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                Notifications
                {unreadCount > 0 && <Badge className="h-4 px-1 text-[8px] font-black bg-primary/20 text-primary border-none">{unreadCount} New</Badge>}
              </span>
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsPopoverOpen(false);
                }}
                className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                View All
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-1">
              {notifications.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-2">
                  <Bell className="w-8 h-8 text-muted-foreground/20" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">No notifications yet</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read_at) markAsRead(notif.id, { stopPropagation: () => { } } as any);
                      navigate('/card-management');
                      setIsPopoverOpen(false);
                    }}
                    className={cn(
                      "p-3 rounded-xl hover:bg-muted/50 transition-all flex gap-3 relative cursor-pointer group/item mb-1 last:mb-0",
                      !notif.read_at && "bg-primary/[0.03]"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-border/50",
                      notif.read_at ? "bg-muted/30" : "bg-primary/10"
                    )}>
                      {getTypeIcon(notif.data.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[11px] font-black text-foreground truncate uppercase tracking-tight">
                          {notif.data.title || "Update"}
                        </span>
                        {!notif.read_at && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2 uppercase font-medium tracking-wide">
                        {notif.data.message}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock className="w-2.5 h-2.5 text-muted-foreground/50" />
                        <span className="text-[8px] font-black text-primary/60 uppercase tracking-widest">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {!notif.read_at && (
                      <button
                        onClick={(e) => markAsRead(notif.id, e)}
                        className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded-md"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}