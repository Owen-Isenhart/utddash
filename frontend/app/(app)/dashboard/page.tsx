"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { SectionCard } from "@/components/ui/section-card";
import { queryKeys } from "@/lib/query-keys";
import type { Notification, Order } from "@/lib/types";
import { notificationsApi, ordersApi } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.full_name}</h1>
        <p className="text-sm text-slate-600">Role: {user?.role} • Token balance: {user?.token_balance.toFixed(2)}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Earnings" description="Provider revenue">
          <p className="text-2xl font-semibold text-slate-900">${(user?.total_earnings ?? 0).toFixed(2)}</p>
        </SectionCard>
        <SectionCard title="Savings" description="Buyer savings">
          <p className="text-2xl font-semibold text-slate-900">${(user?.total_savings ?? 0).toFixed(2)}</p>
        </SectionCard>
        <SectionCard title="Rating" description="Current average">
          <p className="text-2xl font-semibold text-slate-900">{(user?.rating_avg ?? 0).toFixed(2)} / 5</p>
        </SectionCard>
      </div>

      <SectionCard title="Recent Orders">
        {myOrders.isLoading ? <p className="text-sm text-slate-500">Loading orders...</p> : null}
        {myOrders.data?.length ? (
          <ul className="space-y-2">
            {myOrders.data.map((order) => (
              <li key={order.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">#{order.id} • {order.location}</p>
                <p className="text-sm text-slate-600">{order.status} • ${order.agreed_price ?? order.max_price}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </SectionCard>

      <SectionCard title="Latest Notifications">
        {notifications.isLoading ? <p className="text-sm text-slate-500">Loading notifications...</p> : null}
        {notifications.data?.length ? (
          <ul className="space-y-2">
            {notifications.data.map((notification) => (
              <li key={notification.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {notification.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No notifications yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
