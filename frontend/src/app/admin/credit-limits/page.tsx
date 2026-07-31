import type { Metadata } from "next";
import { CreditLimitQueue } from "@/features/admin/credit-limit-queue";

export const metadata: Metadata = {
  title: "Duyệt hạn mức tín dụng | Mutux Admin",
  description: "Xét duyệt yêu cầu nâng hạn mức tín dụng Mutux.",
};

export default function AdminCreditLimitsPage() {
  return <CreditLimitQueue />;
}
