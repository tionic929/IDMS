import { useEffect, useState, useCallback } from "react";
import { 
  Bell, CheckCircle2, Trash2, Clock, 
  AlertCircle, Info, Zap, Shield,
  MoreVertical, Filter, ArrowRight,
  Search, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import api from "@/api/axios";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { echo } from "@/echo";

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

const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/notifications");
            setNotifications(response.data.data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const channel = echo.channel('dashboard');
        
        channel.notification((notification: any) => {
            console.log('[Echo] New Notification Received:', notification);
            
            // Add new notification to the top of the list if it doesn't exist
            setNotifications(prev => {
                if (prev.some(n => n.id === notification.id)) return prev;
                
                // Show toast
                toast.info(notification.data.message || "New Update Received", {
                    onClick: () => {
                        if (notification.data.action_url) navigate(notification.data.action_url);
                    }
                });

                return [notification, ...prev];
            });
        });

        return () => {
            echo.leaveChannel('dashboard');
        };
    }, [navigate]);

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
            );
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllRead = async () => {
        const loadingToast = toast.loading("Marking all as read...");
        try {
            await api.post("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
            toast.update(loadingToast, { render: "All marked as read!", type: "success", isLoading: false, autoClose: 2000 });
        } catch (error) {
            toast.update(loadingToast, { render: "Failed to update", type: "error", isLoading: false, autoClose: 2000 });
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success("Notification deleted");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const getTypeIcon = (type?: string) => {
        switch (type) {
            case 'success': return <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="w-4 h-4" /></div>;
            case 'warning': return <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><AlertCircle className="w-4 h-4" /></div>;
            case 'error': return <div className="p-2 rounded-lg bg-destructive/10 text-destructive"><Zap className="w-4 h-4" /></div>;
            case 'system': return <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Shield className="w-4 h-4" /></div>;
            default: return <div className="p-2 rounded-lg bg-primary/10 text-primary"><Info className="w-4 h-4" /></div>;
        }
    };

    const filteredNotifications = notifications
        .filter(n => filter === 'all' || !n.read_at)
        .filter(n => {
            const searchStr = query.toLowerCase();
            return (
                n.data.message.toLowerCase().includes(searchStr) ||
                (n.data.title || "").toLowerCase().includes(searchStr)
            );
        });

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-700 font-sans selection:bg-primary/10">
            {/* ── PAGE HEADER ────────────────────────────────────────── */}
            <div className="px-6 py-2">
                <div className="mb-8">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Platform / Notifications</span>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-5">
                      <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        Notifications
                        <Bell className="w-7 h-7 text-primary animate-pulse" />
                      </h1>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold uppercase tracking-[0.1em]">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Live
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                          variant="outline" 
                          size="sm"
                          onClick={markAllRead}
                          disabled={notifications.every(n => n.read_at)}
                          className="gap-2 h-9 bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg text-[11px] font-bold uppercase tracking-wider"
                      >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark all read
                      </Button>
                      <Button
                          variant="default"
                          size="sm"
                          onClick={fetchNotifications}
                          disabled={loading}
                          className="gap-2 h-9 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[11px] uppercase tracking-wider rounded-lg"
                      >
                          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                          {loading ? 'Refreshing…' : 'Refresh'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* ── SEARCH + FILTER BAR ────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
                  {/* Search */}
                  <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter notifications…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-10 h-10 border-border bg-card shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary rounded-lg"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "gap-1.5 h-10 px-4 text-[11px] font-bold rounded-lg transition-all flex items-center border whitespace-nowrap",
                            filter === 'all' 
                              ? "bg-primary/10 text-primary border-primary/30" 
                              : "bg-card text-muted-foreground border-border hover:text-primary hover:bg-primary/5 hover:border-primary/20"
                        )}
                    >
                        All
                        <Badge className="ml-1.5 bg-background/20 text-inherit border-none h-4 px-1 flex items-center justify-center font-black min-w-4 text-[8px]">
                            {notifications.length}
                        </Badge>
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={cn(
                            "gap-1.5 h-10 px-4 text-[11px] font-bold rounded-lg transition-all flex items-center border whitespace-nowrap",
                            filter === 'unread' 
                              ? "bg-primary/10 text-primary border-primary/30" 
                              : "bg-card text-muted-foreground border-border hover:text-primary hover:bg-primary/5 hover:border-primary/20"
                        )}
                    >
                        Unread
                        <Badge className="ml-1.5 bg-background/20 text-inherit border-none h-4 px-1 flex items-center justify-center font-black min-w-4 text-[8px]">
                            {notifications.filter(n => !n.read_at).length}
                        </Badge>
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
                    {loading && notifications.length === 0 ? (
                        <div className="space-y-4 pt-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-24 bg-card/50 border border-border rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-dashed border-border rounded-2xl">
                            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                                <Bell className="w-10 h-10 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-foreground">All Clear!</h3>
                            <p className="text-sm font-medium text-muted-foreground mt-2 uppercase tracking-widest leading-relaxed px-10">
                                {query 
                                    ? `No results found for "${query}"`
                                    : `No ${filter === 'unread' ? 'unread' : ''} notifications at the moment.`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Recent Activity</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>

                          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm shadow-primary/5 p-2">
                              <div className="space-y-1">
                                  {filteredNotifications.map((notif) => (
                                      <div 
                                          key={notif.id}
                                          className={cn(
                                              "p-4 rounded-xl border-none transition-all duration-300 group flex items-start gap-4 cursor-pointer hover:bg-muted/50 relative",
                                              !notif.read_at && "bg-primary/[0.02]"
                                          )}
                                          onClick={() => {
                                              if (!notif.read_at) markAsRead(notif.id);
                                              if (notif.data.action_url) navigate(notif.data.action_url);
                                          }}
                                      >
                                          {!notif.read_at && (
                                              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary" />
                                          )}

                                          <div className="shrink-0 mt-0.5">
                                            {getTypeIcon(notif.data.type)}
                                          </div>

                                          <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                  <h4 className="text-[13px] font-black uppercase tracking-tight text-foreground truncate">
                                                      {notif.data.title || "System Update"}
                                                  </h4>
                                                  <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1 opacity-60">
                                                      <Clock className="w-3 h-3" />
                                                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                  </span>
                                              </div>
                                              <p className="text-[11px] font-medium text-muted-foreground uppercase leading-relaxed tracking-wider opacity-90">
                                                  {notif.data.message}
                                              </p>
                                          </div>

                                          <div className="flex items-center gap-2 pr-2">
                                              {notif.data.action_url && (
                                                  <div className="p-2 rounded-lg text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                      <ArrowRight className="w-4 h-4" />
                                                  </div>
                                              )}
                                              
                                              <DropdownMenu>
                                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background">
                                                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                      </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end" className="bg-popover border-border rounded-xl min-w-[160px] p-1.5 shadow-2xl">
                                                      <div className="px-2 py-1.5 mb-1 border-b border-border/50">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Actions</span>
                                                      </div>
                                                      {!notif.read_at && (
                                                          <DropdownMenuItem 
                                                              onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                                              className="text-[10px] font-black uppercase tracking-tight p-2.5 rounded-lg cursor-pointer focus:bg-primary focus:text-primary-foreground"
                                                          >
                                                              Mark as Read
                                                          </DropdownMenuItem>
                                                      )}
                                                      <DropdownMenuItem 
                                                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                                          className="text-[10px] font-black uppercase tracking-tight text-destructive p-2.5 rounded-lg cursor-pointer focus:bg-destructive focus:text-destructive-foreground"
                                                      >
                                                          Delete Forever
                                                      </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                              </DropdownMenu>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
