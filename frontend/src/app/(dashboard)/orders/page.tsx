import type { Metadata } from "next";
import { OrdersOverview } from "@/features/rentals/orders-overview";
import { GoldSpotlight } from "@/components/ui/animations/gold-spotlight";
import { GoldDustParticles } from "@/components/ui/animations/gold-dust-particles";

export const metadata: Metadata = {
  title: "Đơn thuê của tôi | Mutux Gaming Gear",
  description: "Theo dõi trạng thái đơn thuê gear, bằng chứng giao nhận và lịch sử thuê trên Mutux.",
};

export default function OrdersPage() {
  return (
    <section className="relative mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
          Lịch sử thuê gear
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">Đơn thuê của tôi</h1>
      </div>

      <OrdersOverview viewRole="renter" detailBasePath="/orders" />
    </section>
  );
}
