import { Card } from "@/components/ui/card";
import { StatRow } from "@/components/ui/stat-row";
import { formatCurrency, rentalDays } from "@/lib/format";
import type { Gear } from "@/features/catalog/types";

type PricingSummaryProps = {
  gear: Gear;
  startDate: string;
  endDate: string;
  depositType: "cash" | "credit-line";
};

export function PricingSummary({
  gear,
  startDate,
  endDate,
  depositType,
}: PricingSummaryProps) {
  const days = rentalDays(startDate, endDate);
  const rentalTotal = days * gear.pricing.dailyPrice;
  const deposit =
    depositType === "cash"
      ? gear.pricing.depositCash
      : gear.pricing.creditLineRequired;

  return (
    <Card className="p-5">
      <h2 className="font-display text-base font-bold uppercase tracking-widest">
        Tạm tính
      </h2>
      <div className="mt-4">
        <StatRow label="Gear" value={gear.name} />
        <StatRow label="Số ngày" value={days > 0 ? `${days}` : "Chọn lịch"} />
        <StatRow label="Giá thuê/ngày" value={formatCurrency(gear.pricing.dailyPrice)} />
        <StatRow label="Tiền thuê" value={formatCurrency(rentalTotal)} />
        <StatRow
          label={depositType === "cash" ? "Cọc tiền mặt" : "Credit line cần có"}
          value={formatCurrency(deposit)}
        />
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
