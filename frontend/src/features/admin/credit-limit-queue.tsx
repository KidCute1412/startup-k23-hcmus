"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { useAdminCreditLimits } from "@/hooks/useAdminCreditLimits";
import { formatCurrency } from "@/lib/format";
import type { CreditLimitRequestStatus } from "@/types/credit-limit";

export function CreditLimitQueue() {
  const queue = useAdminCreditLimits();
  const { load, review, approve, reject } = queue;
  const [status, setStatus] = useState<CreditLimitRequestStatus | "">("pending");
  const [page, setPage] = useState(1);
  const [acting, setActing] = useState<string | null>(null);
  useEffect(() => { void load(status, page); }, [load, status, page]);
  const run = async (id: string, action: () => Promise<unknown>) => {
    setActing(id);
    try { await action(); await load(status, page); } finally { setActing(null); }
  };
  return <div className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6">
    <header className="mb-8">
      <div className="flex items-center gap-2">
        <CreditCard className="size-7 text-vanguard-primary" aria-hidden="true" />
        <h1 className="font-display text-2xl font-bold tracking-tight text-vanguard-light-text dark:text-vanguard-dark-text sm:text-3xl">
          Duyệt nâng hạn mức tín dụng
        </h1>
      </div>
      <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-sm">
        Admin chỉ duyệt đúng tier renter đã yêu cầu; policy được backend kiểm tra lại.
      </p>
    </header>
    <CustomSelect
      value={status}
      onValueChange={(val) => { setStatus(val as CreditLimitRequestStatus | ""); setPage(1); }}
      className="w-48 text-xs min-h-[unset] h-9"
      options={[
        { value: "", label: "Tất cả" },
        { value: "pending", label: "Chờ duyệt" },
        { value: "under_review", label: "Đang xem xét" },
        { value: "approved", label: "Đã duyệt" },
        { value: "rejected", label: "Từ chối" },
        { value: "cancelled", label: "Đã hủy" },
      ]}
    />
    {queue.error && <p role="alert" className="text-red-400">{queue.error}</p>}
    {queue.loading && queue.items.length === 0 ? <p>Đang tải...</p> : queue.items.length === 0 ? (
      <Card className="overflow-hidden">
        <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vanguard-primary">
              Credit review queue
            </p>
            <h2 className="mt-2 font-display text-xl font-bold sm:text-2xl">
              Chưa có yêu cầu nâng hạn mức
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted lg:mx-0">
              Các hồ sơ mới sẽ xuất hiện tại đây khi renter gửi yêu cầu. Hệ thống sẽ tự kiểm tra điều kiện trước khi admin xét duyệt.
            </p>
          </div>
          <div className="order-1 mx-auto w-full max-w-[220px] lg:order-2 lg:max-w-[260px]">
            <Image
              src="/admin/credit-limit-illustration.png"
              alt="Minh hoạ xét duyệt hạn mức tín dụng"
              width={512}
              height={512}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      </Card>
    ) :
      <div className="grid gap-4">{queue.items.map((item) => <Card key={item.id} className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold">{item.applicant.fullName ?? item.applicant.email}</h2>
            <p className="mt-1 text-sm">{formatCurrency(item.currentLimit)} → <strong className="text-vanguard-primary">{formatCurrency(item.requestedLimit)}</strong></p>
            <p className="mt-2 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              {item.eligibility.completedOrders} đơn hoàn tất · {item.eligibility.openDisputes} tranh chấp mở · {item.eligibility.adverseDisputes} khấu trừ bất lợi
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.status === "pending" && <button disabled={acting === item.id} onClick={() => void run(item.id, () => review(item.id))} className="rounded-v-sm bg-vanguard-primary px-3 py-2 text-xs font-bold text-vanguard-dark-bg">Bắt đầu xem xét</button>}
            {item.status === "under_review" && <button disabled={acting === item.id} onClick={() => void run(item.id, () => approve(item.id, item.requestedLimit))} className="rounded-v-sm bg-emerald-500 px-3 py-2 text-xs font-bold text-white">Duyệt {formatCurrency(item.requestedLimit)}</button>}
            {(item.status === "pending" || item.status === "under_review") && <button disabled={acting === item.id} onClick={() => {
              const note = window.prompt("Nhập lý do từ chối:");
              if (note?.trim()) void run(item.id, () => reject(item.id, note.trim()));
            }} className="rounded-v-sm border border-red-500/40 px-3 py-2 text-xs font-bold text-red-400">Từ chối</button>}
          </div>
        </div>
      </Card>)}</div>}
    {queue.meta && queue.meta.totalPages > 1 && <div className="flex justify-end gap-2">
      <button disabled={page <= 1} onClick={() => setPage((v) => v - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Trước</button>
      <span className="px-2 py-1 text-sm">{page}/{queue.meta.totalPages}</span>
      <button disabled={page >= queue.meta.totalPages} onClick={() => setPage((v) => v + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Sau</button>
    </div>}
  </div>;
}
