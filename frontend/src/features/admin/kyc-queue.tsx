"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useAdminKyc } from "@/hooks/useAdminKyc";
import { AdminPagination } from "@/components/ui/admin-pagination";
import type { KycStatus, AdminKycUser } from "@/types/admin";
import Image from "next/image";

const STATUS_TABS: { label: string; value: KycStatus }[] = [
  { label: "Chờ duyệt", value: "pending" },
  { label: "Đã xác thực", value: "verified" },
  { label: "Bị từ chối", value: "rejected" },
];

export function KycQueueFeature() {
  const {
    kycUsers,
    meta,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    loading,
    error,
    isNonAdmin,
    actionLoadingId,
    refetch,
    approveKyc,
    rejectKyc,
  } = useAdminKyc("pending", 1, 10);

  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [inspectingUser, setInspectingUser] = useState<AdminKycUser | null>(null);

  const handleConfirmReject = async () => {
    if (!rejectingUserId) return;
    try {
      await rejectKyc(rejectingUserId, rejectReason);
      setRejectingUserId(null);
      setRejectReason("");
    } catch {
      // Error handled in hook
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-7 text-vanguard-primary" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-vanguard-light-text dark:text-vanguard-dark-text sm:text-3xl">
              Quản lý Hàng chờ KYC
            </h1>
          </div>
          <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-sm">
            Duyệt thông tin định danh (KYC) của người dùng trên nền tảng Mutux (Admin Operations)
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-4 py-2 text-xs font-semibold text-vanguard-light-text transition hover:bg-vanguard-light-surfDim dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Non-Admin 403 Warning Card */}
      {isNonAdmin && (
        <div className="mb-8 rounded-v border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <ShieldAlert className="size-8 shrink-0 text-red-500" />
            <div>
              <h3 className="font-display text-lg font-bold text-red-600 dark:text-red-400">
                403 Forbidden - Admin Access Required
              </h3>
              <p className="mt-1 text-sm text-vanguard-light-text dark:text-vanguard-dark-text">
                {error}
              </p>
              <p className="mt-2 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Endpoint API: <code className="rounded bg-black/20 px-1 py-0.5 font-mono">GET /admin/kyc</code> yêu cầu token đăng nhập của tài khoản Quản trị viên (Role: <code className="font-mono">admin</code>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Filter */}
      {!isNonAdmin && (
        <div className="mb-6 flex flex-wrap border-b border-vanguard-light-border dark:border-vanguard-dark-border">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`border-b-2 px-5 py-3 font-display text-xs font-bold uppercase tracking-wider transition ${
                  active
                    ? "border-vanguard-primary text-vanguard-primary"
                    : "border-transparent text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* General Error Banner */}
      {error && !isNonAdmin && (
        <div className="mb-6 rounded-v border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-500">
          {error}
        </div>
      )}

      {/* Main Table / Data View */}
      {!isNonAdmin && (
        <div className="overflow-hidden rounded-v border border-vanguard-light-border bg-vanguard-light-surf shadow-md transition-colors dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
          {loading ? (
            <div className="p-12 text-center text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              <RefreshCw className="mx-auto size-8 animate-spin text-vanguard-primary" />
              <p className="mt-3 text-xs font-semibold">Đang tải danh sách KYC queue...</p>
            </div>
          ) : kycUsers.length === 0 ? (
            <div className="p-12 text-center text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              <Clock className="mx-auto size-10 text-vanguard-light-textMuted/50 dark:text-vanguard-dark-textMuted/50" />
              <p className="mt-3 text-sm font-semibold">Không có yêu cầu KYC nào ở trạng thái này</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-vanguard-light-border bg-vanguard-light-surfDim font-display uppercase tracking-wider text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfBright dark:text-vanguard-dark-textMuted">
                  <tr>
                    <th className="px-6 py-4">Người dùng</th>
                    <th className="px-6 py-4">CCCD / CMND</th>
                    <th className="px-6 py-4">Vai trò</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Thời gian cập nhật</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vanguard-light-border dark:divide-vanguard-dark-border">
                  {kycUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-vanguard-light-surfDim/50 dark:hover:bg-vanguard-dark-surfBright/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-vanguard-primary/10 font-bold text-vanguard-primary">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                              {user.full_name ?? "Chưa cập nhật tên"}
                            </p>
                            <p className="text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono font-medium text-vanguard-light-text dark:text-vanguard-dark-text">
                        {user.cccd ?? "Chưa cung cấp"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded bg-vanguard-light-surfDim px-2 py-1 text-[11px] font-semibold capitalize text-vanguard-light-text dark:bg-vanguard-dark-surfBright dark:text-vanguard-dark-text">
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {user.kyc_status === "verified" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-500">
                            <CheckCircle2 size={12} /> Đã duyệt
                          </span>
                        )}
                        {user.kyc_status === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-500">
                            <Clock size={12} /> Chờ duyệt
                          </span>
                        )}
                        {user.kyc_status === "rejected" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-500">
                            <XCircle size={12} /> Bị từ chối
                          </span>
                        )}
                        {user.kyc_status === "none" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-gray-400">
                            Chưa KYC
                          </span>
                        )}

                        {user.kyc_rejection_reason && (
                          <p className="mt-1 text-[10px] italic text-red-400">
                            Lý do: {user.kyc_rejection_reason}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                        {new Date(user.updated_at).toLocaleString("vi-VN")}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectingUser(user)}
                            className="inline-flex items-center gap-1 rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-1.5 text-xs font-semibold text-vanguard-light-text transition hover:bg-vanguard-light-surfDim dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
                          >
                            <FileText size={14} /> Xem tài liệu
                          </button>
                          {user.kyc_status === "pending" && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoadingId === user.id}
                                onClick={() => void approveKyc(user.id)}
                                className="inline-flex items-center gap-1 rounded-v-sm bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                              >
                                <CheckCircle2 size={14} /> Phê duyệt
                              </button>
                              <button
                                type="button"
                                disabled={actionLoadingId === user.id}
                                onClick={() => setRejectingUserId(user.id)}
                                className="inline-flex items-center gap-1 rounded-v-sm bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                              >
                                <XCircle size={14} /> Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {meta && meta.totalPages > 1 && (
            <div className="px-6 py-4">
              <AdminPagination
                page={page}
                totalPages={meta.totalPages}
                total={meta.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-6 shadow-2xl dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
            <h3 className="font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
              Từ chối hồ sơ KYC
            </h3>
            <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Nhập lý do từ chối để thông báo cho người dùng điều chỉnh lại thông tin.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Ảnh CCCD mờ, không rõ thông tin..."
              className="mt-4 w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-bg p-3 text-xs text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectingUserId(null);
                  setRejectReason("");
                }}
                className="rounded-v-sm px-4 py-2 text-xs font-semibold text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmReject()}
                className="rounded-v-sm bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Inspection Modal */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-6 shadow-2xl transition-colors dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-vanguard-light-border pb-4 dark:border-vanguard-dark-border">
              <div>
                <h3 className="font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                  Chi tiết Tài liệu Xác minh KYC
                </h3>
                <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Người dùng: <strong className="text-vanguard-light-text dark:text-vanguard-dark-text">{inspectingUser.full_name ?? "Chưa cập nhật tên"}</strong> ({inspectingUser.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="rounded-full p-1.5 text-vanguard-light-textMuted hover:bg-vanguard-light-surfDim hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfBright dark:hover:text-vanguard-dark-text"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* User Info Overview */}
            <div className="my-4 grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-v bg-vanguard-light-bg p-4 dark:bg-vanguard-dark-bg text-xs">
              <div>
                <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Số CCCD / CMND:</span>
                <p className="mt-0.5 font-mono font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                  {inspectingUser.cccd ?? "Chưa cung cấp"}
                </p>
              </div>
              <div>
                <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Vai trò:</span>
                <p className="mt-0.5 font-semibold capitalize text-vanguard-light-text dark:text-vanguard-dark-text">
                  {inspectingUser.role}
                </p>
              </div>
              <div>
                <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Trạng thái hiện tại:</span>
                <div className="mt-0.5">
                  {inspectingUser.kyc_status === "verified" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-500">
                      <CheckCircle2 size={12} /> Đã duyệt
                    </span>
                  )}
                  {inspectingUser.kyc_status === "pending" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-500">
                      <Clock size={12} /> Chờ duyệt
                    </span>
                  )}
                  {inspectingUser.kyc_status === "rejected" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 font-semibold text-red-500">
                      <XCircle size={12} /> Bị từ chối
                    </span>
                  )}
                  {inspectingUser.kyc_status === "none" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 font-semibold text-gray-400">
                      Chưa KYC
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Document Images Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Front Card */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                  1. Ảnh mặt trước CCCD / CMND
                </span>
                {inspectingUser.kyc_front_card_url ? (
                  <div className="relative group overflow-hidden rounded-v border border-vanguard-light-border dark:border-vanguard-dark-border bg-black">
                    <Image
                      src={inspectingUser.kyc_front_card_url}
                      alt="Mặt trước CCCD"
                      fill
                      className="h-56 w-full object-contain transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <a
                        href={inspectingUser.kyc_front_card_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-vanguard-primary px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wider hover:bg-vanguard-primary/95"
                      >
                        Mở ảnh lớn
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-v border border-dashed border-vanguard-light-border dark:border-vanguard-dark-border bg-vanguard-light-bg dark:bg-vanguard-dark-bg text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted text-xs">
                    Không có ảnh mặt trước
                  </div>
                )}
              </div>

              {/* Back Card */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                  2. Ảnh mặt sau CCCD / CMND
                </span>
                {inspectingUser.kyc_back_card_url ? (
                  <div className="relative group overflow-hidden rounded-v border border-vanguard-light-border dark:border-vanguard-dark-border bg-black">
                    <Image
                      src={inspectingUser.kyc_back_card_url}
                      alt="Mặt sau CCCD"
                      fill
                      className="h-56 w-full object-contain transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <a
                        href={inspectingUser.kyc_back_card_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-vanguard-primary px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wider hover:bg-vanguard-primary/95"
                      >
                        Mở ảnh lớn
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-v border border-dashed border-vanguard-light-border dark:border-vanguard-dark-border bg-vanguard-light-bg dark:bg-vanguard-dark-bg text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted text-xs">
                    Không có ảnh mặt sau
                  </div>
                )}
              </div>

              {/* Portrait */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                  3. Ảnh chân dung (Selfie)
                </span>
                {inspectingUser.kyc_portrait_url ? (
                  <div className="relative group overflow-hidden rounded-v border border-vanguard-light-border dark:border-vanguard-dark-border bg-black">
                    <Image
                      src={inspectingUser.kyc_portrait_url}
                      alt="Ảnh chân dung"
                      fill
                      className="h-56 w-full object-contain transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <a
                        href={inspectingUser.kyc_portrait_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-vanguard-primary px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wider hover:bg-vanguard-primary/95"
                      >
                        Mở ảnh lớn
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-v border border-dashed border-vanguard-light-border dark:border-vanguard-dark-border bg-vanguard-light-bg dark:bg-vanguard-dark-bg text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted text-xs">
                    Không có ảnh chân dung
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="mt-8 flex justify-between gap-3 border-t border-vanguard-light-border pt-4 dark:border-vanguard-dark-border">
              <div>
                {inspectingUser.kyc_rejection_reason && (
                  <p className="text-xs text-red-500 italic">
                    Lý do từ chối trước đó: {inspectingUser.kyc_rejection_reason}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingUser(null)}
                  className="rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-4 py-2 text-xs font-semibold text-vanguard-light-text transition hover:bg-vanguard-light-surfDim dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
                >
                  Đóng
                </button>
                {inspectingUser.kyc_status === "pending" && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoadingId === inspectingUser.id}
                      onClick={async () => {
                        try {
                          await approveKyc(inspectingUser.id);
                          setInspectingUser(null);
                        } catch {}
                      }}
                      className="inline-flex items-center gap-1 rounded-v-sm bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} /> Phê duyệt
                    </button>
                    <button
                      type="button"
                      disabled={actionLoadingId === inspectingUser.id}
                      onClick={() => {
                        setRejectingUserId(inspectingUser.id);
                        setInspectingUser(null);
                      }}
                      className="inline-flex items-center gap-1 rounded-v-sm bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                    >
                      <XCircle size={14} /> Từ chối
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
