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
  Clock3,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { AdminPagination } from "@/components/ui/admin-pagination";

import { useAdminDisputes } from "@/hooks/useAdminDisputes";
import { resolveMediaUrl } from "@/lib/media";
import type { DisputeStatus } from "@/types/dispute";
import type { ResolveDisputePayload } from "@/types/admin";

type ResolutionType =
  | "renter_compensation"
  | "lender_compensation"
  | "no_action"
  | "refund"
  | "deposit_deduct";

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
  reviewed_at?: string;
  resolved_at?: string;
  closed_at?: string;
  close_note?: string;
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
    startDisputeReview,
    closeDispute,
    limit,
    setLimit,
  } = useAdminDisputes(undefined, 1, 10);

  const [activeCase, setActiveCase] = useState<DisputeCase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Form states
  const [resolutionType, setResolutionType] =
    useState<ResolutionType>("lender_compensation");
  const [deductAmount, setDeductAmount] = useState<number>(300000);
  const [resolutionNote, setResolutionNote] = useState<string>(
    "Căn cứ hình ảnh bàn giao và đối soát bằng chứng của hai bên, Admin xác định phương án settlement theo mức độ trách nhiệm thực tế."
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [closeNote, setCloseNote] = useState("");

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
        reviewed_at: item.reviewedAt || undefined,
        resolved_at: item.resolvedAt || undefined,
        closed_at: item.closedAt || undefined,
        close_note: item.closeNote || undefined,
        resolution: item.resolvedAt ? {
           type: (item.resolutionType as ResolutionType) || "lender_compensation",
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

  // Keep the selected compensation within the winning party's funding source.
  useEffect(() => {
    if (activeCase) {
      const maxAmount =
        resolutionType === "renter_compensation"
          ? activeCase.total_rent_fee
          : activeCase.deposit_amount;
      if (maxAmount <= 0) return;
      setDeductAmount((prev) =>
        prev <= 0 ? maxAmount : Math.min(prev, maxAmount),
      );
    }
  }, [activeCase, resolutionType]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || activeCase.status === "resolved" || activeCase.status === "closed") return;

    setApiError(null);
    setIsSubmitting(true);

    try {
      const payload: ResolveDisputePayload = {
        resolutionType,
        deductAmount:
          resolutionType === "renter_compensation" ||
          resolutionType === "lender_compensation" ||
          resolutionType === "deposit_deduct"
            ? Math.max(1, Math.floor(deductAmount))
            : undefined,
        resolutionNote: resolutionNote.trim() || undefined,
      };

      await resolveDispute(activeCase.id, payload);
      setSuccessMessage("Đã settlement và chuyển dispute sang trạng thái Đã phân xử.");
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      setApiError(
        err.message || "Phân xử tranh chấp thất bại. Vui lòng kiểm tra lại số tiền khấu trừ hoặc trạng thái đơn."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartReview = async () => {
    if (!activeCase || activeCase.status !== "open") return;
    setApiError(null);
    setIsTransitioning(true);
    try {
      await startDisputeReview(activeCase.id);
      setSuccessMessage("Đã tiếp nhận hồ sơ và chuyển sang Đang xem xét.");
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      setApiError(err.message || "Không thể bắt đầu xem xét hồ sơ.");
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleClose = async () => {
    if (!activeCase || activeCase.status !== "resolved") return;
    setApiError(null);
    setIsTransitioning(true);
    try {
      await closeDispute(activeCase.id, closeNote.trim() || undefined);
      setSuccessMessage("Đã đóng hồ sơ dispute. Không phát sinh thêm settlement.");
      setIsSuccessModalOpen(true);
      setCloseNote("");
    } catch (err: any) {
      setApiError(err.message || "Không thể đóng hồ sơ.");
    } finally {
      setIsTransitioning(false);
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
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-3 text-xs dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
            <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Queue được tải theo trang; trạng thái mới nhất sẽ được ưu tiên hiển thị.
            </span>
            <label className="flex items-center gap-2 font-semibold">
              Số bản ghi/trang
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="rounded-v-sm border border-vanguard-light-border bg-transparent px-2 py-1 dark:border-vanguard-dark-border">
                {[10, 20, 50].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>
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
                  <div className="pt-4">
                    <AdminPagination
                      page={page}
                      totalPages={meta.totalPages}
                      total={meta.total}
                      onPageChange={setPage}
                    />
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

                    <div className="mt-5 rounded-v-sm border border-vanguard-primary/20 bg-vanguard-primary/5 p-4">
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-vanguard-primary">
                        <Clock3 size={15} /> Luồng xử lý hồ sơ
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        {["open", "under_review", "resolved", "closed"].map((status, index) => {
                          const labels: Record<string, string> = { open: "Mới gửi", under_review: "Đang xem xét", resolved: "Đã phân xử", closed: "Đã đóng" };
                          const reached = ["open", "under_review", "resolved", "closed"].indexOf(activeCase.status) >= index;
                          const date = status === "open" ? activeCase.created_at : status === "under_review" ? activeCase.reviewed_at : status === "resolved" ? activeCase.resolved_at : activeCase.closed_at;
                          return <React.Fragment key={status}>
                            <span className="flex flex-col items-center gap-1">
                              <span className={`rounded-full px-2.5 py-1 ${reached ? "bg-vanguard-primary text-vanguard-dark-bg" : "bg-black/10 text-vanguard-light-textMuted dark:bg-white/10 dark:text-vanguard-dark-textMuted"}`}>{labels[status]}</span>
                              {date && <time className="font-normal text-[9px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{new Date(date).toLocaleDateString("vi-VN")}</time>}
                            </span>
                            {index < 3 && <ArrowRight size={12} className="text-vanguard-light-textMuted" />}
                          </React.Fragment>;
                        })}
                      </div>
                      <p className="mt-3 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                        {activeCase.status === "open" && "Bước tiếp theo: admin tiếp nhận hồ sơ để bắt đầu kiểm tra bằng chứng."}
                        {activeCase.status === "under_review" && "Bước tiếp theo: chọn phương án settlement và xác nhận tác động tài chính."}
                        {activeCase.status === "resolved" && "Bước tiếp theo: kiểm tra kết quả và đóng hồ sơ khi đã hoàn tất."}
                        {activeCase.status === "closed" && "Hồ sơ đã hoàn tất và chỉ còn ở chế độ xem."}
                      </p>
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
                    {activeCase.status === "open" ? (
                      <div className="mt-8 border-t border-vanguard-light-border pt-6 dark:border-vanguard-dark-border">
                        <h3 className="font-display text-sm font-bold uppercase tracking-wider">Tiếp nhận hồ sơ</h3>
                        <p className="mt-2 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Hành động này chỉ đổi trạng thái sang Đang xem xét và chưa tác động đến ví hoặc escrow.</p>
                        <button type="button" onClick={handleStartReview} disabled={isTransitioning} className="mt-4 inline-flex items-center gap-2 rounded-v-sm bg-vanguard-primary px-5 py-2.5 text-xs font-bold text-vanguard-dark-bg disabled:opacity-50">
                          {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 size={16} />} Bắt đầu xem xét
                        </button>
                      </div>
                    ) : activeCase.status === "under_review" ? (
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
                                 onClick={() => setResolutionType("renter_compensation")}
                                className={`rounded-v-sm border p-3 text-left text-xs font-bold transition ${
                                   resolutionType === "renter_compensation"
                                    ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary"
                                    : "border-vanguard-light-border bg-vanguard-light-bg text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                                }`}
                              >
                                <DollarSign size={16} className="mb-1" />
                                 Bồi thường renter bằng tiền thuê
                              </button>

                              <button
                                type="button"
                                 onClick={() => setResolutionType("lender_compensation")}
                                className={`rounded-v-sm border p-3 text-left text-xs font-bold transition ${
                                   resolutionType === "lender_compensation"
                                    ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary"
                                    : "border-vanguard-light-border bg-vanguard-light-bg text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                                }`}
                              >
                                <CheckCircle2 size={16} className="mb-1 text-emerald-500" />
                                 Bồi thường lender bằng tiền cọc
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
                                 Không bên nào được bồi thường
                              </button>
                            </div>
                          </div>

                          {/* Deduct Amount Field */}
                          {(resolutionType === "renter_compensation" ||
                            resolutionType === "lender_compensation") && (
                            <div>
                              <label className="block text-xs font-bold text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted uppercase tracking-wider mb-1">
                                Số tiền bồi thường (VNĐ) <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={
                                  resolutionType === "renter_compensation"
                                    ? activeCase.total_rent_fee
                                    : activeCase.deposit_amount
                                }
                                value={deductAmount}
                                onChange={(e) => setDeductAmount(Number(e.target.value))}
                                className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-bg p-3 text-xs font-mono font-bold text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                              />
                              <p className="mt-1 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                                Tối đa: {(
                                  resolutionType === "renter_compensation"
                                    ? activeCase.total_rent_fee
                                    : activeCase.deposit_amount
                                ).toLocaleString("vi-VN")} ₫
                              </p>
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
                    ) : activeCase.status === "resolved" ? (
                      <div className="mt-8 border-t border-vanguard-light-border pt-6 dark:border-vanguard-dark-border">
                        <h3 className="font-display text-sm font-bold uppercase tracking-wider">Đóng hồ sơ</h3>
                        <p className="mt-2 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Settlement đã hoàn tất. Đóng hồ sơ chỉ ghi nhận hoàn tất quy trình và không chạy lại giao dịch tài chính.</p>
                        <textarea value={closeNote} onChange={(e) => setCloseNote(e.target.value)} maxLength={2000} rows={2} placeholder="Ghi chú đóng hồ sơ (không bắt buộc)" className="mt-4 w-full rounded-v-sm border border-vanguard-light-border bg-transparent p-3 text-xs dark:border-vanguard-dark-border" />
                        <button type="button" onClick={handleClose} disabled={isTransitioning} className="mt-3 inline-flex items-center gap-2 rounded-v-sm bg-vanguard-primary px-5 py-2.5 text-xs font-bold text-vanguard-dark-bg disabled:opacity-50">
                          {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={16} />} Đóng hồ sơ
                        </button>
                      </div>
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
                                 {activeCase.resolution?.type === "renter_compensation"
                                   ? "Bồi thường renter bằng tiền thuê"
                                   : activeCase.resolution?.type === "lender_compensation" ||
                                     activeCase.resolution?.type === "deposit_deduct"
                                   ? "Bồi thường lender bằng tiền cọc"
                                   : activeCase.resolution?.type === "refund"
                                   ? "Hoàn cọc (phương án cũ)"
                                   : "Không bên nào được bồi thường"}
                              </span>
                            </div>

                              {activeCase.resolution?.type === "renter_compensation" ? (
                                <div>
                                 <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted block mb-1">
                                   Renter được hoàn tiền thuê:
                                 </span>
                                 <span className="font-mono font-bold text-emerald-500 text-sm">
                                    {(activeCase.resolution.deduct_amount ?? activeCase.total_rent_fee).toLocaleString("vi-VN")} ₫
                                 </span>
                               </div>
                             ) : activeCase.resolution?.deduct_amount !== undefined && (
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

                          {activeCase.close_note && (
                            <div className="mt-4 text-xs">
                              <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted block mb-1">Ghi chú đóng hồ sơ:</span>
                              <p className="rounded bg-black/30 p-3 text-vanguard-light-text dark:text-vanguard-dark-text">{activeCase.close_note}</p>
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
              {successMessage} <code className="font-mono text-vanguard-primary">{activeCase.order_id}</code>
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
