import { Metadata } from "next";
import { CartClient } from "@/features/cart/cart-client";

export const metadata: Metadata = {
  title: "Giỏ đồ công nghệ | Mutux GEAR",
  description: "Quản lý các thiết bị gaming gear cao cấp bạn đã chọn để chuẩn bị thuê.",
};

export default function CartPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
          Giỏ hàng
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">Giỏ đồ công nghệ</h1>
      </div>

      <CartClient />
    </section>
  );
}
