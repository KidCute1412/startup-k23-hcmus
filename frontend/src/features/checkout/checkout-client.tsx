"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { RentalRequestForm } from "@/features/rentals/rental-request-form";
import { useCart } from "@/features/cart/cart-context";

export function CheckoutClient() {
  const { items, selectedItemIds, loading } = useCart();
  const router = useRouter();
  
  const selectedItems = useMemo(
    () => items.filter((item) => selectedItemIds.includes(item.id)),
    [items, selectedItemIds],
  );

  useEffect(() => {
    if (!loading && selectedItems.length === 0) {
      router.push("/cart");
    }
  }, [loading, selectedItems.length, router]);

  if (loading || selectedItems.length === 0) {
    return (
      <div className="p-12 text-center text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
        Đang chuẩn bị trang thanh toán...
      </div>
    );
  }

  return <RentalRequestForm items={selectedItems} />;
}
