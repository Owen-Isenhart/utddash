export type UserRole = "provider" | "buyer" | "both";

export type OrderStatus =
  | "requested"
  | "accepted"
  | "in_progress"
  | "delivered"
  | "completed";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_verified: boolean;
  rating_avg: number;
  total_earnings: number;
  total_savings: number;
  token_balance: number;
  current_lat: number | null;
  current_lng: number | null;
  bio: string | null;
  venmo_handle: string | null;
  cashapp_handle: string | null;
  zelle_handle: string | null;
}

export interface Order {
  id: number;
  buyer_id: number;
  provider_id: number | null;
  location: string;
  items: string;
  delivery_instructions: string | null;
  max_price: number;
  agreed_price: number | null;
  status: OrderStatus;
  qr_token: string | null;
  qr_expiration: string | null;
  qr_verified_at: string | null;
  provider_lat: number | null;
  provider_lng: number | null;
  buyer_lat: number | null;
  buyer_lng: number | null;
  route_geojson: string | null;
  created_at: string;
  updated_at: string;
  delivery_time: string | null;
}

export interface Message {
  id: number;
  order_id: number;
  buyer_id: number;
  provider_id: number;
  content: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  order_id: number | null;
  message: string;
  event_type: string;
  is_read: boolean;
  created_at: string;
}

export interface Rating {
  id: number;
  order_id: number;
  rater_id: number;
  ratee_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  venmo_handle?: string;
  cashapp_handle?: string;
  zelle_handle?: string;
}

export interface CreateOrderPayload {
  location: string;
  items: string;
  delivery_instructions?: string;
  max_price: number;
  delivery_time?: string;
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  agreed_price?: number;
}

export interface AcceptOrderPayload {
  agreed_price?: number;
}

export interface CreateMessagePayload {
  content: string;
}

export interface CreateRatingPayload {
  order_id: number;
  ratee_id: number;
  rating: number;
  comment?: string;
}
