import { Card } from "@/components/ui/card";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { SafeGearImage } from "@/features/catalog/safe-gear-image";
import type { CartItem } from "@/types/cart";

function formatDateRange(startDate?: string, endDate?: string) {
  const start = formatShortDate(startDate);
  const end = formatShortDate(endDate);
  return `${start} - ${end}`;
}

export function PricingSummary({
  items,
  depositType,
  creditUsageFee = 0,
}: {
  items: CartItem[];
  depositType: "traditional" | "credit_line";
  creditUsageFee?: number;
}) {
  const rentalTotal = items.reduce((sum, item) => sum + item.rentalFee, 0);
  const depositTotal = items.reduce((sum, item) => sum + item.depositAmount, 0);
  const grandTotal = depositType === "traditional" ? rentalTotal + depositTotal : rentalTotal + creditUsageFee;

  return (
    <Card className="p-5 space-y-5">
      <h2 className="font-display text-base font-bold uppercase tracking-widest border-b border-vanguard-light-border pb-3 dark:border-vanguard-dark-border">
        Tóm tắt đơn thuê ({items.length})
      </h2>

      {/* Itemized Breakdown */}
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 text-sm pb-3 border-b border-vanguard-light-border/60 dark:border-vanguard-dark-border/60 last:border-0 last:pb-0"
          >
            {/* Gear Photo Thumbnail */}
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-v-sm bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfDim border border-vanguard-light-border dark:border-vanguard-dark-border">
              <SafeGearImage
                src={item.gear.primaryMediaUrl || "/gear-placeholder.svg"}
                alt={item.gear.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Gear Details */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs truncate">{item.gear.name}</p>
              
              {/* Formatted Rental Dates */}
              <p className="text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-0.5">
                Thời gian: <span className="font-medium text-vanguard-light-text dark:text-vanguard-dark-text">{formatDateRange(item.startDate, item.endDate)}</span> ({item.durationDays} ngày)
              </p>

              {/* Daily Rate & Rental Subtotal */}
              <div className="mt-1 flex flex-wrap items-center justify-between text-xs gap-1">
                <span className="text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Đơn giá: {formatCurrency(item.rentPricePerDay)}/ngày
                </span>
                <span>
                  Tiền thuê: <strong className="text-vanguard-primary">{formatCurrency(item.rentalFee)}</strong>
                </span>
              </div>

              {/* Item Deposit Amount */}
              <div className="mt-0.5 text-right text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Tiền cọc: <span className="font-medium">{formatCurrency(item.depositAmount)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals Summary Breakdown */}
      <div className="space-y-2.5 border-t border-vanguard-light-border pt-4 text-xs dark:border-vanguard-dark-border">
        <div className="flex justify-between">
          <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Tổng phí thuê:</span>
          <span className="font-semibold">{formatCurrency(rentalTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            {depositType === "traditional" ? "Tổng tiền cọc tiền mặt:" : "Hạn mức Mutux cọc:"}
          </span>
          <span className="font-semibold text-vanguard-secondary dark:text-vanguard-primary">
            {formatCurrency(depositTotal)}
          </span>
        </div>
        {depositType === "credit_line" && creditUsageFee > 0 && <div className="flex justify-between">
          <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Phí sử dụng hạn mức tháng này:</span>
          <span className="font-semibold text-vanguard-secondary dark:text-vanguard-primary">{formatCurrency(creditUsageFee)}</span>
        </div>}
        <div className="flex justify-between border-t border-vanguard-light-border pt-3 text-sm font-bold dark:border-vanguard-dark-border">
          <span>Tổng thanh toán từ ví:</span>
          <span className="text-vanguard-primary font-display">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <p className="border border-vanguard-primary/30 bg-vanguard-primary/5 p-3 text-[11px] rounded-v-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
        Giá thuê, tiền cọc và thông tin chủ gear được xác thực chính xác từ database khi thanh toán.
      </p>
    </Card>
  );
}
