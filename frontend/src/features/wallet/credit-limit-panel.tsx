"use client";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { useCreditLimit } from "@/hooks/useCreditLimit";
import { formatCurrency } from "@/lib/format";
import type { MutuxCreditLine } from "@/types/wallet";
import { CreditLimitRequestModal } from "./credit-limit-request-modal";

export function CreditLimitPanel({ credit, renterBalance, busy, onRepay, onRefresh }: {
  credit: MutuxCreditLine | null; renterBalance: number; busy: boolean;
  onRepay: () => Promise<void>; onRefresh: () => Promise<void>;
}) {
  const requests = useCreditLimit();
  const { refetch } = requests;
  const [tier, setTier] = useState<number | null>(null);
  useEffect(() => { void refetch(); }, [refetch]);
  const tiers = useMemo(() => [3_000_000, 5_000_000, 10_000_000].filter((value) => value > (credit?.totalLimit ?? 0)), [credit?.totalLimit]);
  const debt = credit?.outstandingDebt ?? 0;
  return <Card className="p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
      <div>
        <h2 className="font-display text-lg font-bold">Hạn mức tín dụng Mutux</h2>
        <p className="mt-1 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          {credit?.granted ? `Khả dụng ${formatCurrency(credit.displayBalance)} · Đang khóa ${formatCurrency(credit.lockedBalance)}` : "Hoàn tất KYC để được tự động cấp 3.000.000đ."}
        </p>
      </div>
      {requests.requests.active && <span className="h-fit rounded-full bg-vanguard-primary/10 px-3 py-1 text-xs font-bold text-vanguard-primary">
        {requests.requests.active.status === "pending" ? "Đang chờ duyệt" : "Đang xem xét"}
      </span>}
    </div>
    {requests.error && <p className="mt-4 text-sm text-red-400">{requests.error}</p>}
    {debt > 0 && <div className="mt-5 rounded-v-md border border-red-500/30 bg-red-500/10 p-4">
      <p className="font-bold text-red-400">Dư nợ: {formatCurrency(debt)}</p>
      <p className="mt-1 text-xs">{renterBalance >= debt ? "Bạn có thể trả toàn bộ dư nợ bằng ví tiêu dùng." : `Cần nạp thêm ${formatCurrency(debt - renterBalance)}.`}</p>
      <button type="button" disabled={renterBalance < debt || busy} onClick={() => void onRepay()} className="mt-3 rounded-v-sm bg-red-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Trả toàn bộ dư nợ</button>
    </div>}
    {!requests.requests.active && credit?.granted && debt === 0 && <div className="mt-5 flex flex-wrap gap-2">
      {tiers.map((value) => <button key={value} type="button" onClick={() => setTier(value)} className="rounded-v-sm border border-vanguard-primary/40 px-4 py-2 text-sm font-semibold text-vanguard-primary">Yêu cầu {formatCurrency(value)}</button>)}
    </div>}
    {requests.requests.active?.status === "pending" && <button type="button" disabled={requests.loading} onClick={() => void requests.cancel(requests.requests.active!.id)} className="mt-4 text-sm font-semibold text-red-400">Hủy yêu cầu</button>}
    <CreditLimitRequestModal tier={tier} open={tier !== null} busy={requests.loading} onClose={() => setTier(null)} onSubmit={async () => {
      if (tier === null) return; await requests.create(tier); await onRefresh(); setTier(null);
    }} />
  </Card>;
}
