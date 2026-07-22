"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RentalRequestForm } from "@/features/rentals/rental-request-form";
import { useCart } from "@/features/cart/cart-context";

export function CheckoutClient() {
  const { items, totalItems } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (totalItems === 0) {
      router.push("/cart");
    }
  }, [totalItems, router]);

  if (totalItems === 0) {
    return null; // Will redirect
  }

  return <RentalRequestForm items={items} />;
}
