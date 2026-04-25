"use client";

import { SectionCard } from "@/components/ui/section-card";
import { notificationsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Notification } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
      </div>

      <SectionCard title="Inbox">
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            isLoading={markAll.isPending}
          >
            Mark all as read
          </Button>
        </div>

        {notifications.data?.length ? (
          <ul className="space-y-3">
            {notifications.data.map((notification) => (
              <li
                key={notification.id}
                className={`rounded-xl border p-4 transition-colors ${
                  notification.is_read ? "bg-surface border-border opacity-70" : "bg-brand/5 border-brand/20 shadow-sm"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{notification.message}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(notification.created_at).toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => markOne.mutate({ id: notification.id, isRead: !notification.is_read })}
                    className="font-semibold text-brand hover:underline"
                  >
                    {notification.is_read ? "Mark unread" : "Mark read"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No notifications yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
