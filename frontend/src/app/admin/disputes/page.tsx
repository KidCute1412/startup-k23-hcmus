import type { Metadata } from "next";
import { DisputeResolutionFeature } from "@/features/admin/dispute-resolution";

export const metadata: Metadata = {
  title: "Xử lý Tranh chấp Đơn hàng | Mutux Admin Operations",
  description:
    "Giao diện phân xử khiếu nại giữa Renter & Lender, khấu trừ cọc hoặc hoàn tiền trên Mutux.",
};

export default function AdminDisputesPage() {
  return <DisputeResolutionFeature />;
}
