"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Landmark, Loader2, PlusCircle, ShieldCheck, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/format";
import { PayosModal } from "./payos-modal";
import { TopupModal } from "./topup-modal";
import type { TopupCheckout, WalletTransaction } from "@/types/wallet";
import { CreditLimitPanel } from "./credit-limit-panel";

const toAmount = (value: number | string | undefined) => Number.isFinite(Number(value ?? 0)) ? Number(value ?? 0) : 0;

export function WalletOverview() {
  const { user } = useAuth(); const wallet = useWallet();
  const { fetchRenterWallet, fetchCreditLine } = wallet;
  const [topupOpen, setTopupOpen] = useState(false); const [activeTopup, setActiveTopup] = useState<TopupCheckout | null>(null);
  const loadData = useCallback(async () => { if (user?.role !== "renter") return; await Promise.allSettled([fetchRenterWallet(), fetchCreditLine()]); }, [user?.role, fetchRenterWallet, fetchCreditLine]);
  useEffect(() => { void loadData(); }, [loadData]);
  const transactions = useMemo<WalletTransaction[]>(() => wallet.renterWallet?.transactions ?? [], [wallet.renterWallet?.transactions]);
  if (!user) return <WalletState message="Đang xác thực tài khoản..." loading />;
  if (user.role === "admin") return <WalletState title="Ví không áp dụng cho quản trị viên" message="Tài khoản quản trị viên không sử dụng ví tiêu dùng." />;
  const renterBalance = toAmount(wallet.renterWallet?.availableBalance ?? wallet.renterWallet?.balance); const locked = toAmount(wallet.renterWallet?.locked_balance ?? wallet.renterWallet?.lockedBalance); const credit = toAmount(wallet.creditLine?.displayBalance);
  return <div className="space-y-8 px-4 sm:px-0"><header className="flex flex-col gap-5 rounded-v-lg border border-vanguard-light-border bg-vanguard-light-surf p-5 shadow-royal dark:border-vanguard-primary/25 dark:bg-vanguard-dark-surf sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-vanguard-primary"><ShieldCheck size={16} /> Ví Mutux</div><h1 className="font-display text-2xl font-bold sm:text-3xl">Ví tiêu dùng</h1><p className="mt-2 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Nạp số dư để thanh toán phí thuê và giữ cọc.</p></div><button type="button" onClick={() => setTopupOpen(true)} className="flex items-center justify-center gap-2 rounded-v-md bg-gold-metal px-5 py-3 text-sm font-bold text-vanguard-dark-bg"><PlusCircle size={17} /> Nạp tiền</button></header>{wallet.error && <p role="alert" className="rounded-v-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{wallet.error}</p>}<div className="grid gap-4 sm:grid-cols-3"><Metric icon={<WalletCards />} label="Số dư tiêu dùng" value={renterBalance} /><Metric icon={<CreditCard />} label="Hạn mức khả dụng" value={credit} /><Metric icon={<Landmark />} label="Tiền cọc đang giữ" value={locked} /></div><CreditLimitPanel credit={wallet.creditLine} renterBalance={renterBalance} busy={wallet.isLoading} onRepay={async () => { await wallet.repayMutuxDebt(); await loadData(); }} onRefresh={loadData} /><TransactionHistory transactions={transactions} loading={wallet.isLoading} /><TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} onSuccess={setActiveTopup} /><PayosModal topup={activeTopup} isOpen={Boolean(activeTopup)} onClose={() => setActiveTopup(null)} onSimulateSuccess={async (id) => { const result = await wallet.simulateTopupSuccess(id); await loadData(); return result; }} /></div>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { const displayLabel = label === "Hạn mức khả dụng" ? "Ví trả sau" : label; return <Card className="border-vanguard-light-border p-5 dark:border-vanguard-dark-border"><div className="flex justify-between text-vanguard-primary"><span className="text-xs font-bold uppercase tracking-widest">{displayLabel}</span>{icon}</div><p className="mt-5 text-2xl font-extrabold tabular-nums">{formatCurrency(value)}</p></Card>; }
function TransactionHistory({ transactions, loading }: { transactions: WalletTransaction[]; loading: boolean }) { return <Card><div className="border-b border-vanguard-light-border p-5 dark:border-vanguard-dark-border"><h2 className="font-display text-lg font-bold">Lịch sử giao dịch</h2></div>{loading && transactions.length === 0 ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-vanguard-primary" /></div> : transactions.length === 0 ? <p className="p-10 text-center text-sm text-vanguard-light-textMuted">Chưa có giao dịch.</p> : <div className="divide-y divide-vanguard-light-border dark:divide-vanguard-dark-border">{transactions.map((tx) => <div key={tx.id} className="flex justify-between p-4"><span>{tx.note || tx.type.replaceAll("_", " ")}</span><strong>{formatCurrency(Math.abs(toAmount(tx.amount)))}</strong></div>)}</div>}</Card>; }
function WalletState({ title = "Ví Mutux", message, loading = false }: { title?: string; message: string; loading?: boolean }) { return <Card className="flex min-h-72 flex-col items-center justify-center p-8 text-center">{loading ? <Loader2 className="mb-4 animate-spin text-vanguard-primary" /> : <ShieldCheck className="mb-4 text-vanguard-primary" />}<h1 className="font-display text-2xl font-bold">{title}</h1><p className="mt-2 text-sm text-vanguard-light-textMuted">{message}</p></Card>; }
