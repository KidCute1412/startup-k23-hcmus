"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CreditCard, History, Landmark, Loader2, PlusCircle, ShieldCheck, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/format";
import { PayosModal } from "./payos-modal";
import { TopupModal } from "./topup-modal";
import { WithdrawModal } from "./withdraw-modal";
import type { TopupCheckout, WalletTransaction } from "@/types/wallet";
import { CreditLimitPanel } from "./credit-limit-panel";

const toAmount = (value: number | string | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function WalletOverview() {
  const { user } = useAuth();
  const wallet = useWallet();
  const {
    fetchCreditLine,
    fetchLenderWallet,
    fetchRenterWallet,
  } = wallet;
  const [topupOpen, setTopupOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [activeTopup, setActiveTopup] = useState<TopupCheckout | null>(null);
  const role = user?.role;

  const loadData = useCallback(async () => {
    if (role === "renter") {
      await Promise.allSettled([fetchRenterWallet(), fetchCreditLine()]);
    } else if (role === "lender") {
      await fetchLenderWallet();
    }
  }, [fetchCreditLine, fetchLenderWallet, fetchRenterWallet, role]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const transactions = useMemo<WalletTransaction[]>(
    () =>
      role === "lender"
        ? (wallet.lenderWallet?.transactions?.data ?? [])
        : (wallet.renterWallet?.transactions ?? []),
    [role, wallet.lenderWallet?.transactions?.data, wallet.renterWallet?.transactions],
  );

  if (!user) return <WalletState message="Đang xác thực tài khoản..." loading />;
  if (role === "admin") {
    return <WalletState title="Ví không áp dụng cho quản trị viên" message="Tài khoản admin không sử dụng ví tiêu dùng của renter hoặc ví doanh thu của lender." />;
  }

  const renterBalance = toAmount(wallet.renterWallet?.availableBalance ?? wallet.renterWallet?.balance);
  const lockedBalance = toAmount(wallet.renterWallet?.locked_balance ?? wallet.renterWallet?.lockedBalance);
  const lenderBalance = toAmount(wallet.lenderWallet?.balance);
  const totalWithdrawn = toAmount(wallet.lenderWallet?.totalWithdrawn ?? wallet.lenderWallet?.total_withdrawn);
  const creditLimit = toAmount(wallet.creditLine?.totalLimit);
  const availableCredit = toAmount(wallet.creditLine?.displayBalance);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <header className="flex flex-col gap-5 rounded-v-lg border border-vanguard-light-border bg-vanguard-light-surf p-5 text-vanguard-light-text shadow-royal transition-colors dark:border-vanguard-primary/25 dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-vanguard-primary">
            <ShieldCheck size={16} /> {role === "renter" ? "Ví người thuê" : "Ví người cho thuê"}
          </div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {role === "renter" ? "Ví tiêu dùng Mutux" : "Ví doanh thu Mutux"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            {role === "renter"
              ? "Nạp số dư ảo để thanh toán phí thuê, giữ cọc và nhận hoàn tiền. Ví này không hỗ trợ rút tiền trong MVP."
              : "Theo dõi doanh thu cho thuê và gửi yêu cầu rút tiền demo về tài khoản ngân hàng."}
          </p>
        </div>
        {role === "renter" ? (
          <button type="button" onClick={() => setTopupOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-v-md bg-gold-metal px-5 py-3 text-sm font-bold text-vanguard-dark-bg sm:w-auto">
            <PlusCircle size={17} /> Nạp tiền
          </button>
        ) : (
          <button type="button" onClick={() => setWithdrawOpen(true)} disabled={lenderBalance <= 0} className="flex w-full items-center justify-center gap-2 rounded-v-md bg-gold-metal px-5 py-3 text-sm font-bold text-vanguard-dark-bg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            <ArrowUpRight size={17} /> Rút doanh thu
          </button>
        )}
      </header>

      {wallet.error && <p role="alert" className="rounded-v-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{wallet.error}</p>}

      <section className={`grid gap-4 ${role === "renter" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {role === "renter" ? (
          <>
            <MetricCard icon={<WalletCards />} label="Số dư tiêu dùng" value={renterBalance} />
            <MetricCard icon={<CreditCard />} label="Hạn mức tín dụng khả dụng" value={availableCredit} detail={`Tổng hạn mức ${formatCurrency(creditLimit)}`} />
            <MetricCard icon={<Landmark />} label="Tiền cọc đang giữ" value={lockedBalance} />
          </>
        ) : (
          <>
            <MetricCard icon={<WalletCards />} label="Doanh thu khả dụng" value={lenderBalance} />
            <MetricCard icon={<Landmark />} label="Tổng đã rút" value={totalWithdrawn} />
          </>
        )}
      </section>

      {role === "renter" && <CreditLimitPanel
        credit={wallet.creditLine}
        renterBalance={renterBalance}
        busy={wallet.isLoading}
        onRepay={async () => { await wallet.repayMutuxDebt(); await loadData(); }}
        onRefresh={loadData}
      />}

      <TransactionHistory transactions={transactions} loading={wallet.isLoading} lender={role === "lender"} />

      {role === "renter" && (
        <>
          <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} onSuccess={setActiveTopup} />
          <PayosModal
            topup={activeTopup}
            isOpen={Boolean(activeTopup)}
            onClose={() => setActiveTopup(null)}
            onSimulateSuccess={async (topupId) => {
              const result = await wallet.simulateTopupSuccess(topupId);
              await loadData();
              return result;
            }}
          />
        </>
      )}
      {role === "lender" && <WithdrawModal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} maxAmount={lenderBalance} onSuccess={loadData} />}
    </div>
  );
}

function MetricCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: number; detail?: string }) {
  return (
    <Card className="border-vanguard-light-border p-5 dark:border-vanguard-dark-border">
      <div className="flex items-center justify-between text-vanguard-primary">
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
        <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      </div>
      <p className="mt-5 break-words text-2xl font-extrabold tabular-nums sm:text-3xl">{formatCurrency(value)}</p>
      {detail && <p className="mt-2 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{detail}</p>}
    </Card>
  );
}

function TransactionHistory({ transactions, loading, lender }: { transactions: WalletTransaction[]; loading: boolean; lender: boolean }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-vanguard-light-border p-5 dark:border-vanguard-dark-border">
        <History className="text-vanguard-primary" size={20} />
        <div>
          <h2 className="font-display text-lg font-bold">{lender ? "Lịch sử doanh thu" : "Lịch sử giao dịch"}</h2>
          <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{transactions.length} giao dịch gần nhất</p>
        </div>
      </div>
      {loading && transactions.length === 0 ? (
        <div className="flex items-center justify-center gap-2 p-12 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"><Loader2 className="animate-spin" size={18} /> Đang tải dữ liệu...</div>
      ) : transactions.length === 0 ? (
        <p className="p-12 text-center text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Chưa có giao dịch.</p>
      ) : (
        <div className="divide-y divide-vanguard-light-border dark:divide-vanguard-dark-border">
          {transactions.map((transaction) => {
            const outgoing = ["withdrawal", "withdraw", "rental_fee", "compensation", "credit_debt_repay"].includes(transaction.type) || transaction.type.includes("lock");
            const createdAt = transaction.created_at ?? transaction.createdAt;
            return (
              <article key={transaction.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-v-md ${outgoing ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                    {outgoing ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{transaction.note || transaction.type.replaceAll("_", " ")}</p>
                    <p className="truncate text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{transaction.reference || transaction.id}</p>
                  </div>
                </div>
                <div className="pl-12 text-left sm:pl-0 sm:text-right">
                  <p className={`font-bold tabular-nums ${outgoing ? "text-rose-400" : "text-emerald-400"}`}>{outgoing ? "-" : "+"}{formatCurrency(Math.abs(toAmount(transaction.amount)))}</p>
                  <time className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{createdAt ? new Date(createdAt).toLocaleString("vi-VN") : ""}</time>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function WalletState({ title = "Ví Mutux", message, loading = false }: { title?: string; message: string; loading?: boolean }) {
  return (
    <section className="px-4 sm:px-0">
      <Card className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        {loading ? <Loader2 className="mb-4 animate-spin text-vanguard-primary" /> : <ShieldCheck className="mb-4 text-vanguard-primary" />}
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="mt-2 max-w-lg text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{message}</p>
      </Card>
    </section>
  );
}
