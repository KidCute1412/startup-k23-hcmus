"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RentalRequestForm } from "@/features/rentals/rental-request-form";
import { useCart } from "@/features/cart/cart-context";

export default function CheckoutPage() {
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

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <RentalRequestForm items={items} />
    </section>
  );
}
