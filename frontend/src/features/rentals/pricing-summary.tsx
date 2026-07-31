import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { CartItem } from "@/types/cart";

export function PricingSummary({ items, depositType }: {
  items: CartItem[];
  depositType: "traditional" | "credit_line";
}) {
  const rentalTotal = items.reduce((sum, item) => sum + item.rentalFee, 0);
  const depositTotal = items.reduce((sum, item) => sum + item.depositAmount, 0);
  return (
    <Card className="p-5">
      <h2 className="font-display text-base font-bold uppercase tracking-widest">Tạm tính</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="truncate pr-4">{item.gear.name} × {item.durationDays} ngày</span>
            <span className="shrink-0">{formatCurrency(item.rentalFee)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-3 text-sm font-bold">
          <span>Tổng tiền thuê</span><span>{formatCurrency(rentalTotal)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-vanguard-primary">
          <span>{depositType === "traditional" ? "Tổng cọc tiền mặt" : "Credit line cần có"}</span>
          <span>{formatCurrency(depositTotal)}</span>
        </div>
      </div>
      <p className="mt-5 border border-vanguard-primary/30 bg-vanguard-primary/5 p-4 text-xs">
        Giá thuê, tiền cọc và chủ gear được xác nhận lại từ database khi checkout.
      </p>
    </Card>
  );
}
