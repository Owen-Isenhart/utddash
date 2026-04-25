"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { SectionCard } from "@/components/ui/section-card";
import { ordersApi, ratingsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Order, Rating } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

      return ratingsApi.create({
        order_id: Number(formState.orderId),
        ratee_id: Number(rateeId),
        rating: Number(formState.rating),
        comment: formState.comment,
      });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Ratings</h1>
      </div>
      
      {error ? <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p> : null}

      <SectionCard title="Leave Rating" description="Rate the other participant after an order is completed">
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            createRating.mutate();
          }}
        >
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-foreground">Order</label>
            <select
              value={formState.orderId}
              onChange={(event) => setFormState((old) => ({ ...old, orderId: event.target.value }))}
              className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <option value="">Select completed order</option>
              {completedOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  #{order.id} - {order.location}
                </option>
              ))}
            </select>
            {rateeId && <p className="text-sm text-muted-foreground mt-1">Rating user ID: {rateeId}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Rating</label>
            <select
              value={formState.rating}
              onChange={(event) => setFormState((old) => ({ ...old, rating: event.target.value }))}
              className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Comment</label>
            <Input
              placeholder="Optional feedback"
              value={formState.comment}
              onChange={(event) => setFormState((old) => ({ ...old, comment: event.target.value }))}
            />
          </div>

          <Button
            type="submit"
            className="md:col-span-2 mt-2"
            isLoading={createRating.isPending}
          >
            Submit rating
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="My Ratings">
        {ratingsQuery.data?.length ? (
          <ul className="space-y-3">
            {ratingsQuery.data.map((rating) => (
              <li key={rating.id} className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
                <div className="flex justify-between mb-1">
                  <p className="font-semibold text-foreground">Order #{rating.order_id}</p>
                  <p className="font-bold text-brand">{rating.rating} / 5</p>
                </div>
                {rating.comment ? <p className="text-muted-foreground">{rating.comment}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No ratings yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
