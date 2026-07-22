import { Metadata } from "next";
import { CheckoutClient } from "@/features/checkout/checkout-client";

export const metadata: Metadata = {
  title: "Thanh toán đơn thuê | Mutux GEAR",
  description: "Hoàn tất thông tin giao nhận và tiến hành thanh toán cọc đơn thuê gear gaming.",
};

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <CheckoutClient />
    </section>
  );
}
