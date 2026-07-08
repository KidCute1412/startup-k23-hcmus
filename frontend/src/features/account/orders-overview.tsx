import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatRow } from "@/components/ui/stat-row";
import { formatCurrency, formatShortDate } from "@/lib/format";

const orders = [
  {
    id: "MUTUX-1024",
    gear: "Vanguard Apex Pro",
    status: "Chờ chủ gear xác nhận",
    startDate: "2026-07-12",
    endDate: "2026-07-14",
    total: 195000,
  },
  {
    id: "MUTUX-1008",
    gear: "Carbon M1 Gold",
    status: "Đã hoàn tất",
    startDate: "2026-06-28",
    endDate: "2026-06-30",
    total: 297000,
  },
];

export function OrdersOverview() {
  return (
    <div className="space-y-5">
      {orders.map((order) => (
        <Card key={order.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone={order.status === "Đã hoàn tất" ? "muted" : "gold"}>
                {order.status}
              </Badge>
              <h2 className="mt-3 font-display text-xl font-bold">{order.gear}</h2>
              <p className="mt-1 text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                {order.id}
              </p>
            </div>
            <p className="font-display text-xl font-bold text-vanguard-primary">
              {formatCurrency(order.total)}
            </p>
          </div>
          <div className="mt-4">
            <StatRow label="Ngày nhận" value={formatShortDate(order.startDate)} />
            <StatRow label="Ngày trả" value={formatShortDate(order.endDate)} />
          </div>
        </Card>
      ))}
    </div>
  );
}
