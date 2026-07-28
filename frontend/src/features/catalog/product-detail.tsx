"use client";

import { CalendarDays, ShoppingCart, Star, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { StatRow } from "@/components/ui/stat-row";
import { useCart } from "@/features/cart/cart-context";
import { formatCurrency } from "@/lib/format";
import type { Gear } from "./types";

function dateOffset(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export function ProductDetail({ gear }: { gear: Gear }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [startDate, setStartDate] = useState(dateOffset(1));
  const [endDate, setEndDate] = useState(dateOffset(3));
  const add = () => addToCart({ id: `${gear.id}-${startDate}-${endDate}`, gear, startDate, endDate });

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
        <label className="grid gap-2"><span className="field-label">Ngày bắt đầu</span><Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label className="grid gap-2"><span className="field-label">Ngày trả</span><Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={add} className="flex-1" icon={<ShoppingCart size={15} />}>Thêm vào giỏ</Button>
        <Button onClick={() => { add(); router.push("/checkout"); }} className="flex-1" icon={<Zap size={15} />}>Thuê ngay</Button>
      </div>

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
