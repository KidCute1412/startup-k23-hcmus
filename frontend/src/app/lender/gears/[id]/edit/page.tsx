import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EditGearForm } from "@/features/lender/edit-gear-form";

export const metadata: Metadata = {
  title: "Chỉnh sửa gear | Mutux Gear",
  description: "Chỉnh sửa thông tin thiết bị đang cho thuê trên Mutux.",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditGearPage({ params }: Props) {
  const { id } = await params;

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
          <Badge tone="muted">Chỉnh sửa</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            Chỉnh sửa thông tin gear
          </h1>
          <p className="mt-2 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Cập nhật các thông số, giá thuê, hoặc tình trạng mới của thiết bị.
          </p>
        </div>
      </div>

      {/* Form */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <EditGearForm gearId={id} />
      </section>
    </>
  );
}
