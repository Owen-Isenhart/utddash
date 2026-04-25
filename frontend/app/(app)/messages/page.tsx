"use client";

import { messagesApi, ordersApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Message, Order } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [content, setContent] = useState("");

  const ordersQuery = useQuery<Order[]>({
    queryKey: queryKeys.myOrders(50, 0),
    queryFn: () => ordersApi.listMine(50, 0),
  });

  const availableOrders = useMemo(
    () => (ordersQuery.data || []).filter((order) => order.provider_id !== null),
    [ordersQuery.data],
  );

  const messagesQuery = useQuery<Message[]>({
    queryKey: queryKeys.messages(selectedOrderId as number, 100, 0),
    queryFn: () => messagesApi.list(selectedOrderId as number, 100, 0),
    enabled: selectedOrderId !== null,
  });

  const sendMutation = useMutation({
    mutationFn: () => messagesApi.create(selectedOrderId as number, { content }),
    onSuccess: async () => {
      setContent("");
      await messagesQuery.refetch();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Messages</h1>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-foreground">Select an Order Chat</label>
        <select
          className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          value={selectedOrderId ?? ""}
          onChange={(event) => setSelectedOrderId(Number(event.target.value) || null)}
        >
          <option value="">Choose an order</option>
          {availableOrders.map((order) => (
            <option key={order.id} value={order.id}>
              #{order.id} - {order.location}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col flex-1 h-full min-h-[500px] border border-border rounded-2xl bg-surface p-4 shadow-sm">
        {selectedOrderId === null ? <p className="text-sm text-muted-foreground">Select an order to view chat.</p> : null}
        {selectedOrderId !== null && messagesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading conversation...</p>
        ) : null}
        {messagesQuery.data?.length ? (
          <ul className="flex-1 space-y-4 overflow-y-auto pr-2 mb-4 flex flex-col">
            {messagesQuery.data.map((message) => {
              const isMine = user && message.sender_id === user.id;
              return (
                <li 
                  key={message.id} 
                  className={`rounded-2xl p-4 text-sm w-max max-w-[85%] ${
                    isMine 
                      ? "ml-auto bg-brand text-brand-contrast rounded-br-sm shadow-sm" 
                      : "bg-surface-2 text-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-[10px] mt-1 font-medium opacity-80 ${isMine ? "text-brand-contrast" : "text-muted-foreground"}`}>
                    {new Date(message.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : selectedOrderId !== null && !messagesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">No messages yet for this order.</p>
        ) : null}

        {selectedOrderId !== null ? (
          <form
            className="mt-auto flex gap-3 pt-4 border-t border-border"
            onSubmit={(event) => {
              event.preventDefault();
              if (!content.trim()) {
                return;
              }
              sendMutation.mutate();
            }}
          >
            <Input
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="flex-1"
              placeholder="Type a message"
            />
            <Button type="submit" isLoading={sendMutation.isPending}>
              Send
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
