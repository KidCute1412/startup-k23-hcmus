"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccount } from "@/hooks/useAccount";
import { KycSubmitModal } from "./kyc-submit-modal";

export function ProfileOverview() {
  const account = useAccount();
  const { refetch } = account;
  const [kycOpen, setKycOpen] = useState(false);
  useEffect(() => { void refetch(); }, [refetch]);
  if (account.loading && !account.account) return <p>Đang tải hồ sơ...</p>;
  if (account.error && !account.account) return <p role="alert" className="text-red-400">{account.error}</p>;
  const user = account.account;
  if (!user) return null;
  const tone = user.kycStatus === "verified" ? "gold" : user.kycStatus === "rejected" ? "destructive" : "muted";
  return <div className="space-y-6">
    <Card className="p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{user.fullName ?? "Thành viên Mutux"}</h1>
            <Badge tone={tone}>{user.kycStatus === "verified" ? "Đã xác thực KYC" : user.kycStatus === "rejected" ? "KYC bị từ chối" : "KYC đang chờ duyệt"}</Badge>
          </div>
          <p className="mt-2 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{user.email}</p>
        </div>
      </div>
      <dl className="mt-6 grid gap-4 border-t pt-6 sm:grid-cols-3">
        <div><dt className="text-xs uppercase tracking-widest text-vanguard-light-textMuted">Điện thoại</dt><dd className="mt-1 font-semibold">{user.phone ?? "Chưa cập nhật"}</dd></div>
        <div><dt className="text-xs uppercase tracking-widest text-vanguard-light-textMuted">CCCD</dt><dd className="mt-1 font-semibold">{user.cccd ?? "Chưa cập nhật"}</dd></div>
        <div><dt className="text-xs uppercase tracking-widest text-vanguard-light-textMuted">Vai trò</dt><dd className="mt-1 font-semibold capitalize">{user.role}</dd></div>
      </dl>
    </Card>
    <Card className="border-l-4 border-l-vanguard-primary p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Xác thực danh tính</h2>
          <p className="mt-1 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            {user.role === "renter" ? "KYC được duyệt sẽ tự động cấp hạn mức tín dụng 3.000.000đ." : "Xác minh CCCD để hoàn tất hồ sơ người cho thuê."}
          </p>
          {user.kycRejectionReason && <p className="mt-2 text-sm text-red-400">Lý do: {user.kycRejectionReason}</p>}
        </div>
        {user.kycStatus !== "verified" && <button onClick={() => setKycOpen(true)} className="rounded-v-sm bg-vanguard-primary px-4 py-2 text-xs font-bold uppercase text-vanguard-dark-bg">Gửi hồ sơ KYC</button>}
      </div>
    </Card>
    <KycSubmitModal open={kycOpen} renter={user.role === "renter"} busy={account.loading} onClose={() => setKycOpen(false)} onSubmit={async (cccd, consent) => {
      await account.submitKyc(cccd, consent); setKycOpen(false);
    }} />
  </div>;
}
