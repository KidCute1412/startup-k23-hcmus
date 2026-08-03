"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLenderUpgrade } from "@/hooks/useLenderUpgrade";
import { ProfileOverview } from "./profile-overview";
import { AddressList } from "./address-list";

export function AccountView() {
  const [activeTab, setActiveTab] = useState<string>("profile");

  return (
    <div className="space-y-8">
      <ProfileOverview activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "profile" && <LenderUpgradePanel />}
      {activeTab === "addresses" && <AddressList />}
    </div>
  );
}

function LenderUpgradePanel() {
  const { user } = useAuth();
  const { request, loading, submitting, message, requestUpgrade } =
    useLenderUpgrade();
  const [reason, setReason] = useState("");

  if (!user || user.role === "admin") return null;

  const isPending = request?.status === "pending";
  const isApproved = user.lenderEnabled || request?.status === "approved";
  const isRejected = request?.status === "rejected";
  const canRequest = !isPending && !isApproved && user.kycStatus === "verified";

  const handleSend = () => {
    void requestUpgrade(reason);
  };

  return (
    <Card className="p-6 border-vanguard-light-border bg-vanguard-light-surf shadow-royal dark:border-vanguard-primary/20 dark:bg-vanguard-dark-surf">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
            Nâng cấp thành Lender
          </h3>
          <p className="mt-1.5 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted max-w-3xl">
            Tài khoản Lender cần được Ban quản trị (Admin) phê duyệt riêng. Sau khi duyệt, tài khoản vẫn giữ vai trò Renter đồng thời kích hoạt thêm tính năng cho thuê đồ để bạn đăng sản phẩm và nhận doanh thu từ Mutux.
          </p>
        </div>

        {/* Input area for reason */}
        {canRequest && (
          <div className="space-y-2.5 max-w-2xl">
            <label className="text-xs font-bold uppercase tracking-wider text-vanguard-primary">
              Lý do đăng ký làm Lender
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Tôi muốn cho thuê bàn phím cơ Custom và tai nghe gaming để tối ưu hóa hiệu năng thiết bị dư thừa của mình..."
              className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-bg p-3 text-xs text-vanguard-light-text outline-none transition focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
              maxLength={1000}
            />
            <p className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted text-right">
              {reason.length}/1000 ký tự
            </p>
          </div>
        )}

        {/* Showing submitted reason */}
        {(isPending || isApproved || (isRejected && request?.reason)) && (
          <div className="rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surfDim p-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfBright max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Lý do bạn đã gửi:
            </span>
            <p className="mt-1 text-xs italic text-vanguard-light-text dark:text-vanguard-dark-text">
              &quot;{request?.reason || "Không cung cấp lý do"}&quot;
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {message && <p className="text-xs font-semibold text-vanguard-primary">{message}</p>}
            {isRejected && request?.reviewNote && (
              <p className="mt-2 text-xs font-medium text-rose-500 dark:text-rose-400">
                Lý do từ chối của Admin: <span className="font-semibold">{request.reviewNote}</span>
              </p>
            )}
          </div>

          <div className="shrink-0 self-end sm:self-auto">
            {isApproved ? (
              <Link
                href="/lender/gears"
                className="inline-flex rounded-v-sm bg-gold-metal px-6 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg transition hover:opacity-90 shadow-md"
              >
                Quản lý thiết bị
              </Link>
            ) : user.kycStatus !== "verified" ? (
              <button
                type="button"
                disabled
                className="rounded-v-sm border border-vanguard-light-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider opacity-60 dark:border-vanguard-dark-border cursor-not-allowed"
              >
                Yêu cầu xác thực KYC trước
              </button>
            ) : isPending || loading ? (
              <span className="inline-flex rounded-v-sm border border-vanguard-primary/40 bg-vanguard-primary/5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-primary animate-pulse">
                Đang chờ duyệt...
              </span>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSend}
                className="rounded-v-sm bg-vanguard-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg transition hover:opacity-90 disabled:opacity-60 shadow-md"
              >
                {isRejected ? "Gửi lại yêu cầu" : "Gửi yêu cầu"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
