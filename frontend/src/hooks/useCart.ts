"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/apiClient";
export { ApiError };
import { cartService } from "@/services/cartService";
import type { BatchCheckoutRequest, Cart } from "@/types/cart";
import type { User } from "@/types/auth";

export const messages: Record<string, string> = {
  START_DATE_TOO_SOON: "Ngày bắt đầu thuê phải từ ngày mai trở đi để lender có thời gian chuẩn bị và giao gear.",
  INVALID_DATE_RANGE: "Khoảng ngày thuê không hợp lệ.",
  GEAR_NOT_AVAILABLE: "Gear hiện không thể cho thuê.",
  CANNOT_RENT_OWN_GEAR: "Bạn không thể thuê gear của chính mình.",
  GEAR_UNAVAILABLE_FOR_PERIOD: "Gear đã có lịch thuê trùng khoảng ngày này.",
  CART_ITEM_NOT_FOUND: "Sản phẩm không còn trong giỏ hàng.",
  RENTER_ONLY: "Chỉ tài khoản người thuê mới sử dụng được giỏ hàng.",
  INSUFFICIENT_FUNDS: "Số dư ví không đủ để thực hiện giao dịch.",
  INSUFFICIENT_CASH: "Ví tiền mặt không đủ số dư để thực hiện thanh toán.",
  INSUFFICIENT_CREDIT: "Hạn mức Mutux Credit không đủ hoặc chưa được cấp.",
  WALLET_INACTIVE: "Ví đang bị khóa hoặc không hoạt động. Vui lòng kiểm tra lại ví của bạn.",
  VALIDATION_ERROR: "Dữ liệu nhập vào không hợp lệ, vui lòng kiểm tra lại.",
};

export function errorText(error: unknown): string {
  if (error instanceof ApiError && error.code) {
    return messages[error.code] ?? error.message ?? "Không thể xử lý giỏ hàng.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Không thể kết nối tới giỏ hàng.";
}

function currentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function useCartState() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<User["role"] | null>(null);
  const authIdentityRef = useRef<string | null | undefined>(undefined);

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
      const eligibleIds = next.items
        .filter((item) => item.availability.eligible)
        .map((item) => item.id);

      setSelectedItemIds((prevIds) => {
        // If state already had selection, filter out non-eligible items
        if (prevIds.length > 0) {
          const valid = prevIds.filter((id) => eligibleIds.includes(id));
          return valid.length > 0 ? valid : eligibleIds;
        }
        // Default: auto select all eligible items
        return eligibleIds;
      });
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const storedUser = currentUser();
      const nextIdentity = storedUser ? `${storedUser.id}:${storedUser.role}` : null;
      if (authIdentityRef.current === nextIdentity) return;
      authIdentityRef.current = nextIdentity;
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
