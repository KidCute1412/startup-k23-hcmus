"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatRow } from "@/components/ui/stat-row";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { mockRentalOrders, OrderStatusType, RentalOrderMock } from "@/lib/mock-account-data";
import { statusConfig } from "./orders-overview";

export interface OrderDetailViewProps {
  orderId: string;
}

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const initialOrder = mockRentalOrders.find((o) => o.id === orderId) || mockRentalOrders[0];
  const [order, setOrder] = useState<RentalOrderMock>(initialOrder);
  const [activeModal, setActiveModal] = useState<'receipt' | 'return' | 'cancel' | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const config = statusConfig[order.status];

  const handleConfirmReceipt = () => {
    setOrder((prev) => ({
      ...prev,
      status: 'active' as OrderStatusType,
      timeline: prev.timeline.map((item) =>
        item.title.includes("Đã nhận gear") ? { ...item, completed: true, timestamp: "Bừa hoàn tất" } : item
      ),
    }));
    setActiveModal(null);
    showNotice("Đã xác nhận nhận gear thành công! Đơn thuê chuyển sang trạng thái 'Đang thuê'.");
  };

  const handleRequestReturn = () => {
    setOrder((prev) => ({
      ...prev,
      status: 'returning' as OrderStatusType,
      timeline: [
        ...prev.timeline,
        { title: "Đang hoàn trả gear", description: "Người thuê đã gửi trả gear cho chủ sở hữu", timestamp: "Đã yêu cầu", completed: true },
      ],
    }));
    setActiveModal(null);
    showNotice("Đã gửi yêu cầu trả hàng! Đang chờ chủ gear kiểm tra & nghiệm thu.");
  };

  const handleCancelOrder = () => {
    setOrder((prev) => ({
      ...prev,
      status: 'cancelled' as OrderStatusType,
    }));
    setActiveModal(null);
    showNotice("Đã hủy đơn thuê thành công. Tiền cọc/hạn mức đã được hoàn trả!");
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
          <span className="font-mono text-sm font-bold text-vanguard-primary">{order.code}</span>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="rounded-v-sm bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-xs text-emerald-500 font-semibold">
          ✓ {actionSuccessMsg}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Timeline & Gear Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Lifecycle Progress Timeline */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold mb-6">Tiến trình đơn thuê (Order Lifecycle)</h3>
            <div className="relative pl-6 border-l-2 border-vanguard-light-border dark:border-vanguard-dark-border space-y-6">
              {order.timeline.map((step, idx) => (
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
                      {step.timestamp}
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
                  src={order.gearImage}
                  alt={order.gearTitle}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-display text-xl font-bold">{order.gearTitle}</h4>
                <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-1">
                  Chủ sở hữu: <span className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">{order.lenderName}</span> ({order.lenderPhone})
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Đơn giá thuê:</span>
                    <p className="font-bold text-vanguard-primary">{formatCurrency(order.dailyRate)} / ngày</p>
                  </div>
                  <div>
                    <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Thời hạn thuê:</span>
                    <p className="font-bold">{order.totalDays} ngày ({formatShortDate(order.startDate)} - {formatShortDate(order.endDate)})</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Proof Gallery (Handling photos) */}
          {order.proofs && order.proofs.length > 0 && (
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold mb-4">Ảnh kiểm định & Bằng chứng nghiệm thu (Proof Photos)</h3>
              <div className="space-y-4">
                {order.proofs.map((proof) => (
                  <div key={proof.id} className="p-4 rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border bg-vanguard-light-surfDim/40 dark:bg-vanguard-dark-surfDim/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-vanguard-primary">
                        {proof.stage === 'handover' ? 'Ảnh bàn giao khi nhận hàng' : 'Ảnh trả hàng'}
                      </span>
                      <span className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{proof.createdAt}</span>
                    </div>
                    {proof.note && <p className="text-xs text-vanguard-light-text dark:text-vanguard-dark-text mb-3">{proof.note}</p>}
                    <div className="flex flex-wrap gap-3">
                      {proof.images.map((img, i) => (
                        <div key={i} className="h-20 w-20 overflow-hidden rounded border border-vanguard-light-border dark:border-vanguard-dark-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="Proof" className="h-full w-full object-cover" />
                        </div>
                      ))}
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
              {order.status === 'delivering' && (
                <button
                  onClick={() => setActiveModal('receipt')}
                  className="w-full rounded-v-sm bg-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition"
                >
                  ✓ Xác nhận đã nhận hàng
                </button>
              )}

              {order.status === 'active' && (
                <button
                  onClick={() => setActiveModal('return')}
                  className="w-full rounded-v-sm border border-vanguard-primary text-vanguard-primary py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-vanguard-primary hover:text-vanguard-dark-bg transition"
                >
                  🔄 Yêu cầu gửi trả gear
                </button>
              )}

              {order.status === 'pending_confirm' && (
                <button
                  onClick={() => setActiveModal('cancel')}
                  className="w-full rounded-v-sm border border-red-500 text-red-500 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition"
                >
                  ✕ Hủy đơn thuê này
                </button>
              )}

              {order.status === 'completed' && (
                <button
                  className="w-full rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border py-2.5 text-xs font-bold uppercase tracking-wider hover:border-vanguard-primary transition"
                >
                  ★ Đánh giá sản phẩm / Thuê lại
                </button>
              )}

              <button
                className="w-full rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border py-2.5 text-xs font-semibold text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted hover:text-vanguard-primary transition"
              >
                💬 Liên hệ chủ gear ({order.lenderPhone})
              </button>
            </div>
          </Card>

          {/* Fee & Deposit Breakdown */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold mb-4">Chi tiết thanh toán</h3>
            <div className="space-y-3">
              <StatRow label="Tiền thuê thiết bị" value={formatCurrency(order.rentalFee)} />
              <StatRow
                label="Tiền cọc giữ chỗ"
                value={`${formatCurrency(order.depositAmount)} (${order.depositType === 'credit_line' ? 'Tín dụng Mutux' : 'Tiền mặt'})`}
              />
              <StatRow label="Địa chỉ giao nhận" value={order.shippingAddress} />
              
              <div className="border-t border-vanguard-light-border dark:border-vanguard-dark-border pt-3 mt-3 flex items-center justify-between">
                <span className="font-bold text-sm">Tổng cộng tiền thuê</span>
                <span className="font-display text-xl font-bold text-vanguard-primary">{formatCurrency(order.rentalFee)}</span>
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
              Bạn có chắc chắn muốn hủy đơn thuê này không? Tiền cọc hoặc hạn mức giữ chỗ sẽ được mở lại tự động.
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
    </div>
  );
}
