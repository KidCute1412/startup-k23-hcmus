"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatRow } from "@/components/ui/stat-row";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { useRentalOrder } from "@/hooks/useRentalOrder";
import { useRentalProof } from "@/hooks/useRentalProof";
import { useAuth } from "@/hooks/useAuth";
import { statusConfig } from "./orders-overview";
import type { RentalOrder } from "@/types/rentals";
import type { ProofStage } from "@/types/rentals";
import { resolveMediaUrl } from "@/lib/media";
import { SubmitDisputeModal } from "./submit-dispute-modal";
import { UploadProofModal } from "./upload-proof-modal";
import { PROOF_STAGE_LABELS } from "./proof-stage-labels";

export interface OrderDetailViewProps {
  orderId: string;
  /** Base path for the back-link (default: /orders) */
  backPath?: string;
  backLabel?: string;
}

function calculateDays(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (isNaN(diff)) return 0;
  return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
}

function toMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function generateTimeline(order: RentalOrder) {
  const isCanceled = order.status === "cancelled";
  const isActive = (statusesToCheck: string[]) =>
    !isCanceled && statusesToCheck.includes(order.status);

  const steps = [
    {
      title: "Tạo đơn thuê",
      description: "Người thuê đã gửi yêu cầu mượn gear",
      timestamp: order.createdAt ?? order.created_at ?? "",
      completed: true,
    },
    {
      title: "Xác nhận đơn",
      description: "Chủ gear đã duyệt và đóng băng tiền cọc",
      timestamp: "",
      completed: isActive([
        "confirmed",
        "delivering",
        "active",
        "returning",
        "completed",
      ]),
    },
    {
      title: "Đang giao hàng",
      description: "Chủ gear đang chuyển gear tới địa chỉ nhận",
      timestamp: order.lender_shipped_at ?? "",
      completed: isActive(["delivering", "active", "returning", "completed"]),
    },
    {
      title: "Đã nhận gear",
      description: "Đơn thuê đang trong thời gian sử dụng",
      timestamp: order.renter_received_at ?? "",
      completed: isActive(["active", "returning", "completed"]),
    },
    {
      title: "Đang hoàn trả gear",
      description: "Người thuê đã gửi trả gear cho chủ sở hữu",
      timestamp: order.renter_returned_at ?? "",
      completed: isActive(["returning", "completed"]),
    },
    {
      title: "Đã hoàn tất",
      description: "Chủ gear đã nhận lại và nghiệm thu an toàn",
      timestamp: order.lender_received_back_at ?? "",
      completed: isActive(["completed"]),
    },
  ];

  if (isCanceled) {
    steps.push({
      title: "Đã hủy đơn",
      description: "Đơn thuê đã bị hủy trước khi xác nhận",
      timestamp: order.updatedAt ?? "",
      completed: true,
    });
  }

  if (order.status === "disputed") {
    steps.push({
      title: "Đang khiếu nại",
      description: "Đơn thuê đang được Admin xem xét và giải quyết tranh chấp",
      timestamp: "",
      completed: true,
    });
  }

  return steps;
}

