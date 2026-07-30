import type { Metadata } from "next";
import { GearQueueFeature } from "@/features/admin/gear-queue";

export const metadata: Metadata = {
  title: "Duyệt Thiết bị Cho thuê | Mutux Admin Operations",
  description:
    "Giao diện kiểm định chất lượng, thông số và tiền đặt cọc thiết bị đăng cho thuê bởi Lender.",
};

export default function AdminGearsPage() {
  return <GearQueueFeature />;
}
