import React, { useState } from "react";
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
  Bell
} from "lucide-react";
import nclogo from '@/assets/nc_logo.png';
import ProfileModal from "@/components/Modals/ProfileModal";
import { useSystemSettings } from "@/context/SystemSettingsContext";

// shadcn UI
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
    DropdownMenu, DropdownMenuContent, 
    DropdownMenuItem, DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel 
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

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
      { label: "Departments", to: "/departments" },
      { label: "Import", to: "/reports/import" },
      { label: "Export", to: "/reports/export" },
    ],
  },
  { to: "/history", label: "History", icon: HistoryIcon },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

const NavItemComponent: React.FC<{ item: NavItem; isCollapsed: boolean }> = ({ item, isCollapsed }) => {
  const { settings } = useSystemSettings();
  const location = useLocation();
  const isChildActive = item.children?.some((child) => location.pathname === child.to);
  const [isOpen, setIsOpen] = useState<boolean>(!!isChildActive);

  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.to ? location.pathname === item.to : isChildActive;

  const iconClass = cn(
    "w-4 h-4 shrink-0 transition-all duration-300",
    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
  );

  return (
    <li className="list-none px-3 mb-1 relative group/nav-item">
      {/* Flyout Menu for Collapsed State */}
      {isCollapsed && (
        <div className="absolute left-full top-0 z-[100] min-w-[200px] pl-2 invisible opacity-0 translate-x-[-10px] group-hover/nav-item:visible group-hover/nav-item:opacity-100 group-hover/nav-item:translate-x-0 transition-all duration-200">
          <div className="bg-popover text-popover-foreground border border-border rounded-xl shadow-xl overflow-hidden py-2 px-1 backdrop-blur-md">
            <div className="px-3 py-1.5 mb-1 border-b border-border/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {item.label}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {hasChildren ? (
                item.children!.map((child, cIndex) => (
                  <NavLink
                    key={cIndex}
                    to={child.to}
                    className={({ isActive: childActive }) => cn(
                      "flex items-center px-3 py-2 rounded-lg text-[12px] font-bold transition-all",
                      childActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {child.label}
                  </NavLink>
                ))
              ) : (
                item.to && (
                  <NavLink
                    to={item.to}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-[12px] font-bold transition-all",
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {item.label}
                  </NavLink>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Nav Link/Button */}
      {item.to && !hasChildren ? (
        <NavLink
          to={item.to}
          style={{ height: `${40 * settings.componentScale}px` }}
          className={cn(
            "group flex items-center px-3 rounded-xl text-[13px] font-bold transition-all duration-300 w-full overflow-hidden",
            isActive
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon 
            className={cn(iconClass, isActive ? "text-primary-foreground" : "")} 
            strokeWidth={2.5} 
            style={{ width: `${16 * settings.componentScale}px`, height: `${16 * settings.componentScale}px` }}
          />
          <span 
            className={cn(
                "ml-3 whitespace-nowrap transition-all duration-300 origin-left shrink-0",
                isCollapsed ? "opacity-0 scale-90 -translate-x-4 pointer-events-none" : "opacity-100 scale-100"
            )}
            style={{ fontSize: `${13 * settings.componentScale}px` }}
          >
            {item.label}
          </span>
        </NavLink>
      ) : (
        <div className="flex flex-col">
          <button
            onClick={() => !isCollapsed && setIsOpen(!isOpen)}
            style={{ height: `${40 * settings.componentScale}px` }}
            className={cn(
              "group flex items-center px-3 rounded-xl text-[13px] font-bold transition-all duration-300 w-full overflow-hidden",
              (isOpen && !isCollapsed) || (isCollapsed && isChildActive)
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon 
              className={iconClass} 
              strokeWidth={2.5} 
              style={{ width: `${16 * settings.componentScale}px`, height: `${16 * settings.componentScale}px` }}
            />
            <div className={cn(
              "flex-1 flex items-center justify-between ml-3 transition-all duration-300 origin-left shrink-0",
              isCollapsed ? "opacity-0 scale-90 -translate-x-4 pointer-events-none" : "opacity-100 scale-100"
            )}>
              <span className="whitespace-nowrap" style={{ fontSize: `${13 * settings.componentScale}px` }}>{item.label}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isOpen ? "rotate-180" : "opacity-40")} />
            </div>
          </button>

          {!isCollapsed && isOpen && hasChildren && (
            <div className="ml-5 pl-4 border-l-2 border-primary/10 mt-1 mb-2 space-y-1 animate-in slide-in-from-top-1 duration-200">
              {item.children!.map((child, cIndex) => (
                <NavLink
                  key={cIndex}
                  to={child.to}
                  style={{ height: `${36 * settings.componentScale}px` }}
                  className={({ isActive: childActive }) => cn(
                    "flex items-center px-3 text-[12px] font-bold rounded-lg transition-all",
                    childActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <span style={{ fontSize: `${12 * settings.componentScale}px` }}>{child.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
};

const SideBar: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const { settings } = useSystemSettings();
  const { user, logout, isLoggingOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <aside
        className={cn(
          "absolute top-0 left-0 h-full bg-background text-foreground flex flex-col border-r border-border z-50 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        {/* Header Section */}
        <div 
          style={{ height: `${80 * settings.componentScale}px` }}
          className="flex items-center px-5 shrink-0 border-b border-border bg-background/50 backdrop-blur-md"
        >
          <div className="flex items-center gap-3 w-full overflow-hidden">
            <div 
              style={{ width: `${40 * settings.componentScale}px`, height: `${40 * settings.componentScale}px` }}
              className="flex items-center justify-center shrink-0 bg-primary/5 rounded-xl transition-all"
            >
              <img
                src={nclogo}
                alt="NC Logo"
                style={{ width: `${32 * settings.componentScale}px`, height: `${32 * settings.componentScale}px` }}
                className="object-contain transition-transform duration-300 hover:rotate-12"
              />
            </div>
 
            <div className={cn(
              "flex flex-col whitespace-nowrap transition-all duration-300 ease-in-out origin-left",
              isCollapsed ? "opacity-0 scale-90 -translate-x-10 pointer-events-none" : "opacity-100 scale-100"
            )}>
              <span 
                className="font-black tracking-tight text-foreground leading-none"
                style={{ fontSize: `${15 * settings.componentScale}px` }}
              >
                NC ID Tech
              </span>
              <span 
                className="font-black uppercase text-primary tracking-[0.2em] mt-1.5 leading-none"
                style={{ fontSize: `${9 * settings.componentScale}px` }}
              >
                Management
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className={cn(
          "flex-1 py-6 space-y-6 scrollbar-none",
          isCollapsed ? "overflow-visible" : "overflow-y-auto"
        )}>
          <ul className="space-y-1.5">
            {navItems.map((item, index) => (
              <NavItemComponent key={index} item={item} isCollapsed={isCollapsed} />
            ))}
          </ul>
        </nav>

        {/* Footer Section */}
        <div className="p-3 border-t border-border shrink-0 bg-background/50 backdrop-blur-md space-y-1">
          {/* Profile Section with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div 
                className={cn(
                  "flex items-center p-2 rounded-xl transition-all duration-300 hover:bg-accent group mb-1 cursor-pointer outline-none",
                  isCollapsed ? "justify-center" : "gap-3"
                )}
              >
                <div 
                  style={{ width: `${36 * settings.componentScale}px`, height: `${36 * settings.componentScale}px` }}
                  className="rounded-full bg-primary flex items-center justify-center text-[11px] font-black text-primary-foreground uppercase shrink-0 shadow-sm transition-transform group-hover:scale-105 overflow-hidden"
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    (user?.name || 'AD').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 transition-all duration-300 animate-in fade-in slide-in-from-left-2 overflow-hidden flex-1">
                    <span 
                        className="font-black text-foreground truncate uppercase tracking-tight"
                        style={{ fontSize: `${12 * settings.componentScale}px` }}
                    >
                      {user?.name || 'Admin User'}
                    </span>
                    <span 
                        className="font-black text-primary uppercase tracking-widest mt-0.5 opacity-80"
                        style={{ fontSize: `${9 * settings.componentScale}px` }}
                    >
                      {user?.role || 'Administrator'}
                    </span>
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56 mb-2 ml-2 bg-popover/95 backdrop-blur-md border-border rounded-xl shadow-2xl p-1 animate-in slide-in-from-left-2 duration-200">
              <DropdownMenuLabel className="px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">My Account</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem 
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 p-2.5 rounded-lg focus:bg-primary focus:text-primary-foreground transition-colors cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-tight">Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 p-2.5 rounded-lg focus:bg-primary focus:text-primary-foreground transition-colors cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-tight">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem 
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="flex items-center gap-2 p-2.5 rounded-lg text-destructive focus:bg-destructive focus:text-destructive-foreground transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-tight">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

          {/* Logout Confirmation Modal */}
          <Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
            <DialogContent className="sm:max-w-[400px] bg-background border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
                <div className="p-8 space-y-6">
                    <DialogHeader>
                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                            <LogOut className="w-6 h-6 text-destructive" />
                        </div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">
                            Confirm Logout
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground uppercase tracking-widest leading-relaxed">
                            Are you sure you want to sign out? You will need to log back in to access the dashboard.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex gap-3 sm:justify-start pt-2">
                        <Button 
                            variant="outline" 
                            disabled={isLoggingOut}
                            onClick={() => setIsLogoutConfirmOpen(false)}
                            className="flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={logout}
                            disabled={isLoggingOut}
                            className="flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-destructive/20"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Sign Out"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
          </Dialog>
        </div>
      </aside>

      {/* Spacer to prevent content from going under the fixed sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out shrink-0 hidden md:block",
        isCollapsed ? "w-[72px]" : "w-[280px]"
      )} />
    </>
  );
};

export default SideBar;