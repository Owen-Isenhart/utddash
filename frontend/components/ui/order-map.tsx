"use client";

import dynamic from "next/dynamic";
import type { Order } from "@/lib/types";

const OrderMapInner = dynamic(() => import("./order-map-inner"), { ssr: false });

export function OrderMap({ order, isProvider }: { order: Order; isProvider: boolean }) {
  return (
    <div className="mt-4 h-[300px] w-full rounded-lg overflow-hidden border border-slate-300 relative">
      {isProvider && (
        <div className="absolute top-2 left-2 z-10 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm backdrop-blur-sm">
          Click map to update your location
        </div>
      )}
      <OrderMapInner order={order} isProvider={isProvider} />
    </div>
  );
}
