"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker, Input } from "@/components/ui/field";
import { useCart } from "@/features/cart/cart-context";
import { formatCurrency } from "@/lib/format";

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function CartClient() {
  const {
    items, removeItem, selectedItemIds, toggleSelectItem, selectAll, clearSelected,
    upsertItem, loading, mutating, error, role,
  } = useCart();
  const eligible = items.filter((item) => item.availability.eligible);
  const selected = items.filter((item) => selectedItemIds.includes(item.id));
  const total = selected.reduce((sum, item) => sum + item.rentalFee, 0);
  const allSelected = eligible.length > 0 && eligible.every((item) => selectedItemIds.includes(item.id));
  const earliestStartDate = tomorrowDate();
  const hasTooSoonStartDate = items.some((item) => item.startDate < earliestStartDate);

  if (loading) return <Card className="p-12 text-center">Đang tải giỏ hàng…</Card>;
  if (role !== "renter") {
    return (
      <Card className="p-12 text-center">
        <p className="mb-6">Vui lòng đăng nhập bằng tài khoản người thuê để sử dụng giỏ hàng.</p>
        <LinkButton href="/login?redirect=/cart">Đăng nhập</LinkButton>
      </Card>
    );
  }
  if (!items.length) {
    return (
      <Card className="p-12 text-center">
        <p className="mb-6 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          Chưa có sản phẩm nào trong giỏ hàng.
        </p>
        <LinkButton href="/gears">Khám phá Catalog</LinkButton>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        {error ? <p className="rounded-v-sm border border-red-500/40 p-3 text-sm text-red-500">{error}</p> : null}
        <label className="flex items-center gap-3 border border-vanguard-light-border p-4 dark:border-vanguard-dark-border">
          <input type="checkbox" checked={allSelected} onChange={() => allSelected ? clearSelected() : selectAll(eligible.map((item) => item.id))} />
          Chọn tất cả sản phẩm khả dụng ({eligible.length})
        </label>
        {items.map((item) => (
          <Card key={item.id} className="grid gap-4 p-4 sm:grid-cols-[auto_96px_1fr_auto] sm:items-center">
            <input
              type="checkbox"
              disabled={!item.availability.eligible || mutating}
              checked={selectedItemIds.includes(item.id)}
              onChange={() => toggleSelectItem(item.id)}
              aria-label={`Chọn ${item.gear.name}`}
            />
            <div className="relative aspect-square overflow-hidden bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfDim">
              {item.gear.primaryMediaUrl ? <Image src={item.gear.primaryMediaUrl} alt={item.gear.name} fill className="object-cover" /> : null}
            </div>
            <div>
              <Link href={`/gears/${item.gear.id}`} className="font-display text-lg font-bold hover:text-vanguard-primary">{item.gear.name}</Link>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {hasTooSoonStartDate && (
                  <p className="sm:col-span-2 text-xs text-amber-500">
                    Ngày bắt đầu thuê phải từ ngày mai trở đi để lender có thời gian chuẩn bị và giao gear.
                  </p>
                )}
                <DatePicker value={item.startDate} disabled={mutating} onChange={(val) => void upsertItem(item.gearId, val, item.endDate)} placeholder="Từ ngày" />
                <DatePicker value={item.endDate} disabled={mutating} min={item.startDate} onChange={(val) => void upsertItem(item.gearId, item.startDate, val)} placeholder="Đến ngày" />
              </div>
              <p className="mt-2 text-sm">{formatCurrency(item.rentPricePerDay)}/ngày · {item.durationDays} ngày</p>
              {!item.availability.eligible ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-amber-500">
                  <AlertTriangle size={15} /> {item.availability.code === "period_conflict" ? "Khoảng ngày đã có lịch thuê" : "Gear không còn khả dụng"}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
              <p className="font-display font-bold text-vanguard-primary">{formatCurrency(item.rentalFee)}</p>
              <button disabled={mutating} onClick={() => void removeItem(item.id)} aria-label="Xóa khỏi giỏ"><Trash2 size={18} /></button>
            </div>
          </Card>
        ))}
      </div>
      <Card className="self-start p-5">
        <h2 className="font-display text-lg font-bold uppercase tracking-wider">Tổng cộng</h2>
        <div className="mt-4 flex justify-between text-xl font-bold text-vanguard-primary"><span>Tạm tính</span><span>{formatCurrency(total)}</span></div>
        <p className="mt-2 text-xs">Giá và tiền cọc được báo trực tiếp từ hệ thống.</p>
        <LinkButton href={selected.length ? "/checkout" : "#"} className={`mt-6 w-full justify-center ${selected.length ? "" : "pointer-events-none opacity-50"}`}>
          Tiến hành thanh toán ({selected.length})
        </LinkButton>
      </Card>
    </div>
  );
}
