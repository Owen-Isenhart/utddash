"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { APP_ROUTES } from "@/lib/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Home,
  ClipboardList,
  MessageSquare,
  User,
  Bell,
  Star,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { href: APP_ROUTES.dashboard, label: "Home", icon: Home },
  { href: APP_ROUTES.orders, label: "Orders", icon: ClipboardList },
  { href: APP_ROUTES.messages, label: "Messages", icon: MessageSquare },
  { href: APP_ROUTES.notifications, label: "Notifications", icon: Bell, desktopOnly: true },
  { href: APP_ROUTES.ratings, label: "Ratings", icon: Star, desktopOnly: true },
  { href: APP_ROUTES.profile, label: "Profile", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, loggingOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground flex-col md:flex-row pb-16 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-surface p-4 sticky top-0 h-screen shrink-0 shadow-sm">
        <div className="mb-8 px-2 flex items-center justify-between">
          <p className="text-xl font-bold tracking-tight text-brand">UTDDash</p>
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-surface-2 transition-all duration-200 text-muted-foreground cursor-pointer active:scale-90"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  active
                    ? "bg-brand text-brand-contrast shadow-sm"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <Icon size={20} className={active ? "text-brand-contrast" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          <div className="px-3 py-2 text-sm font-medium text-foreground truncate">
            {user?.full_name || "Loading..."}
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-danger hover:bg-danger/10 transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <LogOut size={20} />
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-md">
          <p className="text-lg font-bold text-brand">UTDDash</p>
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-surface-2 transition-all duration-200 text-muted-foreground cursor-pointer active:scale-90"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
        </header>

        <div className="flex-1 p-4 md:p-8 w-full max-w-5xl mx-auto">{children}</div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems
            .filter((item) => !item.desktopOnly)
            .map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 min-w-[4rem] transition-all duration-200 cursor-pointer active:scale-95 ${
                    active ? "text-brand" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={24} className={active ? "fill-brand/20" : ""} />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </Link>
              );
            })}
        </div>
      </nav>
    </div>
  );
}
