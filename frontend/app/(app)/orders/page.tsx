"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { SectionCard } from "@/components/ui/section-card";
import { ordersApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Order } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { OrderMap } from "@/components/ui/order-map";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function OrdersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    location: "",
    items: "",
    delivery_instructions: "",
    max_price: "",
  });
  const [qrInputs, setQrInputs] = useState<Record<number, string>>({});

  const myOrders = useQuery<Order[]>({
    queryKey: queryKeys.myOrders(),
    queryFn: () => ordersApi.listMine(),
  });

  const openOrders = useQuery<Order[]>({
    queryKey: queryKeys.openOrders(),
    queryFn: () => ordersApi.listOpen(),
    enabled: user?.role === "provider" || user?.role === "both",
  });

  const acceptMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.accept(orderId, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      setError(null);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to accept order");
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      ordersApi.create({
        location: createForm.location,
        items: createForm.items,
        delivery_instructions: createForm.delivery_instructions || undefined,
        max_price: Number(createForm.max_price),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      setCreateForm({ location: "", items: "", delivery_instructions: "", max_price: "" });
      setError(null);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to create order");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: "in_progress" | "delivered" }) =>
      ordersApi.update(orderId, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      setError(null);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to update order status");
    },
  });

  const arriveMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.arrive(orderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      setError(null);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to mark arrived");
    },
  });

  const validateQrMutation = useMutation({
    mutationFn: ({ orderId, token }: { orderId: number; token: string }) =>
      ordersApi.validateQr(orderId, token),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      setQrInputs((old) => ({ ...old, [variables.orderId]: "" }));
      setError(null);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to validate QR token");
    },
  });

  function isProviderForOrder(order: Order): boolean {
    return Boolean(user && order.provider_id === user.id);
  }

  function isBuyerForOrder(order: Order): boolean {
    return Boolean(user && order.buyer_id === user.id);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {(user?.role === "buyer" || user?.role === "both") && (
        <SectionCard title="Create Request" description="Post a new meal request for providers">
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate();
            }}
          >
            <input
              value={createForm.location}
              onChange={(event) => setCreateForm((old) => ({ ...old, location: event.target.value }))}
              placeholder="Pickup location"
              className="rounded-lg border border-slate-300 px-3 py-2"
              required
            />
            <input
              value={createForm.max_price}
              onChange={(event) => setCreateForm((old) => ({ ...old, max_price: event.target.value }))}
              placeholder="Max price"
              type="number"
              step="0.01"
              className="rounded-lg border border-slate-300 px-3 py-2"
              required
            />
            <input
              value={createForm.items}
              onChange={(event) => setCreateForm((old) => ({ ...old, items: event.target.value }))}
              placeholder="Items requested"
              className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
              required
            />
            <input
              value={createForm.delivery_instructions}
              onChange={(event) =>
                setCreateForm((old) => ({ ...old, delivery_instructions: event.target.value }))
              }
              placeholder="Delivery instructions"
              className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white md:col-span-2"
            >
              {createMutation.isPending ? "Creating..." : "Create order"}
            </button>
          </form>
        </SectionCard>
      )}

      <SectionCard title="My Orders" description="Orders where you are buyer or provider">
        {myOrders.isLoading ? <p className="text-sm text-slate-500">Loading...</p> : null}
        {myOrders.data?.length ? (
          <ul className="space-y-2">
            {myOrders.data.map((order) => (
              <li key={order.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="font-medium text-slate-900">#{order.id} • {order.location}</p>
                <p className="text-sm text-slate-600">{order.status} • ${order.agreed_price ?? order.max_price}</p>
                <p className="text-sm text-slate-600">{order.items}</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {isProviderForOrder(order) && order.status === "accepted" && (
                    <button
                      type="button"
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white"
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "in_progress" })}
                      disabled={updateStatusMutation.isPending}
                    >
                      Start delivery
                    </button>
                  )}

                  {isProviderForOrder(order) && order.status === "in_progress" && (
                    <button
                      type="button"
                      className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white"
                      onClick={() => arriveMutation.mutate(order.id)}
                      disabled={arriveMutation.isPending}
                    >
                      Mark arrived & generate QR
                    </button>
                  )}
                </div>

                {(order.status === "accepted" || order.status === "in_progress" || order.status === "delivered") && (
                  <OrderMap order={order} isProvider={isProviderForOrder(order)} />
                )}

                {isProviderForOrder(order) && order.status === "delivered" && order.qr_token && (
                  <div className="mt-4 flex flex-col items-center rounded-lg bg-white p-4 shadow-sm border border-slate-200">
                    <p className="mb-4 text-sm font-medium text-slate-700">
                      Show this QR Code to the buyer to complete delivery
                    </p>
                    <QRCodeSVG value={order.qr_token} size={200} />
                    <p className="mt-4 text-xs text-slate-500 font-mono">
                      Token fallback: {order.qr_token}
                    </p>
                  </div>
                )}

                {isBuyerForOrder(order) && order.status === "delivered" && (
                  <div className="mt-4 space-y-4 rounded-lg bg-slate-50 p-4 border border-slate-200">
                    <p className="text-sm font-medium text-slate-800">Scan Provider's QR Code</p>
                    <div className="overflow-hidden rounded-lg border border-slate-300 bg-black max-w-sm mx-auto">
                      <Scanner
                        onScan={(result) => {
                          if (result.length > 0 && result[0].rawValue && !validateQrMutation.isPending) {
                            validateQrMutation.mutate({ orderId: order.id, token: result[0].rawValue });
                          }
                        }}
                        allowMultiple={false}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-slate-300"></div>
                      <span className="text-xs text-slate-500 uppercase font-medium">Or enter token manually</span>
                      <div className="h-px flex-1 bg-slate-300"></div>
                    </div>

                    <form
                      className="flex flex-wrap gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const token = qrInputs[order.id] || "";
                        if (!token.trim()) {
                          return;
                        }
                        validateQrMutation.mutate({ orderId: order.id, token });
                      }}
                    >
                      <input
                        value={qrInputs[order.id] || ""}
                        onChange={(event) =>
                          setQrInputs((old) => ({ ...old, [order.id]: event.target.value }))
                        }
                        placeholder="Enter provider QR token"
                        className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={validateQrMutation.isPending}
                        className="rounded-lg bg-indigo-700 px-3 py-1.5 text-sm font-semibold text-white"
                      >
                        Complete order
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No orders yet.</p>
        )}
      </SectionCard>

      {openOrders.isSuccess ? (
        <SectionCard title="Open Requests" description="Available to providers">
          {openOrders.data.length ? (
            <ul className="space-y-2">
              {openOrders.data.map((order) => (
                <li key={order.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="font-medium text-slate-900">#{order.id} • {order.location}</p>
                  <p className="text-sm text-slate-600">{order.items}</p>
                  <p className="text-sm text-slate-600">Max ${order.max_price}</p>
                  <button
                    type="button"
                    onClick={() => acceptMutation.mutate(order.id)}
                    disabled={acceptMutation.isPending}
                    className="mt-2 rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    Accept order
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No open requests right now.</p>
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}
