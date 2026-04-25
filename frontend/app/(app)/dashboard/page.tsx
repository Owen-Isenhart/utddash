"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { SectionCard } from "@/components/ui/section-card";
import { queryKeys } from "@/lib/query-keys";
import type { Notification, Order } from "@/lib/types";
import { notificationsApi, ordersApi } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user } = useAuth();

  const myOrders = useQuery<Order[]>({
    queryKey: queryKeys.myOrders(5, 0),
    queryFn: () => ordersApi.listMine(5, 0),
    enabled: Boolean(user),
  });

  const notifications = useQuery<Notification[]>({
    queryKey: queryKeys.notifications(5, 0),
    queryFn: () => notificationsApi.list(5, 0),
    enabled: Boolean(user),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {user?.full_name}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="brand" className="uppercase tracking-wide">{user?.role}</Badge>
          <span>Token balance: <strong className="text-foreground">{user?.token_balance.toFixed(2)}</strong></span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Earnings" description="Provider revenue">
          <p className="text-3xl font-bold text-foreground">${(user?.total_earnings ?? 0).toFixed(2)}</p>
        </SectionCard>
        <SectionCard title="Savings" description="Buyer savings">
          <p className="text-3xl font-bold text-foreground">${(user?.total_savings ?? 0).toFixed(2)}</p>
        </SectionCard>
        <SectionCard title="Rating" description="Current average">
          <p className="text-3xl font-bold text-foreground">{(user?.rating_avg ?? 0).toFixed(2)} <span className="text-muted-foreground text-lg font-normal">/ 5</span></p>
        </SectionCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard title="Recent Orders">
          {myOrders.isLoading ? <p className="text-sm text-muted-foreground">Loading orders...</p> : null}
          {myOrders.data?.length ? (
            <ul className="space-y-3">
              {myOrders.data.map((order) => (
                <li key={order.id} className="rounded-xl border border-border bg-surface-2/50 px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">#{order.id} • {order.location}</p>
                    <p className="text-sm text-muted-foreground">${order.agreed_price ?? order.max_price}</p>
                  </div>
                  <Badge variant={order.status === "delivered" ? "default" : "brand"}>{order.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recent orders.</p>
          )}
        </SectionCard>

        <SectionCard title="Latest Notifications">
          {notifications.isLoading ? <p className="text-sm text-muted-foreground">Loading notifications...</p> : null}
          {notifications.data?.length ? (
            <ul className="space-y-3">
              {notifications.data.map((notification) => (
                <li key={notification.id} className="rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm text-foreground">
                  {notification.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
