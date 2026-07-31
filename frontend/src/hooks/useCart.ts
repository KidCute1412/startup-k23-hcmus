"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/apiClient";
import { cartService } from "@/services/cartService";
import type { BatchCheckoutRequest, Cart } from "@/types/cart";
import type { User } from "@/types/auth";

const messages: Record<string, string> = {
  INVALID_DATE_RANGE: "Khoảng ngày thuê không hợp lệ.",
  GEAR_NOT_AVAILABLE: "Gear hiện không thể cho thuê.",
  CANNOT_RENT_OWN_GEAR: "Bạn không thể thuê gear của chính mình.",
  GEAR_UNAVAILABLE_FOR_PERIOD: "Gear đã có lịch thuê trùng khoảng ngày này.",
  CART_ITEM_NOT_FOUND: "Sản phẩm không còn trong giỏ hàng.",
  RENTER_ONLY: "Chỉ tài khoản người thuê mới sử dụng được giỏ hàng.",
};

function currentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function errorText(error: unknown) {
  return error instanceof ApiError && error.code
    ? (messages[error.code] ?? "Không thể xử lý giỏ hàng.")
    : "Không thể kết nối tới giỏ hàng.";
}

export function useCartState() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<User["role"] | null>(null);

  const resetForAuth = useCallback(() => {
    localStorage.removeItem("mutux_cart");
    localStorage.removeItem("mutux_cart_selected");
    const user = currentUser();
    setRole(user?.role ?? null);
    setCart(null);
    setSelectedItemIds([]);
    setError(null);
    if (user?.role !== "renter") setLoading(false);
    return user;
  }, []);

  const refetch = useCallback(async () => {
    const user = currentUser();
    if (user?.role !== "renter") {
      setCart(null);
      setSelectedItemIds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await cartService.get();
      setCart(next);
      setSelectedItemIds((ids) =>
        ids.filter((id) =>
          next.items.some((item) => item.id === id && item.availability.eligible),
        ),
      );
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const user = resetForAuth();
      if (user?.role === "renter") void refetch();
    };
    sync();
    window.addEventListener("auth:changed", sync);
    return () => window.removeEventListener("auth:changed", sync);
  }, [refetch, resetForAuth]);

  const mutate = useCallback(async <T,>(operation: () => Promise<T>) => {
    setMutating(true);
    setError(null);
    try {
      return await operation();
    } catch (cause) {
      setError(errorText(cause));
      throw cause;
    } finally {
      setMutating(false);
    }
  }, []);

  const upsertItem = useCallback((gearId: string, startDate: string, endDate: string) =>
    mutate(async () => {
      const item = await cartService.upsertItem(gearId, startDate, endDate);
      await refetch();
      return item;
    }), [mutate, refetch]);

  const removeItem = useCallback((id: string) => mutate(async () => {
    const next = await cartService.removeItem(id);
    setCart(next);
    setSelectedItemIds((ids) => ids.filter((value) => value !== id));
  }), [mutate]);

  const clearCart = useCallback(() => mutate(async () => {
    const next = await cartService.clear();
    setCart(next);
    setSelectedItemIds([]);
  }), [mutate]);

  const checkout = useCallback((request: BatchCheckoutRequest) => mutate(async () => {
    const result = await cartService.checkout(request);
    setSelectedItemIds([]);
    await refetch();
    return result;
  }), [mutate, refetch]);

  return {
    cart, items: cart?.items ?? [], selectedItemIds, loading, mutating, error, role,
    totalItems: cart?.items.length ?? 0, refetch, upsertItem, removeItem, clearCart, checkout,
    toggleSelectItem: (id: string) => setSelectedItemIds((ids) =>
      ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]),
    selectAll: (ids: string[]) => setSelectedItemIds(ids),
    clearSelected: () => setSelectedItemIds([]),
  };
}
