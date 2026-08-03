"use client";

import React, { useState } from "react";
import {
  PackageCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Tag,
  User,
  ShieldAlert,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import Image from "next/image";
import { useAdminGears } from "@/hooks/useAdminGears";
import { resolveMediaUrl } from "@/lib/media";
import type { AdminGearItem, ApprovalStatus } from "@/types/admin";

const STATUS_TABS: { label: string; value: ApprovalStatus }[] = [
  { label: "Chờ kiểm định", value: "pending" },
  { label: "Đã duyệt", value: "approved" },
  { label: "Bị từ chối", value: "rejected" },
];

export function GearQueueFeature() {
  const {
    gears,
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
    approveGear,
    rejectGear,
  } = useAdminGears("pending", 1, 10);

  const [selectedGear, setSelectedGear] = useState<AdminGearItem | null>(null);
  const [rejectingGearId, setRejectingGearId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredGears = gears.filter((g) => {
    const ownerName = g.lender?.full_name || g.owner?.full_name || g.lender?.email || g.owner?.email || "";
    return (
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleApprove = async (id: string) => {
    try {
      await approveGear(id);
      if (selectedGear?.id === id) {
        setSelectedGear(null);
      }
    } catch {
      // Error handled in hook toast
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingGearId) return;
    try {
      await rejectGear(rejectingGearId, rejectReason || "Hình ảnh hoặc thông số chưa đạt yêu cầu.");
      setRejectingGearId(null);
      setRejectReason("");
      if (selectedGear?.id === rejectingGearId) {
        setSelectedGear(null);
      }
    } catch {
      // Error handled in hook toast
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="size-7 text-vanguard-primary" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-vanguard-light-text dark:text-vanguard-dark-text sm:text-3xl">
              Quản lý Duyệt Thiết bị Cho thuê
            </h1>
          </div>
          <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-sm">
            Kiểm định chất lượng, thông số kỹ thuật và tiền cọc sản phẩm đăng tải bởi Lender (Admin Operations)
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
                Endpoint API: <code className="rounded bg-black/20 px-1 py-0.5 font-mono">GET /admin/gears</code> yêu cầu token đăng nhập của tài khoản Quản trị viên (Role: <code className="font-mono">admin</code>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      {!isNonAdmin && (
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex border-b border-vanguard-light-border dark:border-vanguard-dark-border">
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
                  {tab.label} {active && meta ? `(${meta.total})` : ""}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên thiết bị, chủ sở hữu..."
              className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf pl-9 pr-3 py-2 text-xs text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text"
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !isNonAdmin && (
        <div className="mb-6 rounded-v border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-500">
          {error}
        </div>
      )}

      {/* Grid of Gear Cards */}
      {!isNonAdmin && (
        <>
          {loading ? (
            <div className="p-12 text-center text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              <RefreshCw className="mx-auto size-8 animate-spin text-vanguard-primary" />
              <p className="mt-3 text-xs font-semibold">Đang tải danh sách thiết bị cho thuê...</p>
            </div>
          ) : filteredGears.length === 0 ? (
            <div className="rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-12 text-center text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-textMuted">
              <Clock className="mx-auto size-10 opacity-50" />
              <p className="mt-3 text-sm font-semibold">Không có sản phẩm nào ở trạng thái này</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGears.map((item) => {
                const imageUrl = resolveMediaUrl(item.media?.[0]?.url);
                const ownerName = item.lender?.full_name || item.owner?.full_name || item.lender?.email || item.owner?.email || "Chưa rõ";
                const ownerEmail = item.lender?.email || item.owner?.email || "";
                const rentPrice = Number(item.rent_price_per_day || item.price_per_day || 0);
                const depositVal = Number(item.value || item.deposit_fee || 0);
                const categoryName = item.category?.name || "Gaming Gear";

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col overflow-hidden rounded-v border border-vanguard-light-border bg-vanguard-light-surf shadow-md transition hover:border-vanguard-primary/50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-48 w-full overflow-hidden bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfBright">
                      <Image
                        src={imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 rounded-v-sm bg-black/60 px-2.5 py-1 backdrop-blur-md">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-vanguard-primary">
                          {categoryName}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="line-clamp-2 font-display text-sm font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                        {item.name}
                      </h3>

                      <p className="mt-1 line-clamp-1 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                        {item.brand ? `${item.brand} ${item.model || ""}` : item.description || "Chưa có mô tả kỹ thuật"}
                      </p>

                      {/* Owner info */}
                      <div className="mt-3 flex items-center gap-2 border-t border-vanguard-light-border pt-3 text-xs text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:text-vanguard-dark-textMuted">
                        <User size={14} className="text-vanguard-primary" />
                        <span className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                          {ownerName}
                        </span>
                        {ownerEmail && <span className="text-[10px]">({ownerEmail})</span>}
                      </div>

                      {/* Pricing Info */}
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-v-sm bg-vanguard-light-surfDim p-3 text-xs dark:bg-vanguard-dark-surfBright">
                        <div>
                          <span className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                            Giá thuê/ngày
                          </span>
                          <p className="font-bold text-vanguard-primary">
                            {rentPrice.toLocaleString("vi-VN")} ₫
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                            Giá trị định cọc
                          </span>
                          <p className="font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                            {depositVal.toLocaleString("vi-VN")} ₫
                          </p>
                        </div>
                      </div>

                      {item.rejection_reason && (
                        <p className="mt-2 text-[10px] italic text-red-400">
                          Lý do từ chối: {item.rejection_reason}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-5 flex items-center justify-between gap-2 border-t border-vanguard-light-border pt-3 dark:border-vanguard-dark-border">
                        <button
                          type="button"
                          onClick={() => setSelectedGear(item)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
                        >
                          <Eye size={14} /> Chi tiết
                        </button>

                        {item.approval_status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={() => void handleApprove(item.id)}
                              className="inline-flex items-center gap-1 rounded-v-sm bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                            >
                              <Check size={14} /> Duyệt
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={() => setRejectingGearId(item.id)}
                              className="inline-flex items-center gap-1 rounded-v-sm bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                            >
                              <X size={14} /> Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Footer */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-vanguard-light-border pt-4 dark:border-vanguard-dark-border">
              <span className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Hiển thị Trang {meta.page} / {meta.totalPages} (Tổng cộng {meta.total} bản ghi)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="inline-flex size-8 items-center justify-center rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf text-vanguard-light-text transition hover:bg-vanguard-light-surfDim disabled:opacity-40 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="inline-flex size-8 items-center justify-center rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf text-vanguard-light-text transition hover:bg-vanguard-light-surfDim disabled:opacity-40 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Inspect Modal */}
      {selectedGear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-v border border-vanguard-light-border bg-vanguard-light-surf shadow-2xl dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
            <div className="relative h-64 w-full bg-black">
              <Image
                src={resolveMediaUrl(selectedGear.media?.[0]?.url)}
                alt={selectedGear.name}
                fill
                className="object-contain"
              />
              <button
                type="button"
                onClick={() => setSelectedGear(null)}
                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-vanguard-primary">
                <Tag size={14} /> {selectedGear.category?.name || "Gaming Gear"}
              </div>
              <h2 className="mt-1 font-display text-xl font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                {selectedGear.name}
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Thương hiệu / Model:</span>
                  <p className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                    {selectedGear.brand || "—"} {selectedGear.model ? `/ ${selectedGear.model}` : ""}
                  </p>
                </div>
                <div>
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Mã Serial/IMEI:</span>
                  <p className="font-mono font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                    {selectedGear.serial_number || "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Chủ sở hữu (Lender):</span>
                  <p className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                    {selectedGear.lender?.full_name || selectedGear.owner?.full_name || "Chưa rõ"} ({selectedGear.lender?.email || selectedGear.owner?.email || ""})
                  </p>
                </div>
                <div>
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Thời gian tạo:</span>
                  <p className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                    {new Date(selectedGear.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              {selectedGear.description && (
                <div className="mt-4 rounded-v-sm bg-vanguard-light-surfDim p-3 text-xs dark:bg-vanguard-dark-surfBright">
                  <span className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">Mô tả sản phẩm:</span>
                  <p className="mt-1 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{selectedGear.description}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-vanguard-light-border pt-4 dark:border-vanguard-dark-border">
                <button
                  type="button"
                  onClick={() => setSelectedGear(null)}
                  className="rounded-v-sm px-4 py-2 text-xs font-semibold text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
                >
                  Đóng
                </button>
                {selectedGear.approval_status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setRejectingGearId(selectedGear.id)}
                      className="rounded-v-sm bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
                    >
                      Từ chối
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleApprove(selectedGear.id)}
                      className="rounded-v-sm bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      Phê duyệt thiết bị
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingGearId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-6 shadow-2xl dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
            <h3 className="font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
              Từ chối đăng tải thiết bị
            </h3>
            <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Nhập lý do từ chối để Lender cập nhật lại thông tin hoặc chụp lại ảnh minh họa.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Ảnh sản phẩm bị mờ, thông số cọc chưa hợp lý..."
              className="mt-4 w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-bg p-3 text-xs text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectingGearId(null);
                  setRejectReason("");
                }}
                className="rounded-v-sm px-4 py-2 text-xs font-semibold text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleRejectConfirm()}
                className="rounded-v-sm bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
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
