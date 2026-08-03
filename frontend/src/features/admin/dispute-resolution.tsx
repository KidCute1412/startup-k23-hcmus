"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Scale,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  ShieldOff,
  ChevronRight,
  User,
  Loader2,
  FileImage,
  ShieldAlert,
} from "lucide-react";
import Image from "next/image";

import { useAdminDisputes } from "@/hooks/useAdminDisputes";
import { resolveMediaUrl } from "@/lib/media";
import type { DisputeStatus } from "@/types/dispute";
import type { ResolveDisputePayload } from "@/types/admin";

type ResolutionType = "refund" | "deposit_deduct" | "no_action";

interface DisputeCase {
  id: string;
  order_id: string;
  gear_name: string;
  gear_image: string;
  deposit_amount: number;
  total_rent_fee: number;
  created_at: string;
  renter: {
    id: string;
    name: string;
    email: string;
    claim: string;
    proof_media: { url: string; mediaType: string }[];
  };
  lender: {
    id: string;
    name: string;
    email: string;
    claim: string;
    proof_media: { url: string; mediaType: string }[];
  };
  status: DisputeStatus;
  resolution?: {
    type: ResolutionType;
    deduct_amount?: number;
    note: string;
    resolved_at: string;
  };
}

export function DisputeResolutionFeature() {
  const {
    disputes: rawDisputes,
    meta,
    loading: isLoading,
    error: hookError,
    isNonAdmin,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    resolveDispute,
  } = useAdminDisputes(undefined, 1, 10);

  const [activeCase, setActiveCase] = useState<DisputeCase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Form states
  const [resolutionType, setResolutionType] =
    useState<ResolutionType>("deposit_deduct");
  const [deductAmount, setDeductAmount] = useState<number>(300000);
  const [resolutionNote, setResolutionNote] = useState<string>(
    "Căn cứ hình ảnh bàn giao và đối soát bằng chứng hoàn trả: Xác nhận hỏng hóc thiết bị do quá trình sử dụng của Renter. Chấp thuận khấu trừ tiền cọc để bồi thường cho Lender."
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Memoize mapped disputes to prevent infinite re-render loop in useEffect
  const disputes: DisputeCase[] = useMemo(() => {
    return (rawDisputes || []).map((item) => {
      const renterId = item.rentalOrder?.renter?.id;
      const lenderId = item.rentalOrder?.lender?.id;

      // Filter evidence specifically by uploadedBy user ID
      let renterEvidences = (item.evidences || []).filter(
        (e) => renterId && e.uploadedBy === renterId
      );
      let lenderEvidences = (item.evidences || []).filter(
        (e) => lenderId && e.uploadedBy === lenderId
      );

      // If reporter is renter and no explicit uploadedBy match, attribute dispute evidences to renter
      if (item.reporterRole === "renter" && renterEvidences.length === 0 && item.evidences) {
        renterEvidences = item.evidences;
      }
      // If reporter is lender and no explicit uploadedBy match, attribute dispute evidences to lender
      if (item.reporterRole === "lender" && lenderEvidences.length === 0 && item.evidences) {
        lenderEvidences = item.evidences;
      }

      return {
        id: item.id,
        order_id: item.rentalOrder?.orderCode || item.rentalOrderId.slice(0, 8).toUpperCase(),
        gear_name: item.rentalOrder?.gear?.name || "Thiết bị thuê",
        gear_image: resolveMediaUrl(item.rentalOrder?.gear?.mediaUrls?.[0]),
        deposit_amount: item.rentalOrder?.depositAmount || 0,
        total_rent_fee: item.rentalOrder?.totalRentFee || 0,
        created_at: item.createdAt,
        renter: {
          id: renterId || "",
          name: item.rentalOrder?.renter?.fullName || "Người thuê",
          email: item.rentalOrder?.renter?.email || "",
          claim: item.reporterRole === "renter" ? item.description || item.reason : "Chưa có báo cáo từ Người thuê",
          proof_media: renterEvidences
            .filter((e) => e.url && e.url.trim().length > 0)
            .map((e) => ({ url: resolveMediaUrl(e.url), mediaType: e.mediaType || "image" })),
        },
        lender: {
          id: lenderId || "",
          name: item.rentalOrder?.lender?.fullName || "Chủ sở hữu",
          email: item.rentalOrder?.lender?.email || "",
          claim: item.reporterRole === "lender" ? item.description || item.reason : "Chưa có báo cáo từ Chủ sở hữu",
          proof_media: lenderEvidences
            .filter((e) => e.url && e.url.trim().length > 0)
            .map((e) => ({ url: resolveMediaUrl(e.url), mediaType: e.mediaType || "image" })),
        },
        status: item.status,
        resolution: item.resolvedAt ? {
          type: (item.resolutionType as ResolutionType) || "deposit_deduct",
          deduct_amount: item.deductAmount || undefined,
          note: item.resolutionNote || "",
          resolved_at: item.resolvedAt,
        } : undefined,
      };
    });
  }, [rawDisputes]);

  // Update activeCase safely when disputes array updates
  useEffect(() => {
    if (disputes.length > 0) {
      setActiveCase((prev) => {
        if (!prev) return disputes[0];
        const refreshed = disputes.find((d) => d.id === prev.id);
        return refreshed || disputes[0];
      });
    } else {
      setActiveCase(null);
    }
  }, [disputes]);

  // Adjust default deduct amount when active case changes
  useEffect(() => {
    if (activeCase && activeCase.deposit_amount > 0) {
      setDeductAmount((prev) =>
        prev > activeCase.deposit_amount ? activeCase.deposit_amount : prev
      );
    }
  }, [activeCase]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || activeCase.status === "resolved" || activeCase.status === "closed") return;

    setApiError(null);
    setIsSubmitting(true);

    try {
      const payload: ResolveDisputePayload = {
        resolutionType,
        deductAmount:
          resolutionType === "deposit_deduct"
            ? Math.max(1, Math.floor(deductAmount))
            : undefined,
        resolutionNote: resolutionNote.trim() || undefined,
      };

      await resolveDispute(activeCase.id, payload);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      setApiError(
        err.message || "Phân xử tranh chấp thất bại. Vui lòng kiểm tra lại số tiền khấu trừ hoặc trạng thái đơn."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusTabs: Array<{ id: DisputeStatus | "all"; label: string }> = [
    { id: "all", label: "Tất cả tranh chấp" },
    { id: "open", label: "Đang mở (Open)" },
    { id: "under_review", label: "Đang xem xét (Under Review)" },
    { id: "resolved", label: "Đã xử lý (Resolved)" },
    { id: "closed", label: "Đã đóng (Closed)" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="size-7 text-vanguard-primary" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-vanguard-light-text dark:text-vanguard-dark-text sm:text-3xl">
              Giải quyết Tranh chấp
            </h1>
          </div>
          <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-sm">
            Phân xử khiếu nại giữa Renter & Lender, quyết định khấu trừ cọc hoặc hoàn tiền (POST /admin/disputes/:id/resolve)
          </p>
        </div>
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
                {hookError || "Truy cập bị từ chối: Tài khoản của bạn không có quyền Quản trị viên (ADMIN_ONLY)."}
              </p>
              <p className="mt-2 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Endpoint API: <code className="rounded bg-black/20 px-1 py-0.5 font-mono">GET /admin/disputes</code> yêu cầu đăng nhập bằng tài khoản Quản trị viên (Role: <code className="font-mono">admin</code>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {!isNonAdmin && (
        <div className="mb-6 flex overflow-x-auto space-x-2 border-b border-vanguard-light-border dark:border-vanguard-dark-border pb-3">
          {statusTabs.map((tab) => {
            const isActive =
              tab.id === "all" ? statusFilter === undefined : statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setStatusFilter(tab.id === "all" ? undefined : (tab.id as DisputeStatus))
                }
                className={`whitespace-nowrap rounded-v-sm px-4 py-2 text-xs font-bold transition ${
                  isActive
                    ? "bg-vanguard-primary text-vanguard-dark-bg"
                    : "bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfDim text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {(apiError || (hookError && !isNonAdmin)) && (
        <div className="mb-6 rounded-v-sm border border-red-500/40 bg-red-500/10 p-4 text-xs font-semibold text-red-500">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <span>{apiError || hookError}</span>
          </div>
        </div>
      )}

      {!isNonAdmin && (
        <>
          {isLoading ? (
            <div className="flex py-16 justify-center items-center text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-vanguard-primary" />
              <span>Đang tải danh sách khiếu nại...</span>
            </div>
          ) : disputes.length === 0 ? (
            <div className="rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-12 text-center dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
              <Scale className="mx-auto h-12 w-12 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted" />
              <h3 className="mt-4 font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                Hiện không có tranh chấp nào cần xử lý
              </h3>
              <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Tất cả các đơn thuê đều hoạt động bình thường hoặc đã được phân xử xong.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left Column: Dispute Cases List */}
              <div className="space-y-4 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xs font-bold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Vụ việc tranh chấp ({meta?.total ?? disputes.length})
                  </h2>
                  {meta && meta.totalPages > 1 && (
                    <span className="text-xs text-vanguard-primary font-mono font-bold">
                      Trang {meta.page} / {meta.totalPages}
                    </span>
                  )}
                </div>

                {disputes.map((caseItem) => {
                  const isSelected = activeCase?.id === caseItem.id;
                  return (
                    <button
                      key={caseItem.id}
                      type="button"
                      onClick={() => setActiveCase(caseItem)}
                      className={`w-full rounded-v border p-4 text-left transition ${
                        isSelected
                          ? "border-vanguard-primary bg-vanguard-primary/10 shadow-md"
                          : "border-vanguard-light-border bg-vanguard-light-surf hover:border-vanguard-primary/50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-vanguard-primary">
                          {caseItem.order_id}
                        </span>
                        {caseItem.status === "open" ? (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                            Đang mở
                          </span>
                        ) : caseItem.status === "under_review" ? (
                          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                            Đang xem xét
                          </span>
                        ) : caseItem.status === "resolved" ? (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                            Đã xử lý
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                            Đã đóng
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-v-sm bg-black">
                          <Image src={caseItem.gear_image} alt={caseItem.gear_name} fill className="object-cover" />
                        </div>
                        <div className="flex-1">
                          <h3 className="line-clamp-2 font-display text-sm font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                            {caseItem.gear_name}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                        <span>Tiền cọc: {caseItem.deposit_amount.toLocaleString("vi-VN")} ₫</span>
                        <ChevronRight size={14} />
                      </div>
                    </button>
                  );
                })}

                {/* Pagination Controls */}
                {meta && meta.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-vanguard-light-border dark:border-vanguard-dark-border">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="rounded border border-gray-700 px-3 py-1.5 text-xs font-bold text-gray-300 hover:bg-gray-800 disabled:opacity-40 transition"
                    >
                      ← Trang trước
                    </button>
                    <span className="text-xs text-gray-400">
                      {page} / {meta.totalPages}
                    </span>
                    <button
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage(page + 1)}
                      className="rounded border border-gray-700 px-3 py-1.5 text-xs font-bold text-gray-300 hover:bg-gray-800 disabled:opacity-40 transition"
                    >
                      Trang sau →
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Case Workspace & Resolution Form */}
              {activeCase && (
                <div className="space-y-6 lg:col-span-2">
                  {/* Active Case Details Card */}
                  <div className="rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-6 shadow-md dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vanguard-light-border pb-4 dark:border-vanguard-dark-border">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-v-sm bg-black">
                          <Image src={activeCase.gear_image} alt={activeCase.gear_name} fill className="object-cover" />
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-vanguard-primary">
                            Mã đơn thuê: {activeCase.order_id}
                          </span>
                          <h2 className="mt-1 font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                            {activeCase.gear_name}
                          </h2>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Tiền cọc phong tỏa:</span>
                        <h2 className="item-end mt-1 font-mono text-xl font-bold text-vanguard-primary">
                          {activeCase.deposit_amount.toLocaleString("vi-VN")} ₫
                        </h2>
                      </div>
                    </div>

                    {/* Evidence Comparison Grid */}
                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Renter Claim */}
                      <div className="rounded-v-sm border border-blue-500/30 bg-blue-500/5 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
                          <User size={14} />
                          <span>NGƯỜI THUÊ (RENTER): {activeCase.renter.name}</span>
                        </div>
                        <p className="mt-2 text-xs text-vanguard-light-text dark:text-vanguard-dark-text italic">
                          &quot;{activeCase.renter.claim}&quot;
                        </p>

                        {activeCase.renter.proof_media.length > 0 ? (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {activeCase.renter.proof_media.map((media, idx) => (
                              <div key={idx} className="relative h-28 w-full overflow-hidden rounded-v-sm bg-black">
                                {media.mediaType === "video" ? (
                                  <video
                                    src={media.url}
                                    controls
                                    muted
                                    preload="metadata"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={media.url}
                                    alt={`Bằng chứng Renter ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      if (!target.dataset.fallback) {
                                        target.dataset.fallback = "1";
                                        target.src = "/gear-placeholder.svg";
                                      }
                                    }}
                                  />
                                )}
                                <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-white">
                                  {media.mediaType === "video" ? "Video" : "Ảnh"} Renter #{idx + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 flex h-24 items-center justify-center rounded-v-sm border border-dashed border-blue-400/30 bg-blue-500/5 text-center text-xs text-gray-400">
                            <FileImage className="mr-1.5 h-4 w-4 text-gray-400" />
                            <span>Chưa cung cấp hình ảnh bằng chứng</span>
                          </div>
                        )}
                      </div>

                      {/* Lender Claim */}
                      <div className="rounded-v-sm border border-purple-500/30 bg-purple-500/5 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-500">
                          <User size={14} />
                          <span>CHỦ THIẾT BỊ (LENDER): {activeCase.lender.name}</span>
                        </div>
                        <p className="mt-2 text-xs text-vanguard-light-text dark:text-vanguard-dark-text italic">
                          &quot;{activeCase.lender.claim}&quot;
                        </p>

                        {activeCase.lender.proof_media.length > 0 ? (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {activeCase.lender.proof_media.map((media, idx) => (
                              <div key={idx} className="relative h-28 w-full overflow-hidden rounded-v-sm bg-black">
                                {media.mediaType === "video" ? (
                                  <video
                                    src={media.url}
                                    controls
                                    muted
                                    preload="metadata"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={media.url}
                                    alt={`Bằng chứng Lender ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      if (!target.dataset.fallback) {
                                        target.dataset.fallback = "1";
                                        target.src = "/gear-placeholder.svg";
                                      }
                                    }}
                                  />
                                )}
                                <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-white">
                                  {media.mediaType === "video" ? "Video" : "Ảnh"} Lender #{idx + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 flex h-24 items-center justify-center rounded-v-sm border border-dashed border-purple-400/30 bg-purple-500/5 text-center text-xs text-gray-400">
                            <FileImage className="mr-1.5 h-4 w-4 text-gray-400" />
                            <span>Chưa cung cấp hình ảnh bằng chứng</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resolution Form or Persisted Summary */}
                    {activeCase.status === "open" || activeCase.status === "under_review" ? (
                      <form onSubmit={handleResolveSubmit} className="mt-8 border-t border-vanguard-light-border pt-6 dark:border-vanguard-dark-border">
                        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-vanguard-light-text dark:text-vanguard-dark-text">
                          Form Phân xử của Quản trị viên (Admin Resolution Action)
                        </h3>

                        <div className="mt-4 space-y-4">
                          {/* Resolution Type Selection */}
                          <div>
                            <label className="block text-xs font-bold text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted uppercase tracking-wider mb-2">
                              Hình thức Phân xử (resolutionType)
                            </label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <button
                                type="button"
                                onClick={() => setResolutionType("deposit_deduct")}
                                className={`rounded-v-sm border p-3 text-left text-xs font-bold transition ${
                                  resolutionType === "deposit_deduct"
                                    ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary"
                                    : "border-vanguard-light-border bg-vanguard-light-bg text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                                }`}
                              >
                                <DollarSign size={16} className="mb-1" />
                                Khấu trừ cọc (deposit_deduct)
                              </button>

                              <button
                                type="button"
                                onClick={() => setResolutionType("refund")}
                                className={`rounded-v-sm border p-3 text-left text-xs font-bold transition ${
                                  resolutionType === "refund"
                                    ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary"
                                    : "border-vanguard-light-border bg-vanguard-light-bg text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                                }`}
                              >
                                <CheckCircle2 size={16} className="mb-1 text-emerald-500" />
                                Hoàn cọc 100% (refund)
                              </button>

                              <button
                                type="button"
                                onClick={() => setResolutionType("no_action")}
                                className={`rounded-v-sm border p-3 text-left text-xs font-bold transition ${
                                  resolutionType === "no_action"
                                    ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary"
                                    : "border-vanguard-light-border bg-vanguard-light-bg text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                                }`}
                              >
                                <ShieldOff size={16} className="mb-1 text-gray-400" />
                                Không khấu trừ (no_action)
                              </button>
                            </div>
                          </div>

                          {/* Deduct Amount Field */}
                          {resolutionType === "deposit_deduct" && (
                            <div>
                              <label className="block text-xs font-bold text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted uppercase tracking-wider mb-1">
                                Số tiền khấu trừ (deductAmount - VNĐ) <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={activeCase.deposit_amount}
                                value={deductAmount}
                                onChange={(e) => setDeductAmount(Number(e.target.value))}
                                className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-bg p-3 text-xs font-mono font-bold text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                              />
                            </div>
                          )}

                          {/* Resolution Note Field */}
                          <div>
                            <label className="block text-xs font-bold text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted uppercase tracking-wider mb-1">
                              Ghi chú Phân xử của Admin (resolutionNote)
                            </label>
                            <textarea
                              rows={3}
                              value={resolutionNote}
                              onChange={(e) => setResolutionNote(e.target.value)}
                              className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-bg p-3 text-xs text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                            />
                          </div>

                          {/* Submit Action */}
                          <div className="flex justify-end pt-2">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="inline-flex items-center gap-2 rounded-v-sm bg-vanguard-primary px-6 py-2.5 font-display text-xs font-bold text-vanguard-dark-bg shadow-md transition hover:opacity-90 disabled:opacity-50"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Đang xử lý...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={16} />
                                  <span>Xác nhận Phân xử Tranh chấp</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="mt-8 border-t border-vanguard-light-border pt-6 dark:border-vanguard-dark-border">
                        <div className={`rounded-v-sm border p-5 ${
                          activeCase.status === "closed"
                            ? "border-gray-500/30 bg-gray-500/10"
                            : "border-emerald-500/30 bg-emerald-500/10"
                        }`}>
                          <div className={`flex items-center gap-2 font-bold text-sm ${
                            activeCase.status === "closed" ? "text-gray-400" : "text-emerald-500"
                          }`}>
                            <CheckCircle2 size={18} />
                            <span>
                              {activeCase.status === "closed"
                                ? "Vụ việc tranh chấp này đã bị đóng"
                                : "Vụ việc tranh chấp này đã được Admin phân xử hoàn tất"}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                            <div>
                              <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted block mb-1">Hình thức phân xử:</span>
                              <span className="font-bold uppercase tracking-wider text-vanguard-primary">
                                {activeCase.resolution?.type === "deposit_deduct"
                                  ? "Khấu trừ tiền cọc (deposit_deduct)"
                                  : activeCase.resolution?.type === "refund"
                                  ? "Hoàn tiền cọc 100% (refund)"
                                  : "Không khấu trừ (no_action)"}
                              </span>
                            </div>

                            {activeCase.resolution?.deduct_amount !== undefined && (
                              <div>
                                <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted block mb-1">Số tiền khấu trừ:</span>
                                <span className="font-mono font-bold text-red-400 text-sm">
                                  {activeCase.resolution.deduct_amount.toLocaleString("vi-VN")} ₫
                                </span>
                              </div>
                            )}
                          </div>

                          {activeCase.resolution?.note && (
                            <div className="mt-4 text-xs">
                              <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted block mb-1">Ghi chú phân xử của Admin:</span>
                              <p className="rounded bg-black/30 p-3 text-vanguard-light-text dark:text-vanguard-dark-text">
                                {activeCase.resolution.note}
                              </p>
                            </div>
                          )}

                          {activeCase.resolution?.resolved_at && (
                            <div className="mt-3 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                              Thời điểm phân xử: {new Date(activeCase.resolution.resolved_at).toLocaleString("vi-VN")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && activeCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-v border border-vanguard-primary/40 bg-vanguard-light-surf p-6 shadow-2xl dark:border-vanguard-primary/40 dark:bg-vanguard-dark-surf">
            <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
            <h3 className="mt-3 text-center font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
              Đã Phân xử Tranh chấp Thành công!
            </h3>
            <p className="mt-2 text-center text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Hệ thống đã giải quyết khiếu nại cho đơn hàng <code className="font-mono text-vanguard-primary">{activeCase.order_id}</code> và tự động giải tỏa/khấu trừ tiền cọc escrow.
            </p>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSuccessModalOpen(false)}
                className="rounded-v-sm bg-vanguard-primary px-6 py-2 text-xs font-bold text-vanguard-dark-bg"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
