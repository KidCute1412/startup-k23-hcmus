import { Card } from "@/components/ui/card";
import { formatCurrency, rentalDays } from "@/lib/format";
import type { CartItem } from "@/features/cart/cart-context";

type PricingSummaryProps = {
  items: CartItem[];
  depositType: "cash" | "credit-line";
};

export function PricingSummary({
  items,
  depositType,
}: PricingSummaryProps) {
  const rentalTotal = items.reduce((sum, item) => {
    const days = rentalDays(item.startDate, item.endDate);
    return sum + (days > 0 ? days : 1) * item.gear.pricing.dailyPrice;
  }, 0);

  const depositTotal = items.reduce((sum, item) => {
    return sum + (depositType === "cash" ? item.gear.pricing.depositCash : item.gear.pricing.creditLineRequired);
  }, 0);

  return (
    <Card className="p-5">
      <h2 className="font-display text-base font-bold uppercase tracking-widest">
        Tạm tính
      </h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const days = rentalDays(item.startDate, item.endDate);
          const validDays = days > 0 ? days : 1;
          const subtotal = validDays * item.gear.pricing.dailyPrice;
          return (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="truncate pr-4">{item.gear.name} x {validDays} ngày</span>
              <span className="shrink-0">{formatCurrency(subtotal)}</span>
            </div>
          );
        })}
        <div className="border-t border-vanguard-light-border pt-3 dark:border-vanguard-dark-border flex justify-between text-sm font-bold">
          <span>Tổng tiền thuê</span>
          <span>{formatCurrency(rentalTotal)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-vanguard-primary">
          <span>{depositType === "cash" ? "Tổng cọc tiền mặt" : "Credit line cần có"}</span>
          <span>{formatCurrency(depositTotal)}</span>
        </div>
      </div>
      <div className="mt-5 rounded-v-sm border border-vanguard-primary/30 bg-vanguard-primary/5 p-4">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
          Thanh toán khi backend sẵn sàng
        </p>
        <p className="mt-2 text-xs leading-5 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          Flow hiện tại chỉ tạo bản nháp yêu cầu thuê để kiểm thử UX và dữ liệu mock.
        </p>
      </div>
    </Card>
  );
}
