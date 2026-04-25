"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { SectionCard } from "@/components/ui/section-card";
import { ordersApi, ratingsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Order, Rating } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function RatingsPage() {
  const { user } = useAuth();
  const [formState, setFormState] = useState({ orderId: "", rating: "5", comment: "" });
  const [error, setError] = useState<string | null>(null);

  const ordersQuery = useQuery<Order[]>({
    queryKey: queryKeys.myOrders(100, 0),
    queryFn: () => ordersApi.listMine(100, 0),
    enabled: Boolean(user),
  });

  const ratingsQuery = useQuery<Rating[]>({
    queryKey: queryKeys.ratings,
    queryFn: ratingsApi.list,
  });

  const completedOrders = (ordersQuery.data || []).filter(
    (order) => order.status === "completed" && order.provider_id !== null,
  );

  const selectedOrder = completedOrders.find((order) => order.id === Number(formState.orderId));

  const rateeId = selectedOrder
    ? selectedOrder.buyer_id === user?.id
      ? selectedOrder.provider_id
      : selectedOrder.buyer_id
    : null;

  const createRating = useMutation({
    mutationFn: () => {
      if (!formState.orderId || !rateeId) {
        throw new Error("Pick a completed order to rate");
      }

      return (
      ratingsApi.create({
        order_id: Number(formState.orderId),
        ratee_id: Number(rateeId),
        rating: Number(formState.rating),
        comment: formState.comment,
      })
      );
    },
    onSuccess: async () => {
      setFormState({ orderId: "", rating: "5", comment: "" });
      setError(null);
      await ratingsQuery.refetch();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to submit rating");
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Ratings</h1>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <SectionCard title="Leave Rating">
        <p className="mb-3 text-sm text-slate-600">
          Rate the other participant only after an order is completed.
        </p>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            createRating.mutate();
          }}
        >
          <select
            value={formState.orderId}
            onChange={(event) => setFormState((old) => ({ ...old, orderId: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
          >
            <option value="">Select completed order</option>
            {completedOrders.map((order) => (
              <option key={order.id} value={order.id}>
                #{order.id} - {order.location}
              </option>
            ))}
          </select>

          <p className="text-sm text-slate-600 md:col-span-2">
            Rating user ID: {rateeId ?? "-"}
          </p>

          <select
            value={formState.rating}
            onChange={(event) => setFormState((old) => ({ ...old, rating: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
          <input
            placeholder="Comment"
            value={formState.comment}
            onChange={(event) => setFormState((old) => ({ ...old, comment: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={createRating.isPending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60 md:col-span-2"
          >
            {createRating.isPending ? "Submitting..." : "Submit rating"}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="My Ratings">
        {ratingsQuery.data?.length ? (
          <ul className="space-y-2">
            {ratingsQuery.data.map((rating) => (
              <li key={rating.id} className="rounded-lg border border-slate-200 p-2 text-sm">
                <p>
                  Order #{rating.order_id} • {rating.rating}/5
                </p>
                {rating.comment ? <p className="text-slate-600">{rating.comment}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No ratings yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
