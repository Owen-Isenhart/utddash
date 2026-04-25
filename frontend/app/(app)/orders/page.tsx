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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  const [scanningOrderId, setScanningOrderId] = useState<number | null>(null);
  const [myOrdersLimit, setMyOrdersLimit] = useState(5);
  const [openOrdersLimit, setOpenOrdersLimit] = useState(5);

  const myOrders = useQuery<Order[]>({
    queryKey: queryKeys.myOrders(myOrdersLimit, 0),
    queryFn: () => ordersApi.listMine(myOrdersLimit, 0),
  });

  const openOrders = useQuery<Order[]>({
    queryKey: queryKeys.openOrders(openOrdersLimit, 0),
    queryFn: () => ordersApi.listOpen(openOrdersLimit, 0),
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Orders</h1>
      </div>
      
      {error ? <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p> : null}

      {(user?.role === "buyer" || user?.role === "both") && (
        <SectionCard title="Create Request" description="Post a new meal request for providers">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate();
            }}
          >
            <Input
              value={createForm.location}
              onChange={(event) => setCreateForm((old) => ({ ...old, location: event.target.value }))}
              placeholder="Pickup location"
              required
            />
            <Input
              value={createForm.max_price}
              onChange={(event) => setCreateForm((old) => ({ ...old, max_price: event.target.value }))}
              placeholder="Max price"
              type="number"
              step="0.01"
              required
            />
            <Input
              value={createForm.items}
              onChange={(event) => setCreateForm((old) => ({ ...old, items: event.target.value }))}
              placeholder="Items requested"
              className="md:col-span-2"
              required
            />
            <Input
              value={createForm.delivery_instructions}
              onChange={(event) =>
                setCreateForm((old) => ({ ...old, delivery_instructions: event.target.value }))
              }
              placeholder="Delivery instructions"
              className="md:col-span-2"
            />
            <Button
              type="submit"
              className="md:col-span-2"
              isLoading={createMutation.isPending}
            >
              Create order
            </Button>
          </form>
        </SectionCard>
      )}

      <div className="pt-2">
        <div className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">My Orders</h2>
          <p className="text-sm text-muted-foreground">Orders where you are buyer or provider</p>
        </div>
        {myOrders.isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
        {myOrders.data?.length ? (
          <ul className="space-y-6">
            {myOrders.data.map((order) => (
              <li key={order.id} className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-lg text-foreground">#{order.id} • {order.location}</p>
                    <p className="text-sm text-muted-foreground font-medium">${order.agreed_price ?? order.max_price}</p>
                  </div>
                  <Badge variant={order.status === "delivered" ? "default" : "brand"}>{order.status}</Badge>
                </div>
                <p className="text-foreground">{order.items}</p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {isProviderForOrder(order) && order.status === "accepted" && (
                    <Button
                      variant="primary"
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "in_progress" })}
                      isLoading={updateStatusMutation.isPending}
                    >
                      Start delivery
                    </Button>
                  )}

                  {isProviderForOrder(order) && order.status === "in_progress" && (
                    <Button
                      variant="primary"
                      onClick={() => arriveMutation.mutate(order.id)}
                      isLoading={arriveMutation.isPending}
                    >
                      Mark arrived & generate QR
                    </Button>
                  )}
                </div>

                {(order.status === "accepted" || order.status === "in_progress" || order.status === "delivered") && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-border">
                    <OrderMap order={order} isProvider={isProviderForOrder(order)} />
                  </div>
                )}

                {isProviderForOrder(order) && order.status === "delivered" && order.qr_token && (
                  <div className="mt-6 flex flex-col items-center rounded-xl bg-surface p-6 shadow-sm border border-border">
                    <p className="mb-6 text-sm font-semibold text-foreground text-center">
                      Show this QR Code to the buyer to complete delivery
                    </p>
                    <div className="p-4 bg-white rounded-xl">
                      <QRCodeSVG value={order.qr_token} size={200} />
                    </div>
                    <p className="mt-6 text-xs text-muted-foreground font-mono bg-surface-2 px-3 py-1.5 rounded-lg">
                      Token fallback: {order.qr_token}
                    </p>
                  </div>
                )}

                {isBuyerForOrder(order) && order.status === "delivered" && (
                  <div className="mt-6 space-y-5 rounded-xl bg-surface p-5 border border-border">
                    {scanningOrderId === order.id ? (
                      <>
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-foreground text-center">Scan Provider&apos;s QR Code</p>
                          <Button variant="ghost" size="sm" onClick={() => setScanningOrderId(null)}>Cancel</Button>
                        </div>
                        <div className="overflow-hidden rounded-xl border-2 border-brand/20 bg-black max-w-sm mx-auto shadow-sm">
                          <Scanner
                            onScan={(result) => {
                              if (result.length > 0 && result[0].rawValue && !validateQrMutation.isPending) {
                                validateQrMutation.mutate({ orderId: order.id, token: result[0].rawValue });
                                setScanningOrderId(null);
                              }
                            }}
                            allowMultiple={false}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <p className="font-semibold text-foreground text-center">Ready to complete delivery?</p>
                        <Button onClick={() => setScanningOrderId(order.id)}>Open QR Scanner</Button>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-border"></div>
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Or enter token manually</span>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>

                    <form
                      className="flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const token = qrInputs[order.id] || "";
                        if (!token.trim()) {
                          return;
                        }
                        validateQrMutation.mutate({ orderId: order.id, token });
                      }}
                    >
                      <Input
                        value={qrInputs[order.id] || ""}
                        onChange={(event) =>
                          setQrInputs((old) => ({ ...old, [order.id]: event.target.value }))
                        }
                        placeholder="Enter provider QR token"
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={validateQrMutation.isPending}
                      >
                        Complete
                      </Button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        )}
        {myOrders.data?.length === myOrdersLimit && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={() => setMyOrdersLimit((prev) => prev + 5)}>
              Show more
            </Button>
          </div>
        )}
      </div>

      {openOrders.isSuccess ? (
        <div className="pt-2 border-t border-border">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Open Requests</h2>
            <p className="text-sm text-muted-foreground">Available to providers</p>
          </div>
          {openOrders.data.length ? (
            <ul className="space-y-3">
              {openOrders.data.map((order) => (
                <li key={order.id} className="rounded-xl border border-border bg-surface-2 p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <p className="font-semibold text-foreground">#{order.id} • {order.location}</p>
                    <p className="text-foreground mt-1">{order.items}</p>
                    <p className="text-sm text-brand font-bold mt-1">Max ${order.max_price}</p>
                  </div>
                  <Button
                    onClick={() => acceptMutation.mutate(order.id)}
                    isLoading={acceptMutation.isPending}
                    className="w-full sm:w-auto shrink-0"
                  >
                    Accept order
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No open requests right now.</p>
          )}
          {openOrders.data?.length === openOrdersLimit && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={() => setOpenOrdersLimit((prev) => prev + 5)}>
                Show more
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
