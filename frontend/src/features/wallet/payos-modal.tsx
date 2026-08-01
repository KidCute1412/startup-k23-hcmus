"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Copy, RefreshCw, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import type { TopupCheckout, TopupCompletion } from "@/types/wallet";

interface PayosModalProps {
  topup: TopupCheckout | null;
  isOpen: boolean;
  onClose: () => void;
  onSimulateSuccess: (topupId: string) => Promise<TopupCompletion>;
}

export function PayosModal({ topup, isOpen, onClose, onSimulateSuccess }: PayosModalProps) {
  const toast = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [completion, setCompletion] = useState<TopupCompletion | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!isOpen) {
      setCompletion(null);
      setIsVerifying(false);
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !topup || !mounted) return null;
  const instructions = topup.paymentInstructions;
  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };
  const simulate = async () => {
    setIsVerifying(true);
    try {
      setCompletion(await onSimulateSuccess(topup.topupId));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Không thể mô phỏng thanh toán.");
    } finally {
      setIsVerifying(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xl">
      <div className="relative w-full max-w-xl rounded-2xl border border-vanguard-light-border bg-vanguard-light-surf p-8 text-vanguard-light-text shadow-2xl transition-colors dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text">
        <button onClick={onClose} className="absolute right-5 top-5 rounded-full p-2 text-vanguard-light-textMuted transition hover:bg-vanguard-light-surfDim hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfDim dark:hover:text-vanguard-dark-text" aria-label="Đóng"><X size={20} /></button>
        {completion ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto text-emerald-400" size={52} />
            <h2 className="mt-4 font-display text-2xl font-bold">Mô phỏng hoàn tất</h2>
            <p className="mt-2 text-sm">Số dư ví demo: <strong className="text-vanguard-primary">{formatCurrency(completion.walletBalance)}</strong></p>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-vanguard-primary">PayOS mock / demo</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Hướng dẫn chuyển khoản mô phỏng</h2>
            <p className="mt-3 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Đây không phải giao dịch ngân hàng thật và hệ thống không tạo mã QR. Dùng thông tin do backend cung cấp để kiểm thử, hoặc chọn mô phỏng thành công.
            </p>
            <dl className="mt-6 space-y-4 rounded-xl border border-vanguard-light-border bg-vanguard-light-surfDim p-5 text-sm dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim">
              {[
                ["Ngân hàng", instructions.bankCode],
                ["Số tài khoản", instructions.accountNumber],
                ["Tên tài khoản", instructions.accountName],
                ["Nội dung", instructions.transferContent],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{label}</dt>
                  <dd><button onClick={() => copy(label, value)} className="flex items-center gap-2 font-mono font-bold"><span>{value}</span><Copy size={13} />{copied === label && <span className="text-xs text-emerald-400">Đã chép</span>}</button></dd>
                </div>
              ))}
              <div className="flex justify-between"><dt>Số tiền</dt><dd className="font-bold text-vanguard-primary">{formatCurrency(topup.amount)}</dd></div>
            </dl>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="rounded-xl px-5 py-3 text-xs font-semibold transition hover:bg-vanguard-light-surfDim dark:hover:bg-vanguard-dark-surfDim">Hủy</button>
              <button onClick={simulate} disabled={isVerifying} className="flex items-center gap-2 rounded-xl bg-vanguard-primary px-5 py-3 text-xs font-bold text-vanguard-dark-bg disabled:opacity-50">
                {isVerifying ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {isVerifying ? "Đang mô phỏng..." : "Mô phỏng thanh toán thành công"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
