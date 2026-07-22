import { AccountHeader } from "@/features/account/account-header";
import { OrdersOverview } from "@/features/account/orders-overview";

export default function OrdersPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
          Rental Order Management
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">Đơn thuê của tôi</h1>
      </div>

      <AccountHeader />

      <OrdersOverview />
    </section>
  );
}
