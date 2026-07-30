"use client";

import { useEffect, useState } from "react";
import { CreditCard, Landmark, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatRow } from "@/components/ui/stat-row";
import { formatCurrency } from "@/lib/format";
import { useWallet } from "@/hooks/useWallet";

export function WalletOverview() {
  const { renterWallet, creditLine, isLoading, fetchRenterWallet, fetchCreditLine, createTopupCheckout, simulateTopupSuccess } = useWallet();
  const [topupAmount, setTopupAmount] = useState<string>("500000");
  const [isTopupLoading, setIsTopupLoading] = useState(false);

  useEffect(() => {
    fetchRenterWallet().catch(console.error);
    fetchCreditLine().catch(console.error);
  }, [fetchRenterWallet, fetchCreditLine]);

  const creditLimit = creditLine?.creditLimit ?? 0;
  const used = creditLine?.usedAmount ?? 0;
  const balance = renterWallet?.balance ?? 0;

  const handleTopup = async () => {
    const amount = parseInt(topupAmount);
    if (isNaN(amount) || amount <= 0) return alert("Vui lòng nhập số tiền hợp lệ!");
    
    setIsTopupLoading(true);
    try {
      // 1. Create Topup
      const topup = await createTopupCheckout({ amount });
      // 2. Simulate Success immediately (since we don't have real payment UI)
      await simulateTopupSuccess(topup.id);
      alert("Nạp tiền thành công (Giả lập PayOS)!");
      // 3. Refresh balance
      await fetchRenterWallet();
    } catch (e: any) {
      alert("Lỗi nạp tiền: " + (e.message || "Unknown error"));
    } finally {
      setIsTopupLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="p-6">
        <Badge>Mutux Credit Line</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold">Ví và hạn mức cọc</h1>
        {isLoading && !renterWallet ? (
          <div className="mt-6 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Đang tải dữ liệu ví...
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card className="bg-vanguard-light-surfDim p-4 dark:bg-vanguard-dark-surfDim">
              <WalletCards className="text-vanguard-primary" size={22} />
              <p className="mt-3 text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Số dư ví
              </p>
              <p className="mt-1 font-display text-2xl font-bold">
                {formatCurrency(balance)}
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
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-base font-bold uppercase tracking-widest">
          Snapshot
        </h2>
        <div className="mt-4">
          <StatRow label="Hạn mức còn lại" value={formatCurrency(Math.max(0, creditLimit - used))} />
          <StatRow label="Trạng thái tài khoản" value={renterWallet?.isActive ? "Đang hoạt động" : "Tạm khóa"} />
          <StatRow label="Tiền bị đóng băng" value={formatCurrency(renterWallet?.frozenBalance ?? 0)} />
          <StatRow label="Trạng thái tín dụng" value={creditLine?.status === 'active' ? "Tốt" : "Cần xem xét"} />
        </div>
      </Card>
      <Card className="p-5 mt-6">
        <h2 className="font-display text-base font-bold uppercase tracking-widest mb-4">
          Nạp tiền vào ví
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Số tiền cần nạp (VNĐ)</label>
            <input 
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              className="w-full mt-1 rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text"
              placeholder="VD: 500000"
            />
          </div>
          <button
            onClick={handleTopup}
            disabled={isTopupLoading}
            className="w-full rounded-v-sm bg-vanguard-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg transition hover:opacity-90 disabled:opacity-50"
          >
            {isTopupLoading ? "Đang xử lý..." : "Nạp tiền (Test)"}
          </button>
        </div>
      </Card>
    </div>
  );
}
