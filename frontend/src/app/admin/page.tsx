import type { Metadata } from "next";
import { AdminOverviewFeature } from "@/features/admin/admin-overview";

export const metadata: Metadata = {
  title: "Tổng quan Dashboard | Mutux Admin Operations",
  description:
    "Trung tâm quản trị Mutux - Thống kê KPI, hàng chờ KYC, duyệt thiết bị cho thuê và xử lý tranh chấp.",
};

export default function AdminOverviewPage() {
  return <AdminOverviewFeature />;
}
