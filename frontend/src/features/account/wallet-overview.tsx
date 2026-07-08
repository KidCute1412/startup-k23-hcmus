import { CreditCard, Landmark, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatRow } from "@/components/ui/stat-row";
import { formatCurrency } from "@/lib/format";

export function WalletOverview() {
  const creditLimit = 20000000;
  const used = 4200000;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="p-6">
        <Badge>Mutux Credit Line</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold">Ví và hạn mức cọc</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="bg-vanguard-light-surfDim p-4 dark:bg-vanguard-dark-surfDim">
            <WalletCards className="text-vanguard-primary" size={22} />
            <p className="mt-3 text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Số dư ví
            </p>
            <p className="mt-1 font-display text-2xl font-bold">
              {formatCurrency(3500000)}
            </p>
          </Card>
          <Card className="bg-vanguard-light-surfDim p-4 dark:bg-vanguard-dark-surfDim">
            <CreditCard className="text-vanguard-primary" size={22} />
            <p className="mt-3 text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Hạn mức
            </p>
            <p className="mt-1 font-display text-2xl font-bold">
              {formatCurrency(creditLimit)}
            </p>
          </Card>
          <Card className="bg-vanguard-light-surfDim p-4 dark:bg-vanguard-dark-surfDim">
            <Landmark className="text-vanguard-primary" size={22} />
            <p className="mt-3 text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Đang dùng
            </p>
            <p className="mt-1 font-display text-2xl font-bold">
              {formatCurrency(used)}
            </p>
          </Card>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-base font-bold uppercase tracking-widest">
          Snapshot
        </h2>
        <div className="mt-4">
          <StatRow label="Hạn mức còn lại" value={formatCurrency(creditLimit - used)} />
          <StatRow label="KYC" value="Đã duyệt" />
          <StatRow label="Lịch sử tranh chấp" value="0 vụ mở" />
          <StatRow label="Top-up gần nhất" value={formatCurrency(1000000)} />
        </div>
      </Card>
    </div>
  );
}
