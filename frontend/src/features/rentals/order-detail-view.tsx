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
import type { ProofStage, RentalOrder } from "@/types/rentals";
import { resolveMediaUrl } from "@/lib/media";
import { SubmitDisputeModal } from "./submit-dispute-modal";
import { UploadProofModal } from "./upload-proof-modal";

export interface OrderDetailViewProps {
  orderId: string;
}

function getAllowedProofStage(order: RentalOrder, userId?: string): ProofStage | null {
  if (!userId) return null;

  const renterId = order.renterId ?? order.renter_id;
  const lenderId = order.lenderId ?? order.lender_id;

  if (order.status === 'confirmed' && userId === lenderId) return 'pre_shipment';
  if (order.status === 'active' && userId === renterId) return 'post_received';
  if (order.status === 'returning' && userId === renterId) return 'pre_return';
  if (order.status === 'returning' && userId === lenderId) return 'post_returned';
  return null;
}

function calculateDays(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (isNaN(diff)) return 0;
  return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
}

function generateTimeline(order: RentalOrder) {
  const isCanceled = order.status === 'cancelled';
  const steps = [
    { title: "Tạo đơn thuê", description: "Người thuê đã gửi yêu cầu mượn gear", timestamp: order.createdAt, completed: true },
    { title: "Xác nhận đơn", description: "Chủ gear đã duyệt và đóng băng tiền cọc", timestamp: "", completed: !isCanceled && order.status !== 'pending_confirm' },
    { title: "Đang giao hàng", description: "Chủ gear đang chuyển gear cho bạn", timestamp: "", completed: !isCanceled && ['delivering', 'active', 'returning', 'completed'].includes(order.status) },
    { title: "Đã nhận gear", description: "Đơn thuê đang trong thời gian sử dụng", timestamp: "", completed: !isCanceled && ['active', 'returning', 'completed'].includes(order.status) },
    { title: "Đang hoàn trả gear", description: "Người thuê đã gửi trả gear cho chủ sở hữu", timestamp: "", completed: !isCanceled && ['returning', 'completed'].includes(order.status) },
    { title: "Đã hoàn tất", description: "Chủ gear đã nhận lại và nghiệm thu an toàn", timestamp: "", completed: !isCanceled && order.status === 'completed' },
  ];
  if (isCanceled) {
    steps.push({ title: "Đã hủy đơn", description: "Đơn thuê đã bị hủy", timestamp: order.updatedAt, completed: true });
  }
  return steps;
}

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const { user } = useAuth();
  const { currentOrder: order, isLoading: loadingOrder, fetchOrder, confirmOrder, shipOrder, confirmReceipt, returnOrder, confirmReturn, cancelOrder } = useRentalOrder();
  const { proofs, isLoading: loadingProofs, fetchProofs } = useRentalProof(orderId);
  const [activeModal, setActiveModal] = useState<'receipt' | 'return' | 'cancel' | 'dispute' | 'proof' | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder(orderId).catch(console.error);
    fetchProofs().catch(console.error);
  }, [orderId, fetchOrder, fetchProofs]);

  if (loadingOrder && !order) {
    return <div className="py-10 text-center text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Đang tải thông tin chi tiết đơn thuê...</div>;
  }

  if (!order) {
    return <div className="py-10 text-center text-sm text-red-500">Không tìm thấy đơn thuê!</div>;
  }

  const config = statusConfig[order.status] || statusConfig.pending_confirm;
  const gearImage = resolveMediaUrl(order.gear?.media?.[0]?.url);
  const gearTitle = order.gear?.name || "Sản phẩm chưa rõ";
  const code = order.id.slice(0, 8).toUpperCase();
  const lenderName = order.lender?.full_name || order.lender?.fullName || "Chủ gear";
  const renterId = order.renterId ?? order.renter_id;
  const lenderId = order.lenderId ?? order.lender_id;
  const totalDays = calculateDays(order.start_date, order.end_date);
  const timeline = generateTimeline(order);
  const allowedProofStage = getAllowedProofStage(order, user?.id);

  const hasPreShipmentProof = (proofs ?? []).some((p) => p.stage === "pre_shipment");
  const hasPreReturnProof = (proofs ?? []).some((p) => p.stage === "pre_return");
  const hasPostReturnedProof = (proofs ?? []).some((p) => p.stage === "post_returned");
  const canConfirmReturn = hasPreReturnProof && hasPostReturnedProof;

  const handleConfirmReceipt = async () => {
    try {
      await confirmReceipt(orderId);
      setActiveModal(null);
      showNotice("Đã xác nhận nhận gear thành công! Đơn thuê chuyển sang trạng thái 'Đang thuê'.");
    } catch (e: any) {
      showNotice(`Lỗi: ${e.message}`);
    }
  };

  const handleRequestReturn = async () => {
    try {
      await returnOrder(orderId);
      setActiveModal(null);
      showNotice("Đã gửi yêu cầu trả hàng! Đang chờ chủ gear kiểm tra & nghiệm thu.");
    } catch (e: any) {
      showNotice(`Lỗi: ${e.message}`);
    }
  };

  const handleCancelOrder = async () => {
    try {
      await cancelOrder(orderId);
      setActiveModal(null);
      showNotice("Đã hủy yêu cầu thuê thành công.");
    } catch (e: any) {
      showNotice(`Lỗi: ${e.message}`);
    }
  };

  const runLifecycleAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    try {
      await action();
      showNotice(successMessage);
    } catch (error) {
      showNotice(
        `Lỗi: ${error instanceof Error ? error.message : "Không thể cập nhật đơn thuê."}`,
      );
    }
  };

  const showNotice = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/orders"
          className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted hover:text-vanguard-primary transition"
        >
          ← Quay lại danh sách đơn thuê
        </Link>
        <div className="flex items-center space-x-3">
          <Badge tone={config.tone}>{config.label}</Badge>
          <span className="font-mono text-sm font-bold text-vanguard-primary">{code}</span>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className={`rounded-v-sm border px-4 py-3 text-xs font-semibold ${
          actionSuccessMsg.startsWith('Lỗi') 
            ? 'bg-red-500/10 border-red-500/30 text-red-500' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
        }`}>
          {actionSuccessMsg.startsWith('Lỗi') ? '✕' : '✓'} {actionSuccessMsg}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Timeline & Gear Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Banner if Disputed */}
          {order.status === 'disputed' && (
            <Card className="p-6 border-red-500/40 bg-red-500/10">
              <div className="flex items-center space-x-2 text-red-400 mb-2">
                <span className="font-display text-lg font-bold uppercase tracking-wider">
                  ⚠️ Đơn thuê đang ở trạng thái khiếu nại (Disputed)
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Khiếu nại/báo cáo sự cố đã được ghi nhận. Tiền cọc và khoản thanh toán của đơn thuê hiện đang được hệ thống Mutux phong tỏa an toàn. Quản trị viên (Admin) sẽ đối soát bằng chứng của hai bên và đưa ra quyết định phân xử sớm nhất.
              </p>
            </Card>
          )}

          {/* Order Lifecycle Progress Timeline */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold mb-6">Tiến trình đơn thuê (Order Lifecycle)</h3>
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
                    <h4 className={`text-sm font-bold ${step.completed ? "text-vanguard-light-text dark:text-vanguard-dark-text" : "text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-0.5">
                      {step.description}
                    </p>
                    <span className="text-[10px] font-mono text-vanguard-primary mt-1 block">
                      {step.timestamp ? new Date(step.timestamp).toLocaleString() : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Gear Info Card */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold mb-4">Sản phẩm thuê</h3>
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
                  Chủ sở hữu: <span className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">{lenderName}</span>
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Đơn giá thuê:</span>
                    <p className="font-bold text-vanguard-primary">{formatCurrency((order.rental_fee || order.rentPrice || 0) / totalDays)} / ngày</p>
                  </div>
                  <div>
                    <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Thời hạn thuê:</span>
                    <p className="font-bold">{totalDays} ngày ({formatShortDate(order.start_date)} - {formatShortDate(order.end_date)})</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Proof Gallery (Handling photos) */}
          {!loadingProofs && proofs && proofs.length > 0 && (
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold mb-4">Ảnh kiểm định & Bằng chứng nghiệm thu (Proof Photos)</h3>
              <div className="space-y-4">
                {proofs.map((proof) => (
                  <div key={proof.id} className="p-4 rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border bg-vanguard-light-surfDim/40 dark:bg-vanguard-dark-surfDim/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-vanguard-primary">
                        {proof.stage}
                      </span>
                      <span className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{new Date(proof.createdAt).toLocaleString()}</span>
                    </div>
                    {proof.note && <p className="text-xs text-vanguard-light-text dark:text-vanguard-dark-text mb-3">{proof.note}</p>}
                    <div className="flex flex-wrap gap-3">
                      {proof.proofType === 'image' && proof.fileUrl && (
                        <div className="h-20 w-20 overflow-hidden rounded border border-vanguard-light-border dark:border-vanguard-dark-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={resolveMediaUrl(proof.fileUrl)} alt="Proof" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (1 col): Payment & Actions */}
        <div className="space-y-6">
          {/* Order Actions Card */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold mb-4">Hành động khả thi</h3>
            <div className="space-y-3">
              {user?.id === lenderId && order.status === 'pending_confirm' && (
                <button
                  onClick={() => void runLifecycleAction(
                    () => confirmOrder(orderId),
                    "Đã xác nhận đơn và khóa nghĩa vụ thanh toán/cọc.",
                  )}
                  className="w-full rounded-v-sm bg-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition"
                >
                  Xác nhận đơn thuê
                </button>
              )}

              {user?.id === lenderId && order.status === 'confirmed' && (
                <div className="space-y-1.5">
                  <button
                    onClick={() => void runLifecycleAction(
                      () => shipOrder(orderId),
                      "Đã chuyển đơn sang trạng thái đang giao hàng.",
                    )}
                    disabled={!hasPreShipmentProof}
                    className="w-full rounded-v-sm bg-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Xác nhận giao hàng
                  </button>
                  {!hasPreShipmentProof && (
                    <p className="text-[11px] text-amber-500 font-medium">
                      ⚠️ Cần tải lên ảnh giao hàng (pre_shipment) trước khi xác nhận giao.
                    </p>
                  )}
                </div>
              )}

              {user?.role === 'renter' && order.status === 'delivering' && (
                <button
                  onClick={() => setActiveModal('receipt')}
                  className="w-full rounded-v-sm bg-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition"
                >
                  ✓ Xác nhận đã nhận hàng
                </button>
              )}

              {user?.role === 'renter' && order.status === 'active' && (
                <button
                  onClick={() => setActiveModal('return')}
                  className="w-full rounded-v-sm border border-vanguard-primary text-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-vanguard-primary hover:text-vanguard-dark-bg transition"
                >
                  🔄 Yêu cầu gửi trả gear
                </button>
              )}

              {(order.status === 'active' || order.status === 'returning') && (
                <button
                  onClick={() => setActiveModal('dispute')}
                  className="w-full rounded-v-sm border border-red-500/50 bg-red-500/10 text-red-400 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition"
                >
                  ⚠️ Báo cáo khiếu nại / Sự cố
                </button>
              )}

              {user?.role === 'renter' && order.status === 'pending_confirm' && (
                <button
                  onClick={() => setActiveModal('cancel')}
                  className="w-full rounded-v-sm border border-red-500 text-red-500 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition"
                >
                  ✕ Hủy đơn thuê này
                </button>
              )}

              {user?.id === lenderId && order.status === 'returning' && (
                <div className="space-y-1.5">
                  <button
                    onClick={() => void runLifecycleAction(
                      () => confirmReturn(orderId),
                      "Đã nghiệm thu gear, giải phóng escrow và hoàn tất đơn.",
                    )}
                    disabled={!canConfirmReturn}
                    className="w-full rounded-v-sm bg-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Xác nhận đã nhận lại gear
                  </button>
                  {!canConfirmReturn && (
                    <p className="text-[11px] text-amber-500 font-medium">
                      ⚠️ Cần đủ ảnh trả hàng của Renter ({hasPreReturnProof ? '✓ pre_return' : '✗ pre_return'}) và ảnh nghiệm thu của Lender ({hasPostReturnedProof ? '✓ post_returned' : '✗ post_returned'}).
                    </p>
                  )}
                </div>
              )}

              {allowedProofStage && (
                <button
                  onClick={() => setActiveModal('proof')}
                  className="w-full rounded-v-sm border border-vanguard-primary/50 bg-vanguard-primary/10 text-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-vanguard-primary hover:text-vanguard-dark-bg transition"
                >
                  📷 Tải lên ảnh bàn giao thiết bị
                </button>
              )}

              <button
                className="w-full rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border py-2.5 text-xs font-semibold text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted hover:text-vanguard-primary transition"
              >
                💬 Liên hệ chủ gear
              </button>
            </div>
          </Card>

          {/* Fee & Deposit Breakdown */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold mb-4">Chi tiết thanh toán</h3>
            <div className="space-y-3">
              <StatRow label="Tiền thuê thiết bị" value={formatCurrency(order.rental_fee || order.rentPrice || 0)} />
              <StatRow
                label="Tiền cọc giữ chỗ"
                value={`${formatCurrency(order.deposit_amount || order.depositCash || 0)} (${(order.deposit_type || order.depositType) === 'credit_line' ? 'Tín dụng Mutux' : 'Tiền mặt'})`}
              />
              <StatRow label="Địa chỉ giao nhận" value={order.shipping_address || order.shippingAddress} />
              
              <div className="border-t border-vanguard-light-border dark:border-vanguard-dark-border pt-3 mt-3 flex items-center justify-between">
                <span className="font-bold text-sm">Tổng cộng tiền thuê</span>
                <span className="font-display text-xl font-bold text-vanguard-primary">{formatCurrency(order.rental_fee || order.rentPrice || 0)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modals */}
      {activeModal === 'receipt' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-v-lg border border-vanguard-light-border bg-vanguard-light-surf dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf p-6 shadow-2xl">
            <h4 className="font-display text-xl font-bold mb-2">Xác nhận đã nhận thiết bị</h4>
            <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mb-6">
              Bạn đã kiểm tra ngoại hình và chức năng của món gear này bình thường? Bấm xác nhận để chính thức bắt đầu tính giờ thuê.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border px-4 py-2 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmReceipt}
                className="rounded-v-sm bg-vanguard-primary px-5 py-2 text-xs font-bold uppercase text-vanguard-dark-bg"
              >
                Xác nhận đã nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'return' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-v-lg border border-vanguard-light-border bg-vanguard-light-surf dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf p-6 shadow-2xl">
            <h4 className="font-display text-xl font-bold mb-2">Yêu cầu gửi trả thiết bị</h4>
            <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mb-6">
              Xác nhận bạn đã đóng gói sản phẩm và sẵn sàng bàn giao cho shipper / chủ gear?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border px-4 py-2 text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                onClick={handleRequestReturn}
                className="rounded-v-sm bg-vanguard-primary px-5 py-2 text-xs font-bold uppercase text-vanguard-dark-bg"
              >
                Xác nhận trả gear
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'cancel' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-v-lg border border-vanguard-light-border bg-vanguard-light-surf dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf p-6 shadow-2xl">
            <h4 className="font-display text-xl font-bold text-red-500 mb-2">Xác nhận hủy đơn thuê</h4>
            <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mb-6">
              Bạn có chắc chắn muốn hủy yêu cầu này không? Đơn đang chờ xác nhận nên chưa khấu trừ ví hoặc khóa cọc.
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

      {activeModal === 'dispute' && (
        <SubmitDisputeModal
          isOpen={activeModal === 'dispute'}
          onClose={() => setActiveModal(null)}
          orderId={orderId}
          orderCode={code}
          onSuccess={() => {
            fetchOrder(orderId).catch(console.error);
            showNotice("Đã gửi khiếu nại tranh chấp thành công! Trạng thái đơn chuyển sang 'Đang khiếu nại'.");
          }}
        />
      )}

      {activeModal === 'proof' && allowedProofStage && (
        <UploadProofModal
          isOpen={activeModal === 'proof'}
          onClose={() => setActiveModal(null)}
          orderId={orderId}
          allowedStages={[allowedProofStage]}
          onSuccess={() => {
            fetchProofs().catch(console.error);
            showNotice("Đã tải lên ảnh bằng chứng bàn giao thành công!");
          }}
        />
      )}
    </div>
  );
}
