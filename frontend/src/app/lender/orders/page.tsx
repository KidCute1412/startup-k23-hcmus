import type { Metadata } from "next";
import { OrdersOverview } from "@/features/rentals/orders-overview";

export const metadata: Metadata = {
  title: "Đơn thuê Gear của tôi | Mutux Lender",
  description: "Quản lý, xác nhận, giao nhận và nghiệm thu các đơn thuê gear của bạn trên Mutux.",
};

export default function LenderOrdersPage() {
  return (
    <div>
      <div className="mb-6">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
          Quản lý đơn thuê
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Đơn thuê Gear của tôi</h1>
        <p className="mt-1 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          Xem, duyệt và xử lý các đơn thuê từ người dùng đặt mượn gear của bạn.
        </p>
      </div>
      <OrdersOverview viewRole="lender" detailBasePath="/lender/orders" />
    </div>
  );
}
