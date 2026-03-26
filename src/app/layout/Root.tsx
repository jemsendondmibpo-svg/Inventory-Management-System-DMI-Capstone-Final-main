import { useState, useRef, useEffect } from "react";
import {
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  Package,
  UserCheck,
  BarChart3,
  Settings,
  Search,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Users,
  User,
  Mail,
  Shield,
  UserCog,
  Briefcase,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "../context/AuthContext";
import { NotificationPanel } from "../components/NotificationPanel";
import { RealtimeIndicator } from "../components/RealtimeIndicator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { toast } from "sonner";
import { canAccessModule } from "../lib/access";

export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profilePanelRef = useRef<HTMLDivElement>(null);
  const [profilePosition, setProfilePosition] = useState({ top: 0, right: 0 });

  // Update profile dropdown position when opening
  useEffect(() => {
    if (isProfileOpen && profileButtonRef.current) {
      const rect = profileButtonRef.current.getBoundingClientRect();
      setProfilePosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isProfileOpen]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profilePanelRef.current &&
        !profilePanelRef.current.contains(event.target as Node) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const confirmLogout = async () => {
    setIsLogoutDialogOpen(false);
    setIsProfileOpen(false);
    setIsSidebarOpen(false);
    await handleLogout();
  };

  const navigation = user
    ? [
        ...(canAccessModule(user.role, "dashboard")
          ? [
              {
                name: "Dashboard",
                path: "/dashboard",
                icon: LayoutDashboard,
              },
            ]
          : []),
        ...(canAccessModule(user.role, "inventory")
          ? [
              {
                name: "Inventory",
                path: "/dashboard/inventory",
                icon: Package,
              },
            ]
          : []),
        ...(canAccessModule(user.role, "assignments")
          ? [
              {
                name: "Assignments",
                path: "/dashboard/assignments",
                icon: UserCheck,
              },
            ]
          : []),
        ...(canAccessModule(user.role, "reports")
          ? [
              {
                name: "Reports",
                path: "/dashboard/reports",
                icon: BarChart3,
              },
            ]
          : []),
        ...(canAccessModule(user.role, "user-management")
          ? [
              {
                name: "User Management",
                path: "/dashboard/user-management",
                icon: Users,
              },
            ]
          : []),
        ...(canAccessModule(user.role, "settings")
          ? [
              {
                name: "Settings",
                path: "/dashboard/settings",
                icon: Settings,
              },
            ]
          : []),
      ]
    : [];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    if (path === "/dashboard/inventory") {
      return location.pathname === "/dashboard/inventory";
    }
    return location.pathname.startsWith(path);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin":
        return Shield;
      case "IT Officers":
        return UserCog;
      case "HR Officers":
        return Briefcase;
      default:
        return User;
    }
  };

  const currentPage =
    navigation.find((item) => isActive(item.path))?.name ||
    (location.pathname === "/dashboard/user-management" ? "User Management" : "Dashboard");

  const SidebarContent = ({
    mobile = false,
  }: {
    mobile?: boolean;
  }) => {
    const SidebarRoleIcon = getRoleIcon(user?.role || "");

    return (
      <>
      {/* Logo area */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          {/* Digital Minds BPO logo */}
          <img
            src="https://cdn.digitalmindsbpo.com/wp-content/uploads/2022/02/Digital-Minds-BPO-Footer-Logo-768x142.png"
            alt="Digital Minds BPO"
            className="h-7 w-auto"
          />
        </div>
        {mobile && (
          <button
            className="text-white/60 hover:text-white transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => mobile && setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                active
                  ? "bg-[#B0BF00] text-[#1a1d27]"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  active ? "text-[#1a1d27]" : ""
                }`}
              />
              <span className="text-sm font-medium">
                {item.name}
              </span>
              {active && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#1a1d27]/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-white/10 p-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <button
            onClick={toggleTheme}
            className="mb-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-medium text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            <span className="flex items-center gap-2">
              {isDark ? <Moon className="h-4 w-4 text-[#B0BF00]" /> : <Sun className="h-4 w-4 text-[#B0BF00]" />}
              {isDark ? "Dark Mode" : "Light Mode"}
            </span>
            <span className="rounded-full bg-[#B0BF00]/15 px-2 py-0.5 text-[10px] font-semibold text-[#B0BF00]">
              {isDark ? "On" : "Off"}
            </span>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B0BF00] to-[#8a9600] text-sm font-bold text-[#1a1d27] shadow-lg">
              {user ? getInitials(user.name) : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name || "User"}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-white/65">
                <SidebarRoleIcon className="h-3.5 w-3.5 text-[#B0BF00]" />
                <span className="truncate">{user?.role || "User"}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              to="/dashboard/settings"
              onClick={() => mobile && setIsSidebarOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white"
            >
              <Settings className="h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={() => {
                if (mobile) {
                  setIsSidebarOpen(false);
                }
                setIsLogoutDialogOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#B0BF00] px-3 py-2 text-xs font-semibold text-[#1a1d27] transition-all duration-200 hover:bg-[#c3d200]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
    );
  };

  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
      <div className="flex h-screen overflow-hidden relative bg-gradient-to-br from-gray-50 via-gray-100 to-[#B0BF00]/5 text-slate-900 dark:from-[#07111f] dark:via-[#0d1a2b] dark:to-[#07111f] dark:text-slate-100">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#B0BF00]/10 rounded-full blur-3xl animate-pulse dark:bg-[#8fa100]/8" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#B0BF00]/10 rounded-full blur-3xl animate-pulse dark:bg-[#8fa100]/8"
          style={{ animationDelay: "1000ms" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#B0BF00]/5 rounded-full blur-3xl dark:bg-[#8fa100]/4" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 bg-[#1a1d27]/95 backdrop-blur-xl flex-shrink-0 relative z-10 border-r border-white/5 dark:bg-[#081222]/95 dark:border-[#20324a]">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#07111f]/70 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-56 bg-[#1a1d27]/95 backdrop-blur-xl flex flex-col z-50 transform transition-transform duration-200 ease-in-out lg:hidden border-r border-white/5 dark:bg-[#081222]/95 dark:border-[#20324a] ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent mobile />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-[#B0BF00]/20 flex items-center px-3 md:px-4 lg:px-6 gap-2 md:gap-3 flex-shrink-0 shadow-[0_4px_20px_rgba(176,191,0,0.08)] dark:bg-[#0d1a2b]/90 dark:border-[#314865] dark:shadow-[0_4px_20px_rgba(2,8,23,0.45)]">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-white transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop hamburger (cosmetic) */}
          <button className="hidden lg:flex text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <h2 className="text-sm md:text-base font-semibold text-gray-800 truncate dark:text-slate-100">
            {currentPage === "Dashboard"
              ? "Dashboard Overview"
              : currentPage === "Inventory"
                ? "Inventory Overview"
                : currentPage}
          </h2>

          {/* Spacer */}
          <div className="flex-1" />

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-xl border border-[#B0BF00]/15 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-[#B0BF00]/35 hover:bg-[#f7fad8] dark:border-[#314865] dark:bg-[#132338] dark:text-slate-100 dark:hover:bg-[#1a2e45]"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-4 w-4 text-[#B0BF00]" /> : <Moon className="h-4 w-4 text-[#B0BF00]" />}
            <span className="hidden sm:inline">{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          {/* Notification bell */}
          <NotificationPanel />

          {/* User profile with dropdown */}
          <div className="relative">
            <button
              ref={profileButtonRef}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 md:gap-2.5 pl-1 hover:opacity-80 transition-opacity"
            >
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-800 leading-tight truncate max-w-[120px]">
                  {user?.name || "User"}
                </p>
                <p className="text-[11px] text-gray-500 leading-tight">
                  {user?.role || "User"}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B0BF00] to-[#8a9600] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-lg ring-2 ring-white cursor-pointer hover:scale-110 transition-all duration-200">
                {user ? getInitials(user.name) : "U"}
              </div>
            </button>
          </div>

          {/* Profile Dropdown - Rendered via Portal */}
          {isProfileOpen &&
            createPortal(
              <div
                ref={profilePanelRef}
                className="fixed w-72 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-2 border-gray-100 overflow-hidden z-[9999] dark:bg-[#0d1a2b] dark:border-[#314865]"
                style={{ top: `${profilePosition.top}px`, right: `${profilePosition.right}px` }}
              >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-[#B0BF00] to-[#8a9600] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/30">
                      {user ? getInitials(user.name) : "U"}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">
                        {user?.name || "User"}
                      </p>
                      <p className="text-white/80 text-xs">
                        View your profile
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="p-4 space-y-3 border-b border-gray-100 dark:border-[#314865]">
                  {/* Full Name */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 dark:bg-[#132338]">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium dark:text-slate-400">Full Name</p>
                      <p className="text-sm text-gray-900 font-semibold truncate dark:text-slate-100">
                        {user?.name || "User"}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 dark:bg-[#132338]">
                      <Mail className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium dark:text-slate-400">Email Address</p>
                      <p className="text-sm text-gray-900 font-semibold truncate dark:text-slate-100">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 dark:bg-[#132338]">
                      {(() => {
                        const RoleIcon = getRoleIcon(user?.role || "");
                        return <RoleIcon className="w-4 h-4 text-green-600" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium dark:text-slate-400">Role</p>
                      <p className="text-sm text-gray-900 font-semibold dark:text-slate-100">
                        {user?.role || "User"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 group dark:text-slate-100 dark:hover:bg-[#132338]"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-[#B0BF00]/10 transition-colors dark:bg-[#132338] dark:group-hover:bg-[#B0BF00]/10">
                      <Settings className="w-4 h-4 text-gray-600 group-hover:text-[#B0BF00] transition-colors" />
                    </div>
                    <span className="flex-1">Settings</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#B0BF00] transition-colors dark:text-slate-400" />
                  </Link>
                  
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsLogoutDialogOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors dark:bg-red-950/40 dark:group-hover:bg-red-900/50">
                      <LogOut className="w-4 h-4 text-red-600 dark:text-red-300" />
                    </div>
                    <span className="flex-1 text-left">Logout</span>
                  </button>
                </div>
              </div>,
              document.body
            )}

          {/* Quick Logout Button */}
          <button
            onClick={() => setIsLogoutDialogOpen(true)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 group dark:text-slate-100 dark:hover:bg-red-950/40"
            title="Logout"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform dark:text-slate-100" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="sm:max-w-md rounded-2xl border border-slate-200 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {`Log out${user?.name ? `, ${user.name.split(/\s+/)[0]}` : ""}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your current session will end, and you will need to sign in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
