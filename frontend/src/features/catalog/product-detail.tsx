"use client";

import { AlertTriangle, CalendarDays, CheckCircle2, ShoppingCart, Star, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/field";
import { StatRow } from "@/components/ui/stat-row";
import { useCart } from "@/features/cart/cart-context";
import { errorText } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useRentalOrder } from "@/hooks/useRentalOrder";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { Gear } from "@/types/catalog";
import type { RentalOrder } from "@/types/rentals";

const ACTIVE_ORDER_STATUSES = new Set<RentalOrder["status"]>([
  "pending_confirm", "confirmed", "delivering", "active", "returning", "disputed",
]);

const ORDER_STATUS_LABELS: Record<RentalOrder["status"], string> = {
  pending_confirm: "đang chờ chủ gear xác nhận",
  confirmed: "đã được xác nhận",
  delivering: "đang giao đến bạn",
  active: "đang thuê",
  returning: "đang hoàn trả",
  completed: "đã hoàn thành",
  cancelled: "đã hủy",
  disputed: "đang xử lý tranh chấp",
};

function dateOffset(days: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const value = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + days));
  return value.toISOString().slice(0, 10);
}

export function ProductDetail({ gear }: { gear: Gear }) {
  const router = useRouter();
  const { upsertItem, mutating } = useCart();
  const { user } = useAuth();
  const { orders, fetchOrders } = useRentalOrder();
  const [startDate, setStartDate] = useState(dateOffset(1));
  const [endDate, setEndDate] = useState(dateOffset(3));
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "renter") return;
    void fetchOrders({ limit: 100 }).catch(() => {
      // Availability is still enforced by the cart API if order history cannot load.
    });
  }, [fetchOrders, user?.role]);

  const ownOrders = useMemo(() => orders.filter((order) => {
    const orderGearId = order.gearId ?? order.gear_id ?? order.gear?.id;
    return orderGearId === gear.id && ACTIVE_ORDER_STATUSES.has(order.status);
  }), [gear.id, orders]);

  const conflictingOwnOrder = useMemo(() => ownOrders.find((order) => {
    const orderStart = order.startDate ?? order.start_date;
    const orderEnd = order.endDate ?? order.end_date;
    return Boolean(orderStart && orderEnd && orderStart < endDate && orderEnd > startDate);
  }), [endDate, ownOrders, startDate]);

  const add = async () => {
    setSubmitError(null);
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/gears/${gear.id}`)}`);
      return false;
    }
    if (user.role !== "renter") return false;
    try {
      await upsertItem(gear.id, startDate, endDate);
      return true;
    } catch (cause) {
      setSubmitError(errorText(cause));
      return false;
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {gear.categoryName ? <p className="font-display text-xs uppercase tracking-widest text-vanguard-primary">{gear.categoryName}</p> : null}
        <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">{gear.name}</h1>
        {gear.description ? <p className="text-sm leading-7 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{gear.description}</p> : null}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-vanguard-primary"><Star size={16} fill="currentColor" /> {gear.rating.toFixed(1)}</span>
          <span>{gear.reviewCount} đánh giá gear</span>
          <span className="text-emerald-600 dark:text-emerald-300">Sẵn sàng cho thuê</span>
        </div>
      </div>

      <Card className="grid gap-5 p-5 sm:grid-cols-2">
        {gear.pricing.retailPrice !== null ? (
          <div><p className="field-label">Giá trị</p><p className="mt-1 font-display text-2xl font-bold">{formatCurrency(gear.pricing.retailPrice)}</p></div>
        ) : null}
        <div><p className="field-label">Giá thuê mỗi ngày</p><p className="mt-1 font-display text-2xl font-bold text-vanguard-primary">{formatCurrency(gear.pricing.dailyPrice)}/ngày</p></div>
      </Card>

      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <label className="grid gap-2"><span className="field-label">Ngày bắt đầu</span><DatePicker value={startDate} onChange={(val) => setStartDate(val)} placeholder="Từ ngày" /></label>
        <label className="grid gap-2"><span className="field-label">Ngày trả</span><DatePicker value={endDate} min={startDate} onChange={(val) => setEndDate(val)} placeholder="Đến ngày" /></label>
      </Card>

      {conflictingOwnOrder ? (
        <div className="border border-vanguard-primary/50 bg-vanguard-primary/10 p-4 text-sm" role="status">
          <p className="flex items-start gap-2 font-semibold text-vanguard-secondary dark:text-vanguard-primary">
            <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
            Bạn đã gửi yêu cầu thuê gear này và đơn hiện {ORDER_STATUS_LABELS[conflictingOwnOrder.status]}.
          </p>
          <p className="mt-2 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Thời gian: {formatShortDate(conflictingOwnOrder.startDate ?? conflictingOwnOrder.start_date)} – {formatShortDate(conflictingOwnOrder.endDate ?? conflictingOwnOrder.end_date)}.
            {" "}<Link className="font-semibold text-vanguard-secondary underline dark:text-vanguard-primary" href={`/orders/${conflictingOwnOrder.id}`}>Xem đơn thuê</Link>
          </p>
        </div>
      ) : null}

      {submitError ? (
        <p className="flex items-start gap-2 border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400" role="alert">
          <AlertTriangle className="mt-0.5 shrink-0" size={16} /> {submitError}
        </p>
      ) : null}

      {!user || user.role === "renter" ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button disabled={mutating} onClick={() => void add()} className="flex-1" icon={<ShoppingCart size={15} />}>Thêm vào giỏ</Button>
          <Button disabled={mutating} onClick={() => void add().then((added) => added && router.push("/cart"))} className="flex-1" icon={<Zap size={15} />}>Thuê ngay</Button>
        </div>
      ) : null}

      <Card className="p-5">
        <h2 className="font-display text-base font-bold uppercase tracking-widest">Chủ gear</h2>
        <div className="mt-3">
          <StatRow label="Tên" value={gear.lender.name} />
          <StatRow label="Đánh giá" value={(gear.lender.rating ?? 0).toFixed(1)} />
          <StatRow label="Tổng lượt đánh giá" value={String(gear.lender.totalReviews ?? 0)} />
        </div>
      </Card>
      <p className="flex items-center gap-2 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"><CalendarDays size={14} /> Lịch thuê sẽ được xác nhận khi tạo đơn.</p>
    </div>
  );
}
