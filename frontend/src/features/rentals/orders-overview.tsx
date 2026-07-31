"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatRow } from "@/components/ui/stat-row";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { useRentalOrder } from "@/hooks/useRentalOrder";
import type { RentalOrder } from "@/types/rentals";
import { resolveMediaUrl } from "@/lib/media";
import { SubmitDisputeModal } from "./submit-dispute-modal";

export type OrderStatusType = RentalOrder['status'] | 'disputed';

export const statusConfig: Record<OrderStatusType | 'pending_confirm', { label: string; tone: "gold" | "muted" | "destructive" }> = {
  pending: { label: "Chờ xác nhận", tone: "gold" },
  pending_confirm: { label: "Chờ xác nhận", tone: "gold" },
  confirmed: { label: "Đã xác nhận", tone: "gold" },
  shipped: { label: "Đang giao hàng", tone: "gold" },
  active: { label: "Đang thuê", tone: "gold" },
  returning: { label: "Đang trả hàng", tone: "gold" },
  completed: { label: "Đã hoàn tất", tone: "muted" },
  cancelled: { label: "Đã hủy", tone: "destructive" },
  disputed: { label: "Đang khiếu nại", tone: "destructive" },
};

function calculateDays(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (isNaN(diff)) return 0;
  return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
}

export function OrdersOverview() {
  const { orders, isLoading, fetchOrders } = useRentalOrder();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [disputeOrder, setDisputeOrder] = useState<{ id: string; code: string } | null>(null);

  useEffect(() => {
    fetchOrders().catch(console.error);
  }, [fetchOrders]);

  const filterTabs = [
    { id: "all", label: "Tất cả đơn" },
    { id: "active", label: "Đang thuê" },
    { id: "pending", label: "Chờ xác nhận" },
    { id: "completed", label: "Đã hoàn tất" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
      const searchLower = searchTerm.toLowerCase();
      const code = order.id.slice(0, 8);
      const title = order.gear?.name || "";
      const lender = order.lender?.fullName || order.lender?.full_name || "";
      
      const matchesSearch =
        code.toLowerCase().includes(searchLower) ||
        title.toLowerCase().includes(searchLower) ||
        lender.toLowerCase().includes(searchLower);
      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex overflow-x-auto space-x-2 border-b sm:border-b-0 border-vanguard-light-border dark:border-vanguard-dark-border pb-2 sm:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`whitespace-nowrap rounded-v-sm px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedStatus === tab.id
                  ? "bg-vanguard-primary text-vanguard-dark-bg font-bold"
                  : "bg-vanguard-light-surfDim/60 dark:bg-vanguard-dark-surfDim/60 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted hover:text-vanguard-light-text dark:hover:text-vanguard-dark-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Tìm theo tên thiết bị, mã đơn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-1.5 text-xs text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading && orders.length === 0 && (
          <div className="text-center py-10 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Đang tải dữ liệu đơn thuê...
          </div>
        )}
        {!isLoading && filteredOrders.map((order) => {
          const config = statusConfig[order.status] || statusConfig.pending;
          const gearImage = resolveMediaUrl(order.gear?.media?.[0]?.url);
          const gearTitle = order.gear?.name || "Sản phẩm chưa rõ";
          const code = order.id.slice(0, 8).toUpperCase();
          const lenderName = order.lender?.full_name || order.lender?.fullName || "Chủ gear";
          const totalDays = calculateDays(order.start_date, order.end_date);

          return (
            <Card key={order.id} className="p-5 hover:border-vanguard-primary/50 transition">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-vanguard-light-border dark:border-vanguard-dark-border pb-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 overflow-hidden rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfDim flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gearImage}
                      alt={gearTitle}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-vanguard-primary">
                        {code}
                      </span>
                      <Badge tone={config.tone}>{config.label}</Badge>
                    </div>
                    <Link
                      href={`/orders/${order.id}`}
                      className="mt-1 font-display text-lg font-bold hover:text-vanguard-primary transition line-clamp-1"
                    >
                      {gearTitle}
                    </Link>
                    <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-0.5">
                      Chủ sở hữu: <span className="font-semibold">{lenderName}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Tổng phí thuê</p>
                  <p className="font-display text-xl font-bold text-vanguard-primary mt-0.5">
                    {formatCurrency(order.rental_fee || order.rentPrice || 0)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <StatRow label="Thời gian thuê" value={`${formatShortDate(order.start_date)} - ${formatShortDate(order.end_date)} (${totalDays} ngày)`} />
                <StatRow label="Tiền cọc thiết bị" value={`${formatCurrency(order.deposit_amount || order.depositCash || 0)} (${(order.deposit_type || order.depositType) === 'credit_line' ? 'Tín dụng Mutux' : 'Tiền mặt'})`} />
                
                <div className="flex justify-end space-x-2">
                  {(order.status === 'active' || order.status === 'returning') && (
                    <button
                      type="button"
                      onClick={() => setDisputeOrder({ id: order.id, code })}
                      className="inline-flex items-center justify-center rounded-v-sm border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500 hover:text-white transition"
                    >
                      Báo cáo khiếu nại
                    </button>
                  )}
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center justify-center rounded-v-sm border border-vanguard-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-primary hover:bg-vanguard-primary hover:text-vanguard-dark-bg transition"
                  >
                    Chi tiết đơn hàng →
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}

        {!isLoading && filteredOrders.length === 0 && (
          <Card className="p-12 text-center">
            <p className="font-display text-lg font-bold">Không tìm thấy đơn thuê phù hợp</p>
            <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-1">
              Thử thay đổi từ khóa tìm kiếm hoặc chọn tab trạng thái đơn khác.
            </p>
          </Card>
        )}
      </div>

      {disputeOrder && (
        <SubmitDisputeModal
          isOpen={!!disputeOrder}
          onClose={() => setDisputeOrder(null)}
          orderId={disputeOrder.id}
          orderCode={disputeOrder.code}
          onSuccess={() => {
            fetchOrders().catch(console.error);
          }}
        />
      )}
    </div>
  );
}
