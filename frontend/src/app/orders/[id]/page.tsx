import { OrderDetailView } from "@/features/account/order-detail-view";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
          Order Details
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">Chi tiết đơn thuê</h1>
      </div>

      <OrderDetailView orderId={id} />
    </section>
  );
}
