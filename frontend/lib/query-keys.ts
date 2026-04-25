export const queryKeys = {
  session: ["session"] as const,
  myOrders: (limit = 25, offset = 0) => ["orders", "mine", limit, offset] as const,
  openOrders: (limit = 25, offset = 0) => ["orders", "open", limit, offset] as const,
  messages: (orderId: number, limit = 50, offset = 0) =>
    ["messages", orderId, limit, offset] as const,
  notifications: (limit = 50, offset = 0) => ["notifications", limit, offset] as const,
  ratings: ["ratings"] as const,
};
