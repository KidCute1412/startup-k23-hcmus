import type { Metadata } from "next";
import { OrderDetailView } from "@/features/rentals/order-detail-view";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Chi tiết đơn thuê | Mutux Lender",
};

export default async function LenderOrderDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div>
      <OrderDetailView
        orderId={id}
        backPath="/lender/orders"
        backLabel="Quay lại danh sách đơn thuê Gear"
      />
    </div>
  );
}
