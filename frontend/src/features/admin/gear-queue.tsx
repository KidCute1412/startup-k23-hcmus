"use client";

import React, { useState, useEffect } from "react";
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
import { AdminPagination } from "@/components/ui/admin-pagination";
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [rejectingGearId, setRejectingGearId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Reset image index whenever a new gear is opened
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedGear?.id]);

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
            <div className="mt-8">
              <AdminPagination
                page={page}
                totalPages={meta.totalPages}
                total={meta.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Inspect Modal */}
      {selectedGear && (() => {
        const modalRentPrice = Number(selectedGear.rent_price_per_day || selectedGear.price_per_day || 0);
        const modalDeposit = Number(selectedGear.value || selectedGear.deposit_fee || 0);
        const modalImages = selectedGear.media ?? [];
        const activeImg = modalImages[activeImageIndex];
        const specs = selectedGear.specifications
          ? (typeof selectedGear.specifications === "object" && !Array.isArray(selectedGear.specifications)
              ? Object.entries(selectedGear.specifications as Record<string, string>)
              : [])
          : [];
        const approvalBadge: Record<string, { label: string; cls: string; dot: string }> = {
          pending:  { label: "Chờ kiểm định", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",   dot: "bg-amber-400" },
          approved: { label: "Đã duyệt",      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
          rejected: { label: "Bị từ chối",    cls: "bg-red-500/15 text-red-400 border-red-500/30",       dot: "bg-red-400" },
        };
        const badgeMeta = approvalBadge[selectedGear.approval_status] ?? approvalBadge.pending;

        const goPrev = () => setActiveImageIndex((i) => (i - 1 + modalImages.length) % modalImages.length);
        const goNext = () => setActiveImageIndex((i) => (i + 1) % modalImages.length);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-md"
            onClick={() => setSelectedGear(null)}
          >
            {/* Wide modal — stop propagation so clicking inside doesn't close */}
            <div
              className="relative flex w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-vanguard-light-surf shadow-2xl dark:bg-vanguard-dark-surf"
              style={{ maxHeight: "92vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── LEFT: Image gallery panel ── */}
              <div className="flex w-[52%] shrink-0 flex-col bg-black">
                {/* Main viewer */}
                <div className="relative flex-1" style={{ minHeight: 0 }}>
                  {activeImg ? (
                    <Image
                      key={activeImg.id}
                      src={resolveMediaUrl(activeImg.url)}
                      alt={`${selectedGear.name} — ảnh ${activeImageIndex + 1}`}
                      fill
                      className="object-contain transition-opacity duration-200"
                      sizes="52vw"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/30 text-sm">Chưa có ảnh</div>
                  )}

                  {/* Prev / Next arrows */}
                  {modalImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/80"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/80"
                      >
                        <ChevronRight size={20} />
                      </button>
                      {/* Counter */}
                      <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white/80 backdrop-blur-sm">
                        {activeImageIndex + 1} / {modalImages.length}
                      </span>
                    </>
                  )}

                  {/* Close btn */}
                  <button
                    type="button"
                    onClick={() => setSelectedGear(null)}
                    className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Thumbnail rail */}
                {modalImages.length > 1 && (
                  <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-white/10 bg-black/60 px-3 py-2.5" style={{ scrollbarWidth: "thin" }}>
                    {modalImages.map((img, i) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setActiveImageIndex(i)}
                        className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150 ${
                          i === activeImageIndex
                            ? "border-vanguard-primary scale-105 shadow-lg shadow-vanguard-primary/30"
                            : "border-white/10 opacity-60 hover:opacity-100 hover:border-white/40"
                        }`}
                      >
                        <Image src={resolveMediaUrl(img.url)} alt={`Ảnh ${i + 1}`} fill className="object-cover" sizes="64px" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── RIGHT: Info panel ── */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header strip */}
                <div className="shrink-0 border-b border-vanguard-light-border bg-vanguard-light-surfDim px-6 py-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfBright">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-vanguard-primary">
                        <Tag size={12} />
                        {selectedGear.category?.name || "Gaming Gear"}
                      </div>
                      <h2 className="mt-1 truncate font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                        {selectedGear.name}
                      </h2>
                    </div>
                    <span className={`mt-0.5 shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeMeta.cls}`}>
                      <span className={`size-1.5 rounded-full ${badgeMeta.dot}`} />
                      {badgeMeta.label}
                    </span>
                  </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-vanguard-primary/10 p-3.5 ring-1 ring-vanguard-primary/20">
                      <p className="text-[10px] uppercase tracking-widest text-vanguard-primary/70">Giá thuê / ngày</p>
                      <p className="mt-1 font-display text-xl font-bold text-vanguard-primary">
                        {modalRentPrice.toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                    <div className="rounded-xl bg-vanguard-light-surfDim p-3.5 ring-1 ring-vanguard-light-border dark:bg-vanguard-dark-surfBright dark:ring-vanguard-dark-border">
                      <p className="text-[10px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Giá trị định cọc</p>
                      <p className="mt-1 font-display text-xl font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                        {modalDeposit > 0 ? `${modalDeposit.toLocaleString("vi-VN")} ₫` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Info table */}
                  <div className="space-y-2.5 text-xs">
                    {([
                      ["Thương hiệu / Model", `${selectedGear.brand || "—"}${selectedGear.model ? " / " + selectedGear.model : ""}`],
                      ["Mã Serial / IMEI", selectedGear.serial_number || "Chưa cập nhật"],
                      ["Chủ sở hữu", `${selectedGear.lender?.full_name || selectedGear.owner?.full_name || "Chưa rõ"} · ${selectedGear.lender?.email || selectedGear.owner?.email || ""}`],
                      ["Thời gian đăng", new Date(selectedGear.created_at).toLocaleString("vi-VN")],
                    ] as [string, string][]).map(([label, val]) => (
                      <div key={label} className="flex items-start gap-2">
                        <span className="w-36 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{label}</span>
                        <span className="flex-1 font-medium text-vanguard-light-text dark:text-vanguard-dark-text">{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  {selectedGear.description && (
                    <div className="rounded-xl bg-vanguard-light-surfDim p-3.5 dark:bg-vanguard-dark-surfBright">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Mô tả sản phẩm</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-vanguard-light-text dark:text-vanguard-dark-text">{selectedGear.description}</p>
                    </div>
                  )}

                  {/* Specifications */}
                  {specs.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Thông số kỹ thuật</p>
                      <div className="overflow-hidden rounded-xl border border-vanguard-light-border dark:border-vanguard-dark-border">
                        {specs.map(([label, val], i) => (
                          <div key={label} className={`flex text-xs ${i % 2 === 0 ? "bg-vanguard-light-surf dark:bg-vanguard-dark-surf" : "bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfBright"}`}>
                            <span className="w-36 shrink-0 border-r border-vanguard-light-border px-3 py-2 font-semibold text-vanguard-light-text dark:border-vanguard-dark-border dark:text-vanguard-dark-text">{label}</span>
                            <span className="flex-1 px-3 py-2 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="shrink-0 flex items-center justify-between gap-3 border-t border-vanguard-light-border bg-vanguard-light-surfDim px-6 py-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfBright">
                  <button
                    type="button"
                    onClick={() => setSelectedGear(null)}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-vanguard-light-textMuted transition hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
                  >
                    Đóng
                  </button>
                  {selectedGear.approval_status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRejectingGearId(selectedGear.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-500"
                      >
                        <X size={13} /> Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleApprove(selectedGear.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                      >
                        <Check size={13} /> Phê duyệt
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}


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
