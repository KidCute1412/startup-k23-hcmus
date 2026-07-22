"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/features/cart/cart-context";

export function CartClient() {
  const { items, removeFromCart, totalItems } = useCart();

  const calculateSubtotal = (dailyPrice: number, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return dailyPrice * (durationDays > 0 ? durationDays : 1);
  };

  const totalPrice = items.reduce((sum, item) => {
    return sum + calculateSubtotal(item.gear.pricing.dailyPrice, item.startDate, item.endDate);
  }, 0);

  if (totalItems === 0) {
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
        {items.map((item) => {
          const primaryMedia = item.gear.media[0];
          const subtotal = calculateSubtotal(
            item.gear.pricing.dailyPrice,
            item.startDate,
            item.endDate
          );

          return (
            <Card key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-v-sm bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfDim">
                {primaryMedia ? (
                  <Image
                    src={primaryMedia.imageUrl}
                    alt={primaryMedia.alt || "Gear thumbnail"}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1">
                <Link
                  href={`/gears/${item.gear.slug}`}
                  className="font-display text-lg font-bold hover:text-vanguard-primary"
                >
                  {item.gear.name}
                </Link>
                <div className="mt-2 grid gap-1 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  <p>Từ: {item.startDate} &mdash; Đến: {item.endDate}</p>
                  <p>Giá: {formatCurrency(item.gear.pricing.dailyPrice)}/ngày</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <p className="font-display font-bold text-vanguard-primary">
                  {formatCurrency(subtotal)}
                </p>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="text-vanguard-light-textMuted hover:text-red-500 dark:text-vanguard-dark-textMuted dark:hover:text-red-400"
                  aria-label="Xóa khỏi giỏ"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="self-start">
        <Card className="p-5">
          <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wider">
            Tổng cộng
          </h2>
          <div className="flex justify-between font-display text-xl font-bold text-vanguard-primary">
            <span>Tạm tính</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <p className="mt-2 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Chưa bao gồm phí cọc. Phí cọc sẽ được tính ở bước thanh toán.
          </p>
          <div className="mt-6 border-t border-vanguard-light-border pt-6 dark:border-vanguard-dark-border">
            <LinkButton href="/checkout" className="w-full justify-center">
              Tiến hành thanh toán
            </LinkButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
