"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, History, Landmark, Loader2, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/format";
import { WithdrawModal } from "@/features/wallet/withdraw-modal";
import type { WalletTransaction } from "@/types/wallet";

const toAmount = (value: number | string | undefined) => Number.isFinite(Number(value ?? 0)) ? Number(value ?? 0) : 0;

export function LenderRevenuePanel() {
  const wallet = useWallet();
  const { fetchLenderWallet } = wallet;
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const lender = wallet.lenderWallet;
  const balance = toAmount(lender?.balance);
  const withdrawn = toAmount(lender?.totalWithdrawn ?? lender?.total_withdrawn);
  const transactions = lender?.transactions?.data ?? [];
  useEffect(() => { void fetchLenderWallet(); }, [fetchLenderWallet]);
  return <section className="mt-10 space-y-4" aria-labelledby="lender-revenue-title">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-400">Ví doanh thu</p><h2 id="lender-revenue-title" className="mt-1 font-display text-2xl font-bold">Doanh thu từ gear</h2><p className="mt-1 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Theo dõi số dư, rút tiền và các giao dịch cho thuê tại một nơi.</p></div><button type="button" onClick={() => setWithdrawOpen(true)} disabled={balance <= 0 || wallet.isLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-v-sm bg-gold-metal px-5 py-3 text-sm font-bold text-vanguard-dark-bg disabled:cursor-not-allowed disabled:opacity-50"><ArrowUpRight size={17} /> Rút doanh thu</button></div>
    {wallet.error && <p role="alert" className="rounded-v-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{wallet.error}</p>}
    <div className="grid gap-4 sm:grid-cols-2"><Metric icon={<WalletCards />} label="Doanh thu khả dụng" value={balance} /><Metric icon={<Landmark />} label="Tổng đã rút" value={withdrawn} /></div>
    <Card className="overflow-hidden"><div className="flex items-center gap-3 border-b border-vanguard-light-border p-5 dark:border-vanguard-dark-border"><History className="text-vanguard-primary" size={20} /><div><h3 className="font-display text-lg font-bold">Lịch sử doanh thu</h3><p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{transactions.length} giao dịch gần nhất</p></div></div>{wallet.isLoading && transactions.length === 0 ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-vanguard-primary" /></div> : transactions.length === 0 ? <p className="p-10 text-center text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Chưa có giao dịch doanh thu.</p> : <div className="divide-y divide-vanguard-light-border dark:divide-vanguard-dark-border">{transactions.map((tx) => <Transaction key={tx.id} transaction={tx} />)}</div>}</Card>
    <WithdrawModal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} maxAmount={balance} onSuccess={() => fetchLenderWallet()} />
  </section>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <Card className="border-vanguard-light-border p-5 dark:border-vanguard-dark-border"><div className="flex justify-between text-vanguard-primary"><span className="text-xs font-bold uppercase tracking-widest">{label}</span>{icon}</div><p className="mt-5 text-2xl font-extrabold tabular-nums">{formatCurrency(value)}</p></Card>; }
function Transaction({ transaction: tx }: { transaction: WalletTransaction }) { const outgoing = ["withdrawal", "withdraw"].includes(tx.type); return <article className="flex flex-col gap-2 p-4 sm:flex-row sm:justify-between"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-v-md ${outgoing ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>{outgoing ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}</span><div><p className="text-sm font-semibold">{tx.note || tx.type.replaceAll("_", " ")}</p><p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{tx.reference || tx.id}</p></div></div><div className="pl-12 text-left sm:pl-0 sm:text-right"><p className={`font-bold tabular-nums ${outgoing ? "text-rose-400" : "text-emerald-400"}`}>{outgoing ? "-" : "+"}{formatCurrency(Math.abs(toAmount(tx.amount)))}</p><time className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{tx.created_at || tx.createdAt ? new Date(tx.created_at || tx.createdAt || "").toLocaleString("vi-VN") : ""}</time></div></article>; }
