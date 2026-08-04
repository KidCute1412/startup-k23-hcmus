"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleHelp, Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCreditLimit } from "@/hooks/useCreditLimit";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/format";
import type { MutuxCreditLine } from "@/types/wallet";
import { CreditLimitRequestModal } from "./credit-limit-request-modal";

export function CreditLimitPanel({ credit, renterBalance, busy, onRepay, onRefresh }: {
  credit: MutuxCreditLine | null; renterBalance: number; busy: boolean;
  onRepay: () => Promise<void>; onRefresh: () => Promise<void>;
}) {
  const { user } = useAuth();
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
    <div className="mt-5 rounded-v-md border border-vanguard-light-border bg-vanguard-light-surfDim p-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim">
      <div className="flex items-start gap-3">
        <CircleHelp size={18} className="mt-0.5 shrink-0 text-vanguard-primary" />
        <div>
          <h3 className="text-sm font-bold">Điều kiện cấp và nâng hạn mức</h3>
          <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Hạn mức được xét dựa trên trạng thái tài khoản và lịch sử giao dịch. Các điều kiện còn lại sẽ được hệ thống kiểm tra khi bạn gửi yêu cầu.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <RequirementItem ok={user?.kycStatus === "verified"} label="Hoàn tất KYC và đồng ý điều khoản tín dụng" />
        <RequirementItem ok={debt === 0} label="Không còn dư nợ Mutux" />
        <RequirementItem label="Đủ số đơn thuê đã hoàn tất" />
        <RequirementItem label="Không có tranh chấp đang mở hoặc bất lợi" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <Link href="/account" className="font-bold text-vanguard-primary hover:underline">Đăng ký làm Lender / Xem KYC →</Link>
        <span className="inline-flex items-center gap-1 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"><Clock3 size={13} /> Kiểm duyệt bởi Admin</span>
      </div>
    </div>
    {debt > 0 && <div className="mt-5 rounded-v-md border border-red-500/30 bg-red-500/10 p-4">
      <p className="font-bold text-red-400">Dư nợ: {formatCurrency(debt)}</p>
      <p className="mt-1 text-xs">{renterBalance >= debt ? "Bạn có thể trả toàn bộ dư nợ bằng ví tiêu dùng." : `Cần nạp thêm ${formatCurrency(debt - renterBalance)}.`}</p>
      <button type="button" disabled={renterBalance < debt || busy} onClick={() => void onRepay()} className="mt-3 rounded-v-sm bg-red-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Trả toàn bộ dư nợ</button>
    </div>}
    {!requests.requests.active && credit?.granted && debt === 0 && <div className="mt-5 flex flex-wrap gap-2">
      {tiers.map((value) => <button key={value} type="button" onClick={() => setTier(value)} className="rounded-v-sm border border-vanguard-primary/40 px-4 py-2 text-sm font-semibold text-vanguard-primary">Yêu cầu {formatCurrency(value)}</button>)}
    </div>}
    {requests.requests.active?.status === "pending" && <button type="button" disabled={requests.loading} onClick={() => void requests.cancel(requests.requests.active!.id)} className="mt-4 text-sm font-semibold text-red-400">Hủy yêu cầu</button>}
    <CreditLimitRequestModal tier={tier} open={tier !== null} busy={requests.loading} error={requests.error} onClose={() => setTier(null)} onSubmit={async () => {
      if (tier === null) return;
      try {
        await requests.create(tier);
        await onRefresh();
        setTier(null);
      } catch {
        // useCreditLimit stores the translated business error for the panel;
        // consume the rejection here so Next.js does not show its error overlay.
      }
    }} />
  </Card>;
}

function RequirementItem({ label, ok = false }: { label: string; ok?: boolean }) {
  return <div className="flex items-start gap-2 text-xs">
    <CheckCircle2 size={15} className={ok ? "mt-0.5 shrink-0 text-emerald-500" : "mt-0.5 shrink-0 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"} />
    <span className={ok ? "text-emerald-600 dark:text-emerald-400" : "text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"}>{label}{ok ? " · Đã đạt" : " · Sẽ kiểm tra khi gửi"}</span>
  </div>;
}