export function OrderDetailView({
  orderId,
  backPath = "/orders",
  backLabel = "Quay lại danh sách đơn thuê",
}: OrderDetailViewProps) {
  const { user } = useAuth();
  const {
    currentOrder: order,
    isLoading: loadingOrder,
    error: orderError,
    fetchOrder,
    confirmOrder,
    shipOrder,
    confirmReceipt,
    returnOrder,
    confirmReturn,
    cancelOrder,
  } = useRentalOrder();
  const {
    proofs,
    isLoading: loadingProofs,
    fetchProofs,
    uploadProofBatch,
  } = useRentalProof(orderId);
  const [activeModal, setActiveModal] = useState<
    | "shipment"
    | "receipt"
    | "return"
    | "return-confirm"
    | "cancel"
    | "dispute"
    | "dispute-response"
    | null
  >(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [hasLoadedOrder, setHasLoadedOrder] = useState(false);

  useEffect(() => {
    setHasLoadedOrder(false);
    void Promise.allSettled([fetchOrder(orderId), fetchProofs()]).finally(
      () => {
        setHasLoadedOrder(true);
      },
    );
  }, [orderId, fetchOrder, fetchProofs]);

  if (!hasLoadedOrder || (loadingOrder && !order)) {
    return (
      <div className="py-10 text-center text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
        Đang tải thông tin chi tiết đơn thuê...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-10 text-center text-sm text-red-500">
        {orderError || "Không tìm thấy đơn thuê!"}
      </div>
    );
  }

  const config = statusConfig[order.status] || statusConfig.pending_confirm;
  const gearImage = resolveMediaUrl(order.gear?.media?.[0]?.url);
  const gearTitle = order.gear?.name || "Sản phẩm chưa rõ";
  const code = order.order_code || order.id.slice(0, 8).toUpperCase();

  // Resolve IDs from either camelCase or snake_case response
  const renterId = order.renter?.id ?? order.renterId ?? order.renter_id;
  const lenderId = order.lender?.id ?? order.lenderId ?? order.lender_id;
  const renterName =
    order.renter?.full_name ?? order.renter?.fullName ?? "Người thuê";
  const lenderName =
    order.lender?.full_name ?? order.lender?.fullName ?? "Chủ gear";

  const isCurrentRenter = user?.id === renterId;
  const isCurrentLender = user?.id === lenderId;
  const isParticipant = isCurrentRenter || isCurrentLender;

  const startDate = order.start_date ?? order.startDate;
  const endDate = order.end_date ?? order.endDate;
  const totalDays = calculateDays(startDate, endDate);
  const rentalFee = Number(order.rental_fee ?? order.rentPrice ?? 0);
  const depositAmount = Number(order.deposit_amount ?? order.depositCash ?? 0);
  const isCreditLineDeposit =
    (order.deposit_type ?? order.depositType) === 'credit_line';
  const cashRequiredOnConfirm = isCreditLineDeposit
    ? rentalFee
    : rentalFee + depositAmount;
  const isLenderView = user?.id === (order.lender_id ?? order.lenderId);
  const settlement = order.rental_fee_settlement;
  const expectedLenderIncome = Number(settlement?.status === "held" ? order.lender_income ?? 0 : settlement?.lender_income_amount ?? order.lender_income ?? 0);
  const expectedPlatformFee = Number(settlement?.status === "held" ? order.platform_fee ?? 0 : settlement?.platform_fee_amount ?? order.platform_fee ?? 0);
  const timeline = generateTimeline(order);
  const returnDeadline = order.return_deadline_at ?? order.returnDeadlineAt;
  const shipDeadline = order.ship_deadline_at ?? order.shipDeadlineAt;
  const isShipmentLate = Boolean(
    order.status === "confirmed" &&
    shipDeadline &&
    new Date() > new Date(shipDeadline),
  );

  const hasPreShipmentProof = (proofs ?? []).some(
    (p) => p.stage === "pre_shipment",
  );
  const hasPreReturnProof = (proofs ?? []).some(
    (p) => p.stage === "pre_return",
  );
  const hasPostReturnedProof = (proofs ?? []).some(
    (p) => p.stage === "post_returned",
  );
  const canConfirmReturn = hasPreReturnProof && hasPostReturnedProof;
  const isReturnLate = Boolean(
    (order.status === "active" || order.status === "returning") &&
    returnDeadline &&
    (order.renter_returned_at
      ? new Date(order.renter_returned_at) > new Date(returnDeadline)
      : new Date() > new Date(returnDeadline)),
  );
  const currentDispute = order.disputes?.[0];
  const disputeResolutionType =
    currentDispute?.resolution_type ?? currentDispute?.resolutionType;
  const disputeWasResolved =
    currentDispute?.status === "resolved" || currentDispute?.status === "closed";
  const disputeReporterId =
    currentDispute?.reported_by ?? currentDispute?.reportedBy;
  const disputeCreatedAt =
    currentDispute?.created_at ?? currentDispute?.createdAt;
  const disputeDeadline = disputeCreatedAt
    ? new Date(new Date(disputeCreatedAt).getTime() + 3 * 24 * 60 * 60 * 1000)
    : null;
  const hasResponseEvidence = Boolean(
    currentDispute?.evidences?.some(
      (evidence) => (evidence.uploaded_by ?? evidence.uploadedBy) === user?.id,
    ),
  );
  const canSubmitResponse = Boolean(
    order.status === "disputed" &&
    currentDispute &&
    isParticipant &&
    user?.id !== disputeReporterId &&
    !hasResponseEvidence &&
    disputeDeadline &&
    new Date() <= disputeDeadline,
  );

  const showMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 5000);
  };

  const runAction = async (
    action: () => Promise<unknown>,
    successMsg: string,
  ) => {
    try {
      await action();
      // Refresh both order + proofs after any lifecycle action
      fetchOrder(orderId).catch(console.error);
      fetchProofs().catch(console.error);
      showMsg(successMsg);
    } catch (error) {
      showMsg(
        `Lỗi: ${error instanceof Error ? error.message : "Không thể cập nhật đơn thuê."}`,
      );
    }
  };

  const handleConfirmReceiptWithProof = async (
    fileUrls: string[],
    note?: string,
  ) => {
    await confirmReceipt(orderId, fileUrls, note);
    await Promise.all([fetchOrder(orderId), fetchProofs()]);
    showMsg("Đã xác nhận nhận gear và bắt đầu thời gian thuê.");
  };

  const completeShipment = async () => {
    const updated = await shipOrder(orderId);
    await Promise.all([fetchOrder(orderId), fetchProofs()]);
    showMsg(
      updated.status === "cancelled"
        ? "Lender giao trễ, đơn đã hủy và tiền đã hoàn về ví renter."
        : "Đã chuyển sang trạng thái đang giao hàng.",
    );
  };

  const handleShip = async () => {
    try {
      await completeShipment();
    } catch (error) {
      showMsg(
        `Lỗi: ${error instanceof Error ? error.message : "Không thể cập nhật đơn thuê."}`,
      );
    }
  };

  const handleShipWithProof = async (fileUrls: string[], note?: string) => {
    await uploadProofBatch({ stage: "pre_shipment", fileUrls, note });
    await completeShipment();
  };

  const handleReturnWithProof = async (fileUrls: string[], note?: string) => {
    await returnOrder(orderId, fileUrls, note);
    await Promise.all([fetchOrder(orderId), fetchProofs()]);
    showMsg("Đã upload ảnh trả gear và chuyển đơn sang đang trả hàng.");
  };

  const handleConfirmReturnWithProof = async (
    fileUrls: string[],
    note?: string,
  ) => {
    await uploadProofBatch({ stage: "post_returned", fileUrls, note });
    if (!hasPreReturnProof) {
      await fetchProofs();
      showMsg("Đã upload ảnh nghiệm thu. Đang chờ renter upload ảnh trả gear.");
      return;
    }

    await confirmReturn(orderId);
    await Promise.all([fetchOrder(orderId), fetchProofs()]);
    showMsg("Đã nghiệm thu gear, giải phóng escrow và hoàn tất đơn.");
  };

  const handleCancelOrder = async () => {
    await runAction(
      () => cancelOrder(orderId),
      "Đã hủy yêu cầu thuê thành công.",
    );
    setActiveModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={backPath}
          className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted hover:text-vanguard-primary transition"
        >
          ← {backLabel}
        </Link>
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2">
            <Badge tone={config.tone}>
               {order.status === "disputed"
                 ? "Đang khiếu nại"
                 : disputeWasResolved
                   ? "Đã hoàn tất - Đã phân xử"
                   : config.label}
            </Badge>
            {order.status === "disputed" && order.disputes?.[0] && (
              <Badge tone="muted">
                {order.disputes[0].status === "resolved"
                  ? "Đã phân xử, chờ đóng hồ sơ"
                  : order.disputes[0].status === "closed"
                    ? "Đã đóng hồ sơ"
                    : "Khiếu nại đang được xem xét"}
              </Badge>
            )}
          </div>
          <span className="font-mono text-sm font-bold text-vanguard-primary">
            {code}
          </span>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionMsg && (
        <div
          className={`rounded-v-sm border px-4 py-3 text-xs font-semibold ${
            actionMsg.startsWith("Lỗi")
              ? "bg-red-500/10 border-red-500/30 text-red-500"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
          }`}
        >
          {actionMsg}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline + Gear Info + Proofs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Banner */}
          {order.status === "disputed" && (
            <Card className="border-red-500/50 bg-red-50 p-6 dark:bg-red-950/70">
              <div className="flex items-center space-x-2 text-red-400 mb-2">
                <span className="font-display text-lg font-bold uppercase tracking-wider">
                  Đơn thuê đang ở trạng thái Khiếu nại
                </span>
              </div>
              <p className="text-xs leading-relaxed text-red-950 dark:text-red-100">
                Tranh chấp đã được ghi nhận. Tiền cọc và khoản thanh toán đang
                được phong tỏa an toàn bởi hệ thống Mutux. Admin sẽ xem xét bằng
                chứng của hai bên và đưa ra quyết định sớm nhất.
              </p>
              {(currentDispute?.response_description ?? currentDispute?.responseDescription) && (
                <p className="mt-3 rounded-v-sm bg-white/60 p-3 text-xs text-red-950 dark:bg-red-900/40 dark:text-red-100">
                  <span className="font-semibold">Mô tả kháng cáo của lender:</span>{" "}
                  {currentDispute.response_description ?? currentDispute.responseDescription}
                </p>
              )}
              {canSubmitResponse && disputeDeadline && (
                <div className="mt-4 rounded-v-sm border border-red-300 bg-white/80 p-3 text-xs font-semibold text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100">
                  Vui lòng upload ảnh kháng cáo trước{" "}
                  {disputeDeadline.toLocaleString("vi-VN")}. Nếu không phản hồi
                  đúng hạn, hồ sơ sẽ được xem xét dựa trên bằng chứng hiện có.
                </div>
              )}
              {order.status === "disputed" &&
                isParticipant &&
                user?.id !== disputeReporterId &&
                !hasResponseEvidence &&
                disputeDeadline &&
                new Date() > disputeDeadline && (
                  <div className="mt-4 rounded-v-sm border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
                    Đã hết thời hạn 3 ngày phản hồi. Admin sẽ phân xử dựa trên
                    bằng chứng hiện có.
                  </div>
                )}
            </Card>
          )}

          {disputeWasResolved && currentDispute && (
            <Card className="border-emerald-500/40 bg-emerald-500/5 p-6 dark:bg-emerald-950/20">
              <h3 className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">
                Kết quả giải quyết tranh chấp
              </h3>
              <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Phương án:
                  </span>
                  <p className="mt-1 font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                    {disputeResolutionType === "renter_compensation"
                      ? "Bồi thường renter bằng tiền thuê"
                      : disputeResolutionType === "lender_compensation" ||
                          disputeResolutionType === "deposit_deduct"
                        ? "Bồi thường lender bằng tiền cọc"
                        : "Không bên nào được bồi thường"}
                  </p>
                </div>
                {disputeResolutionType === "renter_compensation" && (
                  <div>
                    <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      Renter được hoàn tiền thuê:
                    </span>
                    <p className="mt-1 font-bold text-emerald-500">
                      {formatCurrency(
                        Number(
                          currentDispute.deduct_amount ??
                            currentDispute.deductAmount ??
                            order.rental_fee ??
                            order.rentPrice ??
                            0,
                        ),
                      )}
                    </p>
                  </div>
                )}
                {(disputeResolutionType === "lender_compensation" ||
                  disputeResolutionType === "deposit_deduct") && (
                  <div>
                    <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      Lender được bồi thường:
                    </span>
                    <p className="mt-1 font-bold text-amber-500">
                      {formatCurrency(
                        Number(
                          currentDispute.deduct_amount ??
                            currentDispute.deductAmount ??
                            0,
                        ),
                      )}
                    </p>
                  </div>
                )}
              </div>
              {settlement && (
                <DisputeSettlementBreakdown
                  settlement={settlement}
                  resolutionType={disputeResolutionType}
                  resolutionAmount={toMoney(
                    currentDispute.deduct_amount ?? currentDispute.deductAmount,
                  )}
                  isLenderView={isLenderView}
                  depositAmount={depositAmount}
                  isCreditLineDeposit={isCreditLineDeposit}
                  fallbackRentalFee={rentalFee}
                />
              )}
              {(currentDispute.resolution_note ?? currentDispute.resolutionNote) && (
                <p className="mt-4 rounded-v-sm bg-black/10 p-3 text-xs dark:bg-white/5">
                  <span className="font-semibold">Ghi chú Admin:</span>{" "}
                  {currentDispute.resolution_note ?? currentDispute.resolutionNote}
                </p>
              )}
            </Card>
          )}

          {/* Order Lifecycle Timeline */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold mb-6">
              Tiến trình đơn thuê (Order Lifecycle)
            </h3>
            <div className="relative pl-6 border-l-2 border-vanguard-light-border dark:border-vanguard-dark-border space-y-6">
              {timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  <span
                    className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 transition ${
                      step.completed
                        ? "bg-vanguard-primary border-vanguard-primary shadow-[0_0_8px_rgba(212,175,55,0.6)]"
                        : "bg-vanguard-light-surf dark:bg-vanguard-dark-surf border-vanguard-light-border dark:border-vanguard-dark-border"
                    }`}
                  />
                  <div>
                    <h4
                      className={`text-sm font-bold ${step.completed ? "text-vanguard-light-text dark:text-vanguard-dark-text" : "text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"}`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-0.5">
                      {step.description}
                    </p>
                    {step.timestamp && (
                      <span className="text-[10px] font-mono text-vanguard-primary mt-1 block">
                        {new Date(step.timestamp).toLocaleString("vi-VN")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Gear Info */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold mb-4">
              Sản phẩm thuê
            </h3>
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-5">
              <div className="h-28 w-28 overflow-hidden rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfDim flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gearImage}
                  alt={gearTitle}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-display text-xl font-bold">{gearTitle}</h4>
                <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-1">
                  Chủ sở hữu:{" "}
                  <span className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                    {lenderName}
                  </span>
                </p>
                {order.renter?.phone && (
                  <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-0.5">
                    Người thuê:{" "}
                    <span className="font-semibold">{renterName}</span> ·{" "}
                    {order.renter.phone}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      Đơn giá thuê:
                    </span>
                    <p className="font-bold text-vanguard-primary">
                      {formatCurrency(
                        (order.rental_fee ?? order.rentPrice ?? 0) /
                          Math.max(1, totalDays),
                      )}{" "}
                      / ngày
                    </p>
                  </div>
                  <div>
                    <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      Thời hạn thuê:
                    </span>
                   <p className="font-bold">
                       {totalDays} ngày ({formatShortDate(startDate)} –{" "}
                       {formatShortDate(endDate)})
                     </p>
                   </div>
                   {returnDeadline && (
                     <div className="col-span-2 rounded-v-sm border border-vanguard-primary/30 bg-vanguard-primary/5 p-3">
                       <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                         Hạn trả gear:
                       </span>
                       <p
                         className={`font-bold ${isReturnLate ? "text-red-500" : "text-vanguard-primary"}`}
                       >
                         {new Date(returnDeadline).toLocaleString("vi-VN", {
                           timeZone: "Asia/Ho_Chi_Minh",
                         })}
                         {isReturnLate ? " (đã quá hạn)" : " (giờ Việt Nam)"}
                       </p>
                     </div>
                   )}
                 </div>
                {(order.shipping_address ?? order.shippingAddress) && (
                  <div className="mt-3 text-xs">
                    <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      Địa chỉ giao hàng:
                    </span>
                    <p className="font-semibold mt-0.5">
                      {order.shipping_address ?? order.shippingAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Proof Gallery */}
          {!loadingProofs && proofs && proofs.length > 0 && (
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold mb-4">
                Ảnh kiểm định & Bằng chứng nghiệm thu
              </h3>
              <div className="space-y-4">
                {proofs.map((proof) => {
                  const proofUrl = proof.file_url ?? proof.fileUrl;
                  const proofType = proof.proof_type ?? proof.proofType;
                  const proofDate = proof.uploadedAt ?? proof.createdAt;
                  return (
                    <div
                      key={proof.id}
                      className="p-4 rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border bg-vanguard-light-surfDim/40 dark:bg-vanguard-dark-surfDim/40"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-vanguard-primary">
                           {PROOF_STAGE_LABELS[proof.stage as ProofStage]?.title ??
                             proof.stage}
                        </span>
                        {proofDate && (
                          <span className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                            {new Date(proofDate).toLocaleString("vi-VN")}
                          </span>
                        )}
                      </div>
                       {proof.note && (
                         <p className="text-xs text-vanguard-light-text dark:text-vanguard-dark-text mb-3">
                           <span className="font-semibold">Ghi chú:</span>{" "}
                           {proof.note}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {proofType === "image" && proofUrl && (
                          <div className="h-20 w-20 overflow-hidden rounded border border-vanguard-light-border dark:border-vanguard-dark-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={resolveMediaUrl(proofUrl)}
                              alt="Proof"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Actions + Payment */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold mb-4">
              Hành động khả thi
            </h3>
            <div className="space-y-3">
              {/* === LENDER ACTIONS === */}
              {isCurrentLender && order.status === "pending_confirm" && (
                <button
                  onClick={() =>
                    void runAction(
                      () => confirmOrder(orderId),
                      "Đã xác nhận đơn và khóa nghĩa vụ thanh toán/cọc.",
                    )
                  }
                  className="w-full rounded-v-sm bg-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition"
                >
                  Xác nhận đơn thuê
                </button>
              )}

              {isCurrentLender && order.status === "confirmed" && (
                <div className="space-y-1.5">
                  {shipDeadline ? (
                    <div className="space-y-2">
                      <p className="rounded-v-sm border border-slate-500/30 bg-slate-500/10 p-3 text-[11px] font-medium text-vanguard-light-text dark:text-vanguard-dark-text">
                        Hạn giao: {new Date(shipDeadline).toLocaleString("vi-VN", {
                          timeZone: "Asia/Ho_Chi_Minh",
                        })}
                      </p>
                      <p className="rounded-v-sm border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] font-medium text-amber-500">
                      {isShipmentLate
                        ? "Đã quá hạn giao. Nếu tiếp tục xác nhận, hệ thống sẽ hủy đơn và hoàn tiền renter."
                        : `Vui lòng gửi gear trước ${new Date(shipDeadline).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} để kịp ngày bắt đầu thuê.`}
                      </p>
                    </div>
                  ) : null}
                  <button
                    onClick={() =>
                      isShipmentLate || hasPreShipmentProof
                        ? void handleShip()
                        : setActiveModal("shipment")
                    }
                    className="w-full rounded-v-sm bg-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isShipmentLate
                      ? "Xử lý giao trễ và hoàn tiền"
                      : "Xác nhận đã giao hàng"}
                  </button>
                  {!isShipmentLate && !hasPreShipmentProof && (
                    <p className="text-[11px] text-amber-500 font-medium">
                      Bấm nút để upload ảnh giao hàng trước khi xác nhận.
                    </p>
                  )}
                </div>
              )}

              {isCurrentLender && order.status === "returning" && (
                <div className="space-y-1.5">
                  {isReturnLate && returnDeadline && (
                    <p className="rounded-v-sm border border-red-500/30 bg-red-500/10 p-3 text-[11px] font-semibold text-red-400">
                      Renter đã trả gear trễ so với hạn{" "}
                      {new Date(returnDeadline).toLocaleString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                      . Bạn có thể gửi khiếu nại kèm bằng chứng.
                    </p>
                  )}
                  <button
                    onClick={() => {
                      if (canConfirmReturn) {
                        void runAction(
                          () => confirmReturn(orderId),
                          "Đã nghiệm thu gear, giải phóng escrow và hoàn tất đơn.",
                        );
                      } else if (hasPostReturnedProof) {
                        showMsg(
                          "Đã có ảnh nghiệm thu. Đang chờ renter upload ảnh trả gear.",
                        );
                      } else {
                        setActiveModal("return-confirm");
                      }
                    }}
                    className="w-full rounded-v-sm bg-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {canConfirmReturn
                      ? "Xác nhận đã nhận lại gear"
                      : "Upload ảnh và xác nhận nhận lại gear"}
                  </button>
                </div>
              )}

              {/* === RENTER ACTIONS === */}
               {isCurrentRenter && order.status === "delivering" && (
                 <button
                   onClick={() => setActiveModal("receipt")}
                  className="w-full rounded-v-sm bg-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition"
                 >
                   Xác nhận đã nhận gear
                 </button>
               )}

               {isCurrentRenter && order.status === "active" && (
                 <div className="space-y-2">
                   {returnDeadline && (
                     <p
                       className={`rounded-v-sm border p-3 text-[11px] font-medium ${
                         isReturnLate
                           ? "border-red-500/30 bg-red-500/10 text-red-400"
                           : "border-vanguard-primary/30 bg-vanguard-primary/5 text-vanguard-primary"
                       }`}
                     >
                       {isReturnLate
                         ? `Đã quá hạn trả gear từ ${new Date(returnDeadline).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}. Vẫn có thể trả gear và upload ảnh.`
                         : `Hạn trả gear: ${new Date(returnDeadline).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.`}
                     </p>
                   )}
                   <button
                     onClick={() => setActiveModal("return")}
                     className="w-full rounded-v-sm border border-vanguard-primary text-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-vanguard-primary hover:text-vanguard-dark-bg transition"
                   >
                     Xác nhận trả gear
                   </button>
                   <p className="text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                     Bấm nút để upload ảnh trước khi xác nhận trả gear.
                   </p>
                 </div>
               )}

              {isCurrentRenter && order.status === "pending_confirm" && (
                <button
                  onClick={() => setActiveModal("cancel")}
                  className="w-full rounded-v-sm border border-red-500 text-red-500 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition"
                >
                  Hủy đơn thuê này
                </button>
              )}

              {/* === SHARED ACTIONS (both parties) === */}
              {((isCurrentRenter &&
                (order.status === "delivering" ||
                  order.status === "active" ||
                  order.status === "returning")) ||
                (isCurrentLender && order.status === "returning")) && (
                <button
                  onClick={() => setActiveModal("dispute")}
                  className="w-full rounded-v-sm border border-red-500/50 bg-red-500/10 text-red-400 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition"
                >
                  Báo cáo khiếu nại / Sự cố
                </button>
              )}

              {canSubmitResponse && (
                <button
                  onClick={() => setActiveModal("dispute-response")}
                  className="w-full rounded-v-sm border border-red-500/60 bg-red-500/10 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500 hover:text-white transition"
                >
                  Upload ảnh kháng cáo
                </button>
              )}

              {!isParticipant && (
                <p className="text-xs text-center text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Bạn chỉ có thể xem đơn thuê này.
                </p>
              )}
            </div>
          </Card>

          {/* Payment Breakdown */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold mb-4">
              Chi tiết thanh toán
            </h3>
            <div className="space-y-3">
              <StatRow
                label="Tiền thuê thiết bị"
                value={formatCurrency(rentalFee)}
              />
              {isLenderView && (
                <>
                  <StatRow label="Phí nền tảng" value={formatCurrency(expectedPlatformFee)} />
                  <StatRow label={settlement?.status === "settled" ? "Bạn đã nhận" : "Bạn nhận dự kiến"} value={formatCurrency(expectedLenderIncome)} />
                  <p className="mt-3 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    {settlement?.status === "held" ? "Tiền thuê đang được Mutux giữ chờ quyết toán sau khi đơn hoàn tất." : "Tiền thuê đã được quyết toán theo tỷ lệ platform/lender; tiền cọc được xử lý riêng."}
                  </p>
                </>
              )}
              <StatRow
                label="Tiền cọc giữ chỗ"
                value={`${formatCurrency(depositAmount)} (${isCreditLineDeposit ? "Tín dụng Mutux" : "Tiền mặt"})`}
              />
              {order.duration_days != null && (
                <StatRow
                  label="Số ngày thuê"
                  value={`${order.duration_days} ngày`}
                />
              )}
              <div className="border-t border-vanguard-light-border pt-3 dark:border-vanguard-dark-border">
                <div className="rounded-v-sm border border-vanguard-primary/25 bg-vanguard-primary/5 p-3 text-xs">
                <p className="flex items-center justify-between gap-3 font-semibold">
                  <span>{isCreditLineDeposit ? "Cần thanh toán" : "Tổng cần thanh toán"}</span>
                  <span className="text-vanguard-primary">{formatCurrency(cashRequiredOnConfirm)}</span>
                </p>
                <p className="mt-1 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  {isCreditLineDeposit
                    ? `Tiền cọc ${formatCurrency(depositAmount)} được khóa từ hạn mức Mutux, không trừ từ ví tiêu dùng.`
                    : `Bao gồm ${formatCurrency(rentalFee)} tiền thuê và ${formatCurrency(depositAmount)} tiền cọc sẽ được khóa; tiền cọc được xử lý theo kết quả đơn thuê.`}
                </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Modals ── */}
      {activeModal === "shipment" && (
        <UploadProofModal
          isOpen
          onClose={() => setActiveModal(null)}
          orderId={orderId}
          allowedStages={["pre_shipment"]}
          title="Xác nhận đã giao gear"
          description="Upload ảnh tình trạng gear trước khi gửi. Sau khi upload thành công, hệ thống sẽ xác nhận giao hàng ngay."
          submitLabel={isShipmentLate ? "Xử lý giao trễ" : "Xác nhận đã giao gear"}
          onSubmitProof={handleShipWithProof}
          onSuccess={() => undefined}
        />
      )}

      {activeModal === "receipt" && (
        <UploadProofModal
          isOpen
          onClose={() => setActiveModal(null)}
          orderId={orderId}
           allowedStages={["post_received"]}
           title="Xác nhận đã nhận gear"
           submitLabel="Xác nhận nhận gear"
          onSubmitProof={handleConfirmReceiptWithProof}
          onSuccess={() => undefined}
        />
      )}

      {activeModal === "return" && (
        <UploadProofModal
          isOpen
          onClose={() => setActiveModal(null)}
          orderId={orderId}
           allowedStages={["pre_return"]}
           title="Xác nhận trả gear"
           submitLabel="Xác nhận trả gear"
          onSubmitProof={handleReturnWithProof}
          onSuccess={() => undefined}
        />
      )}

      {activeModal === "return-confirm" && (
        <UploadProofModal
          isOpen
          onClose={() => setActiveModal(null)}
          orderId={orderId}
          allowedStages={["post_returned"]}
          title="Xác nhận nhận lại gear"
          description="Upload ảnh nghiệm thu gear sau khi nhận lại. Nếu renter đã upload ảnh trả gear, thao tác này sẽ hoàn tất đơn thuê."
          submitLabel="Upload ảnh và xác nhận"
          onSubmitProof={handleConfirmReturnWithProof}
          onSuccess={() => undefined}
        />
      )}

      {activeModal === "cancel" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-v-lg border border-vanguard-light-border bg-vanguard-light-surf dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf p-6 shadow-2xl">
            <h4 className="font-display text-xl font-bold text-red-500 mb-2">
              Xác nhận hủy đơn thuê
            </h4>
            <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mb-6">
              Bạn có chắc chắn muốn hủy yêu cầu này không? Đơn đang chờ xác nhận
              nên chưa khấu trừ ví hoặc khóa cọc.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border px-4 py-2 text-xs font-semibold"
              >
                Quay lại
              </button>
              <button
                onClick={handleCancelOrder}
                className="rounded-v-sm bg-red-500 text-white px-5 py-2 text-xs font-bold uppercase"
              >
                Hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "dispute" && (
        <SubmitDisputeModal
          isOpen
          onClose={() => setActiveModal(null)}
          orderId={orderId}
          orderCode={code}
          onSuccess={() => {
            fetchOrder(orderId).catch(console.error);
            showMsg(
              "Đã gửi khiếu nại thành công! Trạng thái đơn chuyển sang 'Đang khiếu nại'.",
            );
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === "dispute-response" && currentDispute && (
        <SubmitDisputeModal
          isOpen
          mode="response"
          disputeId={currentDispute.id}
          onClose={() => setActiveModal(null)}
          orderId={orderId}
          orderCode={code}
          onSuccess={() => {
            fetchOrder(orderId).catch(console.error);
            showMsg("Đã gửi bằng chứng phản hồi khiếu nại.");
            setActiveModal(null);
          }}
        />
      )}

    </div>
  );
}

function DisputeSettlementBreakdown({
  settlement,
  resolutionType,
  resolutionAmount,
  isLenderView,
  depositAmount,
  isCreditLineDeposit,
  fallbackRentalFee,
}: {
  settlement: NonNullable<RentalOrder["rental_fee_settlement"]>;
  resolutionType?: string | null;
  resolutionAmount: number;
  isLenderView: boolean;
  depositAmount: number;
  isCreditLineDeposit: boolean;
  fallbackRentalFee: number;
}) {
  const grossRentalFee = toMoney(settlement.gross_rental_fee) || fallbackRentalFee;
  const renterRefund = toMoney(settlement.rental_refund_amount);
  const distributableRentalFee = toMoney(settlement.distributable_amount);
  const platformFee = toMoney(settlement.platform_fee_amount);
  const lenderRentalIncome = toMoney(settlement.lender_income_amount);
  const lenderCompensation =
    resolutionType === "lender_compensation" || resolutionType === "deposit_deduct"
      ? resolutionAmount
      : 0;
  const lenderTotal = lenderRentalIncome + lenderCompensation;
  const depositReturned = Math.max(0, depositAmount - lenderCompensation);
  const renterTotal = renterRefund + depositReturned;
  const feeRateBps = settlement.platform_fee_rate_bps;
  const feeRate = feeRateBps == null ? null : feeRateBps / 100;

  return (
    <div className="mt-5 rounded-v-sm border border-vanguard-primary/30 bg-vanguard-primary/5 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="font-display text-sm font-bold">Đối soát tài chính</h4>
        <span className="text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          Số liệu sau khi quyết toán
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <SettlementRow label="Tiền thuê theo đơn" value={formatCurrency(grossRentalFee)} />
        <SettlementRow label="Renter được hoàn tiền thuê" value={formatCurrency(renterRefund)} tone={renterRefund > 0 ? "emerald" : "muted"} />
        <SettlementRow label="Tiền thuê còn lại để phân chia" value={formatCurrency(distributableRentalFee)} />
        <SettlementRow label={`Phí nền tảng${feeRate == null ? "" : ` (${feeRate}%)`}`} value={`-${formatCurrency(platformFee)}`} tone="rose" />
        {isLenderView ? <>
          <SettlementRow label="Lender nhận từ tiền thuê" value={formatCurrency(lenderRentalIncome)} tone="emerald" />
          {lenderCompensation > 0 && <SettlementRow label="Lender nhận bồi thường từ tiền cọc" value={formatCurrency(lenderCompensation)} tone="amber" />}
        </> : <>
          <SettlementRow label={isCreditLineDeposit ? "Tiền cọc được mở khóa cho bạn" : "Tiền cọc được hoàn lại cho bạn"} value={formatCurrency(depositReturned)} tone="amber" />
        </>}
        <div className="mt-3 border-t border-vanguard-primary/20 pt-3">
          <SettlementRow label={isLenderView ? "Bạn thực nhận từ quyết toán" : "Bạn được hoàn từ quyết toán"} value={formatCurrency(isLenderView ? lenderTotal : renterTotal)} strong tone="emerald" />
        </div>
        <p className="pt-1 text-[11px] leading-relaxed text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          {isLenderView
            ? <>Tiền cọc là khoản xử lý riêng, không cộng vào doanh thu tiền thuê.{depositAmount > 0 && lenderCompensation === 0 ? " Theo phương án này, tiền cọc không phát sinh khoản bồi thường cho lender." : ""}</>
            : isCreditLineDeposit
              ? "Tiền cọc được mở khóa về hạn mức tín dụng Mutux, không phải khoản hoàn tiền mặt."
              : "Tổng trên gồm phần hoàn tiền thuê (nếu có) và phần tiền cọc được hoàn lại."}
        </p>
      </div>
    </div>
  );
}

function SettlementRow({
  label,
  value,
  tone = "default",
  strong = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "emerald" | "amber" | "rose";
  strong?: boolean;
}) {
  const valueClass = {
    default: "text-vanguard-light-text dark:text-vanguard-dark-text",
    muted: "text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted",
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    rose: "text-rose-500",
  }[tone];

  return <div className="flex items-start justify-between gap-4"><span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{label}</span><span className={`${strong ? "text-base" : "text-sm"} shrink-0 font-bold tabular-nums ${valueClass}`}>{value}</span></div>;
}
