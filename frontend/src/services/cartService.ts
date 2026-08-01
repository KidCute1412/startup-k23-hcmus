import { apiClient } from "@/lib/apiClient";
import type { BatchCheckoutRequest, BatchCheckoutResponse, Cart, CartItem } from "@/types/cart";

export const cartService = {
  get: () => apiClient<Cart>("/cart"),
  upsertItem: (gearId: string, startDate: string, endDate: string) =>
    apiClient<CartItem>(`/cart/items/${encodeURIComponent(gearId)}`, {
      method: "PUT",
      body: JSON.stringify({ startDate, endDate }),
    }),
  removeItem: (itemId: string) =>
    apiClient<Cart>(`/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" }),
  clear: () => apiClient<Cart>("/cart", { method: "DELETE" }),
  checkout: (request: BatchCheckoutRequest) =>
    apiClient<BatchCheckoutResponse>("/rental-orders/batch", {
      method: "POST",
      body: JSON.stringify(request),
    }),
};
