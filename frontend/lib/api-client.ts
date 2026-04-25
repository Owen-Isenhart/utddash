import type {
  AcceptOrderPayload,
  CreateMessagePayload,
  CreateOrderPayload,
  CreateRatingPayload,
  LoginPayload,
  Message,
  Notification,
  Order,
  Rating,
  RegisterPayload,
  UpdateOrderPayload,
  User,
} from "@/lib/types";

interface ApiOptions extends RequestInit {
  skipJson?: boolean;
}

async function apiFetch<T>(path: string, init: ApiOptions = {}): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string; message?: string };
      detail = payload.detail || payload.message || detail;
    } catch {
      // Ignore parse errors.
    }
    throw new Error(detail);
  }

  if (init.skipJson || response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<User> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new Error(data.detail || "Unable to login");
    }

    return (await response.json()) as User;
  },

  async register(payload: RegisterPayload): Promise<User> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new Error(data.detail || "Unable to register");
    }

    return (await response.json()) as User;
  },

  async logout(): Promise<void> {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  },

  async session(): Promise<User | null> {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Unable to fetch session");
    }

    return (await response.json()) as User;
  },
};

export const ordersApi = {
  create(payload: CreateOrderPayload) {
    return apiFetch<Order>("/orders/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  listMine(limit = 25, offset = 0) {
    return apiFetch<Order[]>(`/orders/me?limit=${limit}&offset=${offset}`);
  },
  listOpen(limit = 25, offset = 0) {
    return apiFetch<Order[]>(`/orders/open?limit=${limit}&offset=${offset}`);
  },
  accept(orderId: number, payload: AcceptOrderPayload) {
    return apiFetch<Order>(`/orders/${orderId}/accept`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  update(orderId: number, payload: UpdateOrderPayload) {
    return apiFetch<Order>(`/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  updateLocation(orderId: number, lat: number, lng: number) {
    return apiFetch<Order>(`/orders/${orderId}/location`, {
      method: "PATCH",
      body: JSON.stringify({ lat, lng }),
    });
  },
  arrive(orderId: number) {
    return apiFetch<Order>(`/orders/${orderId}/arrive`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  validateQr(orderId: number, qrToken: string) {
    return apiFetch<Order>(`/orders/${orderId}/validate-qr`, {
      method: "POST",
      body: JSON.stringify({ qr_token: qrToken }),
    });
  },
};

export const messagesApi = {
  list(orderId: number, limit = 50, offset = 0) {
    return apiFetch<Message[]>(`/messages/${orderId}?limit=${limit}&offset=${offset}`);
  },
  create(orderId: number, payload: CreateMessagePayload) {
    return apiFetch<Message>(`/messages/${orderId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export const notificationsApi = {
  list(limit = 50, offset = 0) {
    return apiFetch<Notification[]>(`/notifications/?limit=${limit}&offset=${offset}`);
  },
  markRead(notificationId: number, isRead: boolean) {
    return apiFetch<Notification>(`/notifications/${notificationId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_read: isRead }),
    });
  },
  markAllRead() {
    return apiFetch<{ updated: number }>("/notifications/read-all", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};

export const ratingsApi = {
  list() {
    return apiFetch<Rating[]>("/ratings/");
  },
  create(payload: CreateRatingPayload) {
    return apiFetch<Rating>("/ratings/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export const profileApi = {
  update(payload: Partial<Pick<User, "full_name" | "bio" | "role" | "venmo_handle" | "cashapp_handle" | "zelle_handle">>) {
    return apiFetch<User>("/auth/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
