import React, { useState, useMemo, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Wallet,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  History as HistoryIcon,
  User as UserIcon,
  Loader2,
  Bell,
  X,
} from "lucide-react";
import nclogo from "@/assets/nc_logo.png";
import ProfileModal from "@/components/Modals/ProfileModal";

// shadcn UI
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Route prefetch map
// ---------------------------------------------------------------------------
const prefetchMap: Record<string, () => Promise<unknown>> = {
  "/dashboard": () => import("../pages/dashboard"),
  "/card-management": () => import("../pages/CardManagement"),
  "/card-designer": () => import("../components/CardDesignerPage"),
  "/applicants": () => import("../pages/Admin/Applicants/ApplicantsIndex"),
  "/reports/archived": () => import("../pages/Admin/Applicants/ArchivedApplicants"),
  "/departments": () => import("../pages/Admin/Departments/DepartmentsIndex"),
  "/reports/export": () => import("../pages/Admin/Reports/ReportsExport"),
  "/history": () => import("../pages/Admin/History/HistoryIndex"),
  "/notifications": () => import("../pages/Admin/Notifications/NotificationsPage"),
  "/settings": () => import("../pages/Admin/Settings/SettingsPage"),
};

interface NavItem {
  to?: string;
  label: string;
  icon: React.ElementType;
  children?: { label: string; to: string }[];
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Card Management",
    icon: Wallet,
    children: [
      { label: "Records", to: "/card-management" },
      { label: "Designer", to: "/card-designer" },
    ],
  },
  {
    label: "Reports",
    icon: FileText,
    children: [
      { label: "Applicants", to: "/applicants" },
      { label: "Archive", to: "/reports/archived" },
      { label: "Departments", to: "/departments" },
      { label: "Export", to: "/reports/export" },
    ],
  },
  { to: "/history", label: "History", icon: HistoryIcon },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

// Helper for UI Scaling
function scalePx(base: number): React.CSSProperties {
  return { height: `calc(${base}px * var(--ui-scale, 1))` } as React.CSSProperties;
}
function scalePxWidth(base: number): React.CSSProperties {
  return {
    width: `calc(${base}px * var(--ui-scale, 1))`,
    height: `calc(${base}px * var(--ui-scale, 1))`,
  } as React.CSSProperties;
}

const ITEM_HEIGHT = scalePx(40);
const CHILD_HEIGHT = scalePx(36);
const ICON_SIZE = scalePxWidth(18);
const LOGO_WRAP = scalePxWidth(40);
const LOGO_IMG = scalePxWidth(26);
const HEADER_HEIGHT = scalePx(80);
const AVATAR_SIZE = scalePxWidth(36);

