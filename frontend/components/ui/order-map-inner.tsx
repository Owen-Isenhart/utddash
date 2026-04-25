"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api-client";
import type { Order } from "@/lib/types";

// Fix for default Leaflet icon paths in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// UTD campus coordinates as default
const DEFAULT_CENTER: [number, number] = [32.9858, -96.7501];

function MapClickHandler({ 
  orderId, 
  isProvider, 
  onLocationUpdate 
}: { 
  orderId: number; 
  isProvider: boolean;
  onLocationUpdate: (lat: number, lng: number) => void;
}) {
  const queryClient = useQueryClient();
  const updateLocationMutation = useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) => ordersApi.updateLocation(orderId, lat, lng),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      console.error("Failed to update location:", error);
    }
  });

  useMapEvents({
    click(e) {
      if (isProvider) {
        onLocationUpdate(e.latlng.lat, e.latlng.lng);
        updateLocationMutation.mutate({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });

  return null;
}

export default function OrderMapInner({ order, isProvider }: { order: Order; isProvider: boolean }) {
  const [localProviderLoc, setLocalProviderLoc] = useState<{lat: number, lng: number} | null>(
    order.provider_lat !== null && order.provider_lng !== null 
      ? { lat: order.provider_lat, lng: order.provider_lng } 
      : null
  );

  useEffect(() => {
    if (order.provider_lat !== null && order.provider_lng !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalProviderLoc({ lat: order.provider_lat, lng: order.provider_lng });
    }
  }, [order.provider_lat, order.provider_lng]);

  const hasProviderLocation = localProviderLoc !== null;
  const center: [number, number] = hasProviderLocation
    ? [localProviderLoc.lat, localProviderLoc.lng]
    : DEFAULT_CENTER;

  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if (mapRef.current && hasProviderLocation) {
      mapRef.current.setView(center, mapRef.current.getZoom());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], hasProviderLocation]);

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {hasProviderLocation && (
        <Marker position={[localProviderLoc.lat, localProviderLoc.lng]}>
          <Popup>Provider Location</Popup>
        </Marker>
      )}

      {isProvider && (
        <MapClickHandler 
          orderId={order.id} 
          isProvider={isProvider} 
          onLocationUpdate={(lat, lng) => setLocalProviderLoc({ lat, lng })}
        />
      )}
    </MapContainer>
  );
}
