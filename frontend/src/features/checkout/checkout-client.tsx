"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RentalRequestForm } from "@/features/rentals/rental-request-form";
import { useCart } from "@/features/cart/cart-context";

export function CheckoutClient() {
  const { items, totalItems, selectedItemIds } = useCart();
  const router = useRouter();
  
  const selectedItems = items.filter(item => selectedItemIds.includes(item.id));

  useEffect(() => {
    if (selectedItems.length === 0) {
      router.push("/cart");
    }
  }, [selectedItems.length, router]);

  if (selectedItems.length === 0) {
    return null; // Will redirect
  }

  return <RentalRequestForm items={selectedItems} />;
}
