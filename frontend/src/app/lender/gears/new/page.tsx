import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AddGearForm } from "@/features/lender/add-gear-form";

export const metadata: Metadata = {
  title: "Đăng gear mới | Mutux Gear",
  description:
    "Đăng sản phẩm gaming gear cho thuê trên Mutux – thiết lập thông tin, giá thuê và gửi duyệt.",
};

export default function NewGearPage() {
  return (
    <>
      {/* Page header */}
      <div className="border-b border-vanguard-light-border bg-vanguard-light-surfDim/60 px-4 py-10 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim/50 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/lender/gears"
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-vanguard-light-textMuted transition hover:text-vanguard-primary dark:text-vanguard-dark-textMuted"
          >
            <ArrowLeft size={13} />
            Quay lại danh sách
          </Link>
          <Badge tone="muted">Listing mới</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            Đăng gear cho thuê
          </h1>
          <p className="mt-2 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Điền đầy đủ thông tin để gear của bạn được duyệt nhanh nhất.
          </p>
        </div>
      </div>

      {/* Form */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <AddGearForm />
      </section>
    </>
  );
}
