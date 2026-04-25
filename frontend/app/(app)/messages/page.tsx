"use client";

import { SectionCard } from "@/components/ui/section-card";
import { messagesApi, ordersApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Message, Order } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export default function MessagesPage() {
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
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Messages</h1>

      <SectionCard title="Select an Order Chat">
        <select
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
      </SectionCard>

      <SectionCard title="Conversation">
        {selectedOrderId === null ? <p className="text-sm text-slate-500">Select an order to view chat.</p> : null}
        {selectedOrderId !== null && messagesQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading conversation...</p>
        ) : null}
        {messagesQuery.data?.length ? (
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {messagesQuery.data.map((message) => (
              <li key={message.id} className="rounded-lg border border-slate-200 p-2 text-sm">
                <p className="text-slate-800">{message.content}</p>
                <p className="text-xs text-slate-500">{new Date(message.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        ) : selectedOrderId !== null && !messagesQuery.isLoading ? (
          <p className="text-sm text-slate-500">No messages yet for this order.</p>
        ) : null}

        {selectedOrderId !== null ? (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!content.trim()) {
                return;
              }
              sendMutation.mutate();
            }}
          >
            <input
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Type a message"
            />
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white">
              Send
            </button>
          </form>
        ) : null}
      </SectionCard>
    </div>
  );
}
