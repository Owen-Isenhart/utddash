"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { APP_ROUTES } from "@/lib/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: APP_ROUTES.dashboard, label: "Dashboard" },
  { href: APP_ROUTES.orders, label: "Orders" },
  { href: APP_ROUTES.messages, label: "Messages" },
  { href: APP_ROUTES.notifications, label: "Notifications" },
  { href: APP_ROUTES.ratings, label: "Ratings" },
  { href: APP_ROUTES.profile, label: "Profile" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, loggingOut } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f6fbf6_0%,#d9ebe5_38%,#f2efe6_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-300/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-700">UTDDash</p>
            <p className="text-sm text-slate-600">{user?.full_name || "Loading..."}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr] md:px-6">
        <aside className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <nav className="flex flex-wrap gap-2 md:flex-col">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-teal-700 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="rounded-2xl border border-slate-200 bg-white/90 p-5 md:p-6">{children}</main>
      </div>
    </div>
  );
}
