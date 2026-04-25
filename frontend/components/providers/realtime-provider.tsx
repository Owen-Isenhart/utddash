"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

type EventPayload = {
  event: string;
  data: {
    order_id?: number;
  };
};

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    let cancelled = false;
    let reconnectTimer: number | null = null;

    async function connect() {
      try {
        const response = await fetch("/api/auth/ws-token", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok || cancelled) {
          return;
        }

        const payload = (await response.json()) as { wsUrl: string };
        if (!payload.wsUrl) {
          return;
        }

        const socket = new WebSocket(payload.wsUrl);
        socketRef.current = socket;

        socket.onmessage = (messageEvent) => {
          try {
            const event = JSON.parse(messageEvent.data) as EventPayload;
            handleEvent(event);
          } catch {
            // Ignore malformed websocket payloads.
          }
        };

        socket.onclose = () => {
          if (cancelled) {
            return;
          }

          reconnectTimer = window.setTimeout(() => {
            connect();
          }, 2500);
        };
      } catch {
        if (!cancelled) {
          reconnectTimer = window.setTimeout(() => {
            connect();
          }, 2500);
        }
      }
    }

    function handleEvent(event: EventPayload) {
      if (event.event.startsWith("order.")) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }

      if (event.event === "order.message" && event.data.order_id) {
        queryClient.invalidateQueries({ queryKey: ["messages", event.data.order_id] });
      }

      if (event.event === "order.accepted" || event.event === "order.status" || event.event === "order.arrived") {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }

      if (event.event === "order.completed") {
        queryClient.invalidateQueries({ queryKey: ["ratings"] });
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [queryClient, user]);

  return <>{children}</>;
}
