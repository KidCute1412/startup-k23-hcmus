"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  Eye,
  X,
} from "lucide-react";
import { useAdminLenderUpgrade, type LenderUpgradeRequestStatus } from "@/hooks/useAdminLenderUpgrade";
import { AdminPagination } from "@/components/ui/admin-pagination";

const STATUS_TABS: { label: string; value: LenderUpgradeRequestStatus }[] = [
  { label: "Chờ duyệt", value: "pending" },
  { label: "Đã duyệt", value: "approved" },
  { label: "Bị từ chối", value: "rejected" },
];

export function LenderUpgradeQueueFeature() {
  const {
    requests,
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
    approveRequest,
    rejectRequest,
  } = useAdminLenderUpgrade("pending", 1, 10);

  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<typeof requests[number] | null>(null);

  const handleConfirmReject = async () => {
    if (!rejectingRequestId) return;
    try {
      await rejectRequest(rejectingRequestId, rejectReason);
      setRejectingRequestId(null);
      setRejectReason("");
    } catch {
      // Error handled in hook/toast
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
              Duyệt Nâng Cấp Lender
            </h1>
          </div>
          <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-sm">
            Phê duyệt hoặc từ chối các yêu cầu nâng cấp quyền cho thuê đồ (Lender) của Renter trên hệ thống Mutux.
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
                Yêu cầu quyền truy cập của Quản trị viên để thực hiện thao tác này.
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
              <p className="mt-3 text-xs font-semibold">Đang tải danh sách hàng chờ...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              <Clock className="mx-auto size-10 text-vanguard-light-textMuted/50 dark:text-vanguard-light-textMuted/50" />
              <p className="mt-3 text-sm font-semibold">Không có yêu cầu nâng cấp nào ở trạng thái này</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-vanguard-light-border bg-vanguard-light-surfDim font-display uppercase tracking-wider text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfBright dark:text-vanguard-dark-textMuted">
                  <tr>
                    <th className="px-6 py-4">Người yêu cầu</th>
                    <th className="px-6 py-4">Lý do nâng cấp</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Thời gian gửi</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vanguard-light-border dark:divide-vanguard-dark-border">
                  {requests.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRequest(item)}
                      className="cursor-pointer transition-colors hover:bg-vanguard-light-surfDim/50 dark:hover:bg-vanguard-dark-surfBright/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-vanguard-primary/10 font-bold text-vanguard-primary">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                              {item.applicant?.fullName ?? "Chưa cập nhật tên"}
                            </p>
                            <p className="text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                              {item.applicant?.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 max-w-md">
                        <div className="flex items-start gap-2 text-vanguard-light-text dark:text-vanguard-dark-text">
                          <MessageSquare className="size-4 shrink-0 text-vanguard-primary/60 mt-0.5" />
                          <p className="text-xs italic">
                            &quot;{item.reason || "Không cung cấp lý do đăng ký"}&quot;
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {item.status === "approved" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-500">
                            <CheckCircle2 size={12} /> Đã phê duyệt
                          </span>
                        )}
                        {item.status === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-500">
                            <Clock size={12} /> Chờ phê duyệt
                          </span>
                        )}
                        {item.status === "rejected" && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-500">
                              <XCircle size={12} /> Đã từ chối
                            </span>
                            {item.reviewNote && (
                              <p className="text-[10px] italic text-red-400 max-w-xs">
                                Lý do: {item.reviewNote}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          aria-label="Xem chi tiết yêu cầu"
                          title="Xem chi tiết"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedRequest(item);
                          }}
                          className="mr-2 inline-flex size-8 items-center justify-center rounded-v-sm border border-vanguard-light-border text-vanguard-light-textMuted transition hover:border-vanguard-primary hover:text-vanguard-primary dark:border-vanguard-dark-border dark:text-vanguard-dark-textMuted"
                        >
                          <Eye size={15} />
                        </button>
                        {item.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                void approveRequest(item.id);
                              }}
                              className="inline-flex items-center gap-1 rounded-v-sm bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                            >
                              <CheckCircle2 size={14} /> Phê duyệt
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                setRejectingRequestId(item.id);
                              }}
                              className="inline-flex items-center gap-1 rounded-v-sm bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                            >
                              <XCircle size={14} /> Từ chối
                            </button>
                          </div>
                        )}
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

      {/* Request Details Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedRequest(null);
          }}
        >
          <div
            className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-v border border-vanguard-light-border bg-vanguard-light-surf shadow-2xl dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lender-upgrade-detail-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-vanguard-light-border px-6 py-5 dark:border-vanguard-dark-border">
              <div>
                <p className="field-label">Chi tiết hồ sơ</p>
                <h2 id="lender-upgrade-detail-title" className="mt-1 font-display text-xl font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                  Yêu cầu nâng cấp Lender
                </h2>
              </div>
              <button
                type="button"
                aria-label="Đóng chi tiết"
                title="Đóng"
                onClick={() => setSelectedRequest(null)}
                className="inline-flex size-8 items-center justify-center rounded-v-sm text-vanguard-light-textMuted transition hover:bg-vanguard-light-surfDim hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfBright dark:hover:text-vanguard-dark-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-vanguard-primary/10 text-vanguard-primary">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                    {selectedRequest.applicant?.fullName ?? "Chưa cập nhật tên"}
                  </p>
                  <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    {selectedRequest.applicant?.email ?? "Chưa cập nhật email"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surfDim/50 p-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfBright/40">
                  <p className="field-label">Trạng thái</p>
                  <div className="mt-2">
                    {selectedRequest.status === "approved" && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500"><CheckCircle2 size={14} /> Đã phê duyệt</span>}
                    {selectedRequest.status === "pending" && <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500"><Clock size={14} /> Chờ phê duyệt</span>}
                    {selectedRequest.status === "rejected" && <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500"><XCircle size={14} /> Đã từ chối</span>}
                  </div>
                </div>
                <div className="rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surfDim/50 p-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfBright/40">
                  <p className="field-label">Thời gian gửi</p>
                  <p className="mt-2 text-sm text-vanguard-light-text dark:text-vanguard-dark-text">
                    {new Date(selectedRequest.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              <div>
                <p className="field-label">Lý do nâng cấp</p>
                <div className="mt-2 flex items-start gap-3 rounded-v-sm border border-vanguard-light-border p-4 dark:border-vanguard-dark-border">
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-vanguard-primary" />
                  <p className="whitespace-pre-wrap text-sm leading-6 text-vanguard-light-text dark:text-vanguard-dark-text">
                    {selectedRequest.reason || "Không cung cấp lý do đăng ký"}
                  </p>
                </div>
              </div>

              {selectedRequest.reviewNote && (
                <div>
                  <p className="field-label">Ghi chú xử lý</p>
                  <p className="mt-2 whitespace-pre-wrap rounded-v-sm border border-red-500/20 bg-red-500/5 p-4 text-sm leading-6 text-vanguard-light-text dark:text-vanguard-dark-text">
                    {selectedRequest.reviewNote}
                  </p>
                </div>
              )}

              <div className="grid gap-4 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:grid-cols-2">
                <p>KYC: <span className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">{selectedRequest.applicant?.kycStatus ?? "Chưa cập nhật"}</span></p>
                <p>Đã bật quyền lender: <span className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">{selectedRequest.applicant?.lenderEnabled ? "Có" : "Chưa"}</span></p>
                {selectedRequest.reviewedAt && <p>Thời gian xử lý: <span className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">{new Date(selectedRequest.reviewedAt).toLocaleString("vi-VN")}</span></p>}
                {selectedRequest.reviewedBy && <p>Người xử lý: <span className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">{selectedRequest.reviewedBy}</span></p>}
              </div>
            </div>

            {selectedRequest.status === "pending" && (
              <div className="flex flex-col-reverse gap-3 border-t border-vanguard-light-border px-6 py-5 sm:flex-row sm:justify-end dark:border-vanguard-dark-border">
                <button
                  type="button"
                  disabled={actionLoadingId === selectedRequest.id}
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectingRequestId(selectedRequest.id);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-v-sm bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  <XCircle size={14} /> Từ chối
                </button>
                <button
                  type="button"
                  disabled={actionLoadingId === selectedRequest.id}
                  onClick={() => {
                    setSelectedRequest(null);
                    void approveRequest(selectedRequest.id);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-v-sm bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  <CheckCircle2 size={14} /> Phê duyệt
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-6 shadow-2xl dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
            <h3 className="font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
              Từ chối nâng cấp Lender
            </h3>
            <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Vui lòng nhập lý do từ chối để giải thích cho người dùng lý do hồ sơ chưa hợp lệ.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Mô tả lý do không rõ ràng, tài khoản chưa có lịch sử giao dịch uy tín..."
              className="mt-4 w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-bg p-3 text-xs text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
              maxLength={1000}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectingRequestId(null);
                  setRejectReason("");
                }}
                className="rounded-v-sm px-4 py-2 text-xs font-semibold text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={() => void handleConfirmReject()}
                className="rounded-v-sm bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
