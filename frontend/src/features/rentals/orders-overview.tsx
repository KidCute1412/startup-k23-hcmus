"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatRow } from "@/components/ui/stat-row";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { useRentalOrder } from "@/hooks/useRentalOrder";
import { useAuth } from "@/hooks/useAuth";
import type { RentalOrder } from "@/types/rentals";
import { resolveMediaUrl } from "@/lib/media";
import { SubmitDisputeModal } from "./submit-dispute-modal";

export type OrderStatusType = RentalOrder['status'];

export const statusConfig: Record<OrderStatusType, { label: string; tone: "gold" | "muted" | "destructive" }> = {
  pending_confirm: { label: "Chờ xác nhận", tone: "gold" },
  confirmed: { label: "Đã xác nhận", tone: "gold" },
  delivering: { label: "Đang giao hàng", tone: "gold" },
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

interface OrdersOverviewProps {
  /** 'renter' (default) shows orders where user is the renter.
   *  'lender' shows orders where user owns the gear. */
  viewRole?: 'renter' | 'lender';
  /** Base href for order detail links (default: /orders) */
  detailBasePath?: string;
}

export function OrdersOverview({ viewRole = 'renter', detailBasePath = '/orders' }: OrdersOverviewProps) {
  const { orders, isLoading, error, fetchOrders } = useRentalOrder();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [disputeOrder, setDisputeOrder] = useState<{ id: string; code: string } | null>(null);

  useEffect(() => {
    void fetchOrders({ role: viewRole }).catch(() => undefined);
  }, [fetchOrders, viewRole]);

  const filterTabs = [
    { id: "all", label: "Tất cả" },
    { id: "pending_confirm", label: "Chờ xác nhận" },
    { id: "confirmed", label: "Đã xác nhận" },
    { id: "delivering", label: "Đang giao" },
    { id: "active", label: "Đang thuê" },
    { id: "returning", label: "Đang trả" },
    { id: "completed", label: "Hoàn tất" },
    { id: "disputed", label: "Khiếu nại" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
      const searchLower = searchTerm.toLowerCase();
      const code = (order.order_code || order.id.slice(0, 8)).toLowerCase();
      const title = order.gear?.name || "";
      const person = viewRole === 'lender'
        ? (order.renter?.full_name || order.renter?.fullName || "")
        : (order.lender?.full_name || order.lender?.fullName || "");

      const matchesSearch =
        code.includes(searchLower) ||
        title.toLowerCase().includes(searchLower) ||
        person.toLowerCase().includes(searchLower);
      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchTerm, viewRole]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex overflow-x-auto space-x-2 pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`whitespace-nowrap rounded-v-sm px-3 py-1.5 text-xs font-semibold transition ${
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
            placeholder={viewRole === 'lender' ? "Tìm tên thiết bị, mã đơn, tên người thuê..." : "Tìm theo tên thiết bị, mã đơn..."}
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
        {!isLoading && error && (
          <Card className="p-12 text-center">
            <p className="font-display text-lg font-bold">Không thể tải lịch sử đơn thuê</p>
            <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void fetchOrders({ role: viewRole }).catch(() => undefined)}
              className="mt-5 inline-flex items-center justify-center rounded-v-sm border border-vanguard-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-primary transition hover:bg-vanguard-primary hover:text-vanguard-dark-bg"
            >
              Thử lại
            </button>
          </Card>
        )}
        {!isLoading && filteredOrders.map((order) => {
          const config = statusConfig[order.status] || statusConfig.pending_confirm;
          const hasResolvedDispute =
            order.status === "completed" &&
            order.disputes?.some(
              (dispute) =>
                dispute.status === "resolved" || dispute.status === "closed",
            );
          const gearImage = resolveMediaUrl(order.gear?.media?.[0]?.url);
          const gearTitle = order.gear?.name || "Sản phẩm chưa rõ";
          const code = order.order_code || order.id.slice(0, 8).toUpperCase();
          const totalDays = calculateDays(
            order.start_date ?? order.startDate,
            order.end_date ?? order.endDate
          );
          const personLabel = viewRole === 'lender'
            ? `Người thuê: ${order.renter?.full_name || order.renter?.fullName || "—"}`
            : `Chủ sở hữu: ${order.lender?.full_name || order.lender?.fullName || "Chủ gear"}`;

          const renterId = order.renter?.id ?? order.renterId ?? order.renter_id;
          const lenderId = order.lender?.id ?? order.lenderId ?? order.lender_id;
          const isParticipant = user?.id === renterId || user?.id === lenderId;
           const canDispute = viewRole === 'lender'
             ? user?.id === lenderId && order.status === 'returning'
             : user?.id === renterId && (order.status === 'delivering' || order.status === 'active' || order.status === 'returning');

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
                       <Badge tone={config.tone}>
                         {hasResolvedDispute
                           ? "Đã hoàn tất - Đã phân xử"
                           : config.label}
                       </Badge>
                    </div>
                    <Link
                      href={`${detailBasePath}/${order.id}`}
                      className="mt-1 font-display text-lg font-bold hover:text-vanguard-primary transition line-clamp-1"
                    >
                      {gearTitle}
                    </Link>
                    <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-0.5">
                      {personLabel}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Tổng phí thuê</p>
                  <p className="font-display text-xl font-bold text-vanguard-primary mt-0.5">
                    {formatCurrency(order.rental_fee ?? order.rentPrice ?? 0)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <StatRow label="Thời gian thuê" value={`${formatShortDate(order.start_date ?? order.startDate)} - ${formatShortDate(order.end_date ?? order.endDate)} (${totalDays} ngày)`} />
                <StatRow label="Tiền cọc" value={`${formatCurrency(order.deposit_amount ?? order.depositCash ?? 0)} (${(order.deposit_type ?? order.depositType) === 'credit_line' ? 'Tín dụng Mutux' : 'Tiền mặt'})`} />

                <div className="flex justify-end space-x-2">
                  {canDispute && (
                    <button
                      type="button"
                      onClick={() => setDisputeOrder({ id: order.id, code })}
                      className="inline-flex items-center justify-center rounded-v-sm border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500 hover:text-white transition"
                    >
                      Khiếu nại
                    </button>
                  )}
                  <Link
                    href={`${detailBasePath}/${order.id}`}
                    className="inline-flex items-center justify-center rounded-v-sm border border-vanguard-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-primary hover:bg-vanguard-primary hover:text-vanguard-dark-bg transition"
                  >
                    Chi tiết →
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}

        {!isLoading && !error && filteredOrders.length === 0 && (
          <Card className="p-12 text-center">
            <p className="font-display text-lg font-bold">Không có đơn thuê nào</p>
            <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-1">
              {viewRole === 'lender'
                ? "Chưa có ai đặt thuê gear của bạn. Thêm gear mới để bắt đầu!"
                : "Thử thay đổi bộ lọc hoặc tìm kiếm sản phẩm mới để đặt thuê."}
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
            fetchOrders({ role: viewRole }).catch(console.error);
            setDisputeOrder(null);
          }}
        />
      )}
    </div>
  );
}