const NavItemComponent = React.memo(
  ({ item, isCollapsed, onMobileClose }: { item: NavItem; isCollapsed: boolean; onMobileClose?: () => void }) => {
    const location = useLocation();
    const isChildActive = item.children?.some((child) => location.pathname === child.to);
    const [isOpen, setIsOpen] = useState<boolean>(!!isChildActive);

    const Icon = item.icon;
    const hasChildren = !!item.children?.length;
    const isActive = item.to ? location.pathname === item.to : isChildActive;

    const handleMouseEnter = useCallback(() => {
      if (item.to) prefetchMap[item.to]?.();
      item.children?.forEach((c) => prefetchMap[c.to]?.());
    }, [item]);

    const toggleOpen = useCallback(() => {
      if (!isCollapsed) setIsOpen((o) => !o);
    }, [isCollapsed]);

    return (
      <li className="list-none px-3 mb-1 relative group/nav-item" onMouseEnter={handleMouseEnter}>
        {isCollapsed && (
          <div className="absolute left-full top-0 z-[100] min-w-[180px] pl-2 invisible opacity-0 -translate-x-2 group-hover/nav-item:visible group-hover/nav-item:opacity-100 group-hover/nav-item:translate-x-0 transition-all duration-200">
            <div className="bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl py-2 px-1 backdrop-blur-md">
              <div className="px-3 py-1.5 mb-1 border-b border-border/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                {hasChildren ? (
                  item.children!.map((child, i) => (
                    <NavLink key={i} to={child.to} onClick={onMobileClose} className={({ isActive: ca }) => cn("px-3 py-2 rounded-lg text-[12px] font-bold transition-all", ca ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent")}>
                      {child.label}
                    </NavLink>
                  ))
                ) : (
                  item.to && (
                    <NavLink to={item.to} onClick={onMobileClose} className={cn("px-3 py-2 rounded-lg text-[12px] font-bold transition-all", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent")}>
                      {item.label}
                    </NavLink>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {item.to && !hasChildren ? (
          <NavLink
            to={item.to}
            style={ITEM_HEIGHT}
            onClick={onMobileClose}
            className={cn(
              "group flex items-center rounded-xl text-[13px] font-bold transition-all duration-300 w-full px-3",
              isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <div className="w-6 flex justify-start shrink-0">
              <Icon style={ICON_SIZE} strokeWidth={2.5} />
            </div>
            <span
              className={cn(
                "ml-2 whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden",
                isCollapsed ? "max-w-0 opacity-0 -translate-x-4 invisible" : "max-w-[200px] opacity-100 translate-x-0 visible"
              )}
            >
              {item.label}
            </span>
          </NavLink>
        ) : (
          <div className="flex flex-col">
            <button
              onClick={toggleOpen}
              style={ITEM_HEIGHT}
              className={cn(
                "group flex items-center rounded-xl text-[13px] font-bold transition-all duration-300 w-full px-3",
                (isOpen && !isCollapsed) || (isCollapsed && isChildActive) ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <div className="w-6 flex justify-start shrink-0">
                <Icon style={ICON_SIZE} strokeWidth={2.5} />
              </div>
              <div
                className={cn(
                  "flex-1 flex items-center justify-between ml-2 transition-all duration-300 ease-in-out overflow-hidden",
                  isCollapsed ? "max-w-0 opacity-0 -translate-x-4 invisible" : "max-w-[200px] opacity-100 translate-x-0 visible"
                )}
              >
                <span className="whitespace-nowrap">{item.label}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isOpen ? "rotate-180" : "opacity-40")} />
              </div>
            </button>

            {!isCollapsed && isOpen && hasChildren && (
              <div className="ml-6 pl-4 border-l-2 border-primary/10 mt-1 mb-2 space-y-1 animate-in slide-in-from-top-1 duration-200">
                {item.children!.map((child, i) => (
                  <NavLink key={i} to={child.to} style={CHILD_HEIGHT} onClick={onMobileClose} className={({ isActive: ca }) => cn("flex items-center px-3 text-[12px] font-bold rounded-lg transition-all", ca ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </li>
    );
  },
  (prev, next) => prev.isCollapsed === next.isCollapsed && prev.item === next.item
);

const SideBar: React.FC<{ isCollapsed: boolean; setIsCollapsed: (v: boolean) => void }> = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout, isLoggingOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const navigate = useNavigate();

  const handleMobileClose = useCallback(() => {
    if (window.innerWidth < 768) setIsCollapsed(true);
  }, [setIsCollapsed]);

  const avatarInitials = useMemo(() => (user?.name || "AD").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(), [user?.name]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden",
          isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onClick={() => setIsCollapsed(true)}
      />

      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-screen bg-background border-r border-border z-[70] transition-all duration-300 ease-in-out flex flex-col",
          isCollapsed ? "-translate-x-full md:translate-x-0 md:w-[68px]" : "translate-x-0 w-[260px]"
        )}
      >
        <button onClick={() => setIsCollapsed(true)} className="absolute right-4 top-6 p-2 md:hidden text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div style={HEADER_HEIGHT} className="flex items-center px-4 shrink-0 border-b border-border">
          <div className="flex items-center w-full">
            <div style={LOGO_WRAP} className="flex items-center justify-center shrink-0 bg-primary/5 rounded-xl transition-all duration-300">
              <img src={nclogo} alt="Logo" style={LOGO_IMG} className="object-contain" />
            </div>

            <div
              className={cn(
                "flex flex-col whitespace-nowrap transition-all duration-300 ease-in-out ml-3 overflow-hidden",
                isCollapsed ? "max-w-0 opacity-0 -translate-x-4 scale-95 invisible" : "max-w-[200px] opacity-100 translate-x-0 scale-100 visible"
              )}
            >
              <span className="text-[14px] font-black tracking-tight leading-none">NC ID Tech</span>
              <span className="text-[9px] font-black uppercase text-primary tracking-[0.15em] mt-1.5 leading-none">Management</span>
            </div>
          </div>
        </div>

        <nav className={cn("flex-1 py-6 space-y-1 scrollbar-none", isCollapsed ? "overflow-visible" : "overflow-y-auto")}>
          {navItems.map((item, index) => (
            <NavItemComponent key={index} item={item} isCollapsed={isCollapsed} onMobileClose={handleMobileClose} />
          ))}
        </nav>

        <div className="p-3 border-t border-border shrink-0 bg-background/50 backdrop-blur-md">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center p-1.5 rounded-xl transition-all hover:bg-accent group cursor-pointer outline-none">
                <div style={AVATAR_SIZE} className="rounded-full bg-primary flex items-center justify-center text-[11px] font-black text-primary-foreground uppercase shrink-0 shadow-sm overflow-hidden">
                  {user?.avatar_url ? <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" /> : avatarInitials}
                </div>

                <div
                  className={cn(
                    "flex flex-col min-w-0 flex-1 ml-3 transition-all duration-300 ease-in-out overflow-hidden",
                    isCollapsed ? "max-w-0 opacity-0 -translate-x-4 invisible" : "max-w-[200px] opacity-100 translate-x-0 visible"
                  )}
                >
                  <span className="text-[11px] font-black truncate uppercase tracking-tight leading-none">{user?.name || "Admin User"}</span>
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-1 opacity-80 leading-none">{user?.role || "Admin"}</span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56 mb-2 ml-2 bg-popover/95 backdrop-blur-md border-border rounded-xl shadow-2xl p-1">
              <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase text-muted-foreground">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setIsProfileOpen(true); handleMobileClose(); }} className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer">
                <UserIcon className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { navigate("/settings"); handleMobileClose(); }} className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer">
                <SettingsIcon className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsLogoutConfirmOpen(true)} className="flex items-center gap-2 p-2.5 rounded-lg text-destructive cursor-pointer">
                <LogOut className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <LogOut className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle className="text-lg font-black uppercase tracking-tight">Confirm Logout</DialogTitle>
            <DialogDescription className="text-xs font-medium uppercase tracking-widest leading-relaxed">
              Are you sure you want to sign out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-start mt-4">
            <Button variant="outline" onClick={() => setIsLogoutConfirmOpen(false)} className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button variant="destructive" onClick={logout} disabled={isLoggingOut} className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-destructive/20">
              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SideBar;