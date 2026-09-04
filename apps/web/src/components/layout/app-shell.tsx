import { createContext, useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";

import { useAuth } from "../../auth/use-auth";
import { Icon } from "../ui/icons";

type AppShellProps = {
  children: React.ReactNode;
};

type AppShellContextValue = {
  openMobileNavigation: () => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

const navItems = [
  { label: "Overview", icon: "overview", to: "/dashboard" },
  { label: "Applications", icon: "applications", to: "/applications" },
  { label: "Analytics", icon: "analytics", to: "/analytics" },
  { label: "Settings", icon: "settings", to: "/settings" },
];

export function AppShell({ children }: AppShellProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const sidebarWidth = isCollapsed ? "lg:pl-[72px]" : "lg:pl-64";
  const displayName = user?.name?.trim() || user?.email || "HYRD user";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <AppShellContext.Provider
      value={{ openMobileNavigation: () => setIsMobileOpen(true) }}
    >
      <div className="min-h-screen overflow-x-hidden bg-hyrd-page text-hyrd-text">
      {isMobileOpen ? (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-hyrd-deep/40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-auto bg-hyrd-navy text-white transition-[transform,width] duration-200 ${
          isCollapsed ? "lg:w-[72px]" : "lg:w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} w-64`}
      >
        <div className="flex items-center justify-between px-4 py-5">
          <Link
            className={`overflow-hidden font-semibold tracking-[0.14em] text-white focus:outline-none focus:ring-2 focus:ring-hyrd-gold ${
              isCollapsed ? "lg:text-lg" : "text-xl"
            }`}
            to="/dashboard"
          >
            {isCollapsed ? "H" : "HYRD"}
          </Link>
          <button
            aria-label="Close navigation"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-hyrd-gold lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            type="button"
          >
            <Icon className="h-4 w-4" name="close" />
          </button>
          <button
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-9 w-9 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-hyrd-gold lg:grid"
            onClick={() => setIsCollapsed((current) => !current)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            type="button"
          >
            <Icon
              className={`h-4 w-4 transition ${isCollapsed ? "rotate-180" : ""}`}
              name="chevron"
            />
          </button>
        </div>

        <nav aria-label="Dashboard" className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-hyrd-gold ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/7 hover:text-white"
                } ${isCollapsed ? "lg:justify-center" : ""}`
              }
              key={item.label}
              onClick={() => setIsMobileOpen(false)}
              title={isCollapsed ? item.label : undefined}
              to={item.to}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" name={item.icon} />
              <span className={isCollapsed ? "lg:sr-only" : ""}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 p-4">
          <div
            className={`flex items-center gap-3 ${
              isCollapsed ? "lg:justify-center" : ""
            }`}
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-sm font-semibold">
              {initials || "H"}
            </div>
            <div className={isCollapsed ? "lg:sr-only" : ""}>
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-slate-300">Personal workspace</p>
            </div>
          </div>
          <button
            className={`mt-4 flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-hyrd-gold ${
              isCollapsed ? "w-full lg:justify-center" : "w-full"
            }`}
            title={isCollapsed ? "Logout" : undefined}
            onClick={handleLogout}
            type="button"
          >
            <Icon className="h-4 w-4" name="logout" />
            <span className={isCollapsed ? "lg:sr-only" : ""}>Logout</span>
          </button>
        </div>
      </aside>

      <div className={`min-h-screen transition-[padding] duration-200 ${sidebarWidth}`}>
        {children}
      </div>
      </div>
    </AppShellContext.Provider>
  );
}

export function PageHeader({
  action,
  title,
}: {
  action?: React.ReactNode;
  title: string;
}) {
  const context = useContext(AppShellContext);

  return (
    <header className="border-b border-hyrd-border bg-white px-4 py-3 sm:px-7 sm:py-5 lg:px-7">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-2xl font-semibold text-hyrd-text">
          {title}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          <button
            aria-label="Open navigation"
            className="grid h-11 w-11 place-items-center rounded-lg border border-hyrd-border bg-white text-hyrd-text shadow-sm focus:outline-none focus:ring-2 focus:ring-hyrd-gold lg:hidden"
            onClick={context?.openMobileNavigation}
            title="Open navigation"
            type="button"
          >
            <Icon className="h-5 w-5" name="menu" />
          </button>
        </div>
      </div>
    </header>
  );
}
