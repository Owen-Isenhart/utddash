"use client";

import { SectionCard } from "@/components/ui/section-card";
import { notificationsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Notification } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const notifications = useQuery<Notification[]>({
    queryKey: queryKeys.notifications(),
    queryFn: () => notificationsApi.list(),
  });

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });

  const markOne = useMutation({
    mutationFn: ({ id, isRead }: { id: number; isRead: boolean }) =>
      notificationsApi.markRead(id, isRead),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>

      <SectionCard title="Inbox">
        <button
          type="button"
          onClick={() => markAll.mutate()}
          className="mb-3 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          Mark all as read
        </button>

        {notifications.data?.length ? (
          <ul className="space-y-2">
            {notifications.data.map((notification) => (
              <li key={notification.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-sm text-slate-800">{notification.message}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{new Date(notification.created_at).toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => markOne.mutate({ id: notification.id, isRead: !notification.is_read })}
                    className="rounded bg-slate-100 px-2 py-1"
                  >
                    {notification.is_read ? "Mark unread" : "Mark read"}
                  </button>
                </div>
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
