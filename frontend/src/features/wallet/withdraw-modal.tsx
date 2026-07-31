"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, ArrowUpRight, CheckCircle2, Copy, Landmark, Loader2, ShieldCheck, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useWallet } from "@/hooks/useWallet";
import { FormSelect } from "@/components/ui/select";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxAmount: number;
  onSuccess: () => void;
}

const POPULAR_BANKS = [
  { code: "MBBank", name: "Ngân hàng Quân Đội (MB)" },
  { code: "VCB", name: "Vietcombank" },
  { code: "TCB", name: "Techcombank" },
  { code: "ACB", name: "Ngân hàng Á Châu (ACB)" },
  { code: "BIDV", name: "Ngân hàng BIDV" },
  { code: "VPB", name: "VPBank" },
];

export function WithdrawModal({
  isOpen,
  onClose,
  maxAmount,
  onSuccess,
}: WithdrawModalProps) {
  const { withdraw } = useWallet();
  const [amount, setAmount] = useState<string>("");
  const [bankCode, setBankCode] = useState<string>("MBBank");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountHolder, setAccountHolder] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState<{
    id: string;
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountHolder: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsSuccess(false);
      setErrorMsg(null);
      setWithdrawResult(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const withdrawNum = parseInt(amount, 10) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (withdrawNum <= 0) {
      setErrorMsg("Vui lòng nhập số tiền rút hợp lệ lớn hơn 0 ₫.");
      return;
    }
    if (withdrawNum > maxAmount) {
      setErrorMsg(`Số tiền rút không được vượt quá số dư khả dụng (${formatCurrency(maxAmount)}).`);
      return;
    }
    if (!accountNumber.trim() || !accountHolder.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ số tài khoản và tên chủ tài khoản nhận tiền.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await withdraw({
        amount: withdrawNum,
        bankCode,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
      });

      setWithdrawResult({
        id: result?.id || `WD-${Date.now().toString().slice(-6)}`,
        amount: withdrawNum,
        bankCode,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
      });
      setIsSuccess(true);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Yêu cầu rút tiền thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (withdrawResult?.id) {
      navigator.clipboard.writeText(withdrawResult.id).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] h-screen w-screen min-h-screen overflow-y-auto bg-black/60 p-4 sm:p-6 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-2xl bg-vanguard-light-surf p-8 shadow-2xl dark:border dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf text-vanguard-light-text dark:text-vanguard-dark-text">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-vanguard-light-textMuted hover:bg-vanguard-light-surfDim hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfDim dark:hover:text-vanguard-dark-text transition"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {isSuccess && withdrawResult ? (
          <div className="py-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={40} />
            </div>

            <div className="text-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                Đã ghi nhận yêu cầu
              </span>
              <h3 className="mt-2 font-display text-2xl font-bold">Tạo lệnh rút tiền thành công</h3>
              <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Yêu cầu rút số dư đang được hệ thống xử lý và đối soát tự động.
              </p>
            </div>

            {/* Receipt Card */}
            <div className="mt-6 rounded-xl border border-vanguard-light-border bg-vanguard-light-surfDim p-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-vanguard-light-border/60 dark:border-vanguard-dark-border/60">
                <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Số tiền rút:</span>
                <span className="font-display text-lg font-bold text-vanguard-primary">
                  {formatCurrency(withdrawResult.amount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Mã giao dịch:</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 font-mono font-bold hover:text-vanguard-primary transition"
                >
                  <span>{withdrawResult.id}</span>
                  <Copy size={12} />
                  {copied && <span className="text-[10px] text-emerald-400">Đã chép</span>}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Ngân hàng nhận:</span>
                <span className="font-semibold">{withdrawResult.bankCode}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Số tài khoản:</span>
                <span className="font-mono font-bold">{withdrawResult.accountNumber}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Chủ tài khoản:</span>
                <span className="font-semibold uppercase">{withdrawResult.accountHolder}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                <ShieldCheck size={14} className="text-vanguard-primary" />
                <span>Tiền sẽ chuyển về trong 5-30 phút</span>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl bg-vanguard-primary px-6 py-2.5 text-xs font-bold text-vanguard-dark-bg hover:opacity-90 transition"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="border-b border-vanguard-light-border pb-6 dark:border-vanguard-dark-border">
              <div className="flex items-center gap-2">
                <Landmark className="text-vanguard-primary" size={20} />
                <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
                  Ví Người Cho Thuê
                </p>
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold">Rút tiền về ngân hàng</h2>
              <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Khả dụng rút tối đa: <span className="font-bold font-sans text-vanguard-primary">{formatCurrency(maxAmount)}</span>
              </p>
            </div>

            {/* Error Notification Banner */}
            {errorMsg && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-400 animate-in fade-in duration-200">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Số tiền cần rút (VNĐ)
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="VD: 1000000"
                    className="w-full rounded-xl border border-vanguard-light-border bg-vanguard-light-surf px-4 py-3 font-sans text-sm font-bold outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAmount(String(maxAmount));
                      setErrorMsg(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-vanguard-primary/10 px-2.5 py-1 text-xs font-bold text-vanguard-primary hover:bg-vanguard-primary/20 transition"
                  >
                    Tối đa
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Ngân hàng nhận tiền
                </label>
                <div className="mt-1.5">
                  <FormSelect
                    options={POPULAR_BANKS.map((b) => ({
                      value: b.code,
                      label: `${b.name} (${b.code})`,
                    }))}
                    value={bankCode}
                    onValueChange={(val) => {
                      setBankCode(val);
                      setErrorMsg(null);
                    }}
                    placeholder="Chọn ngân hàng nhận"
                    className="rounded-xl border-vanguard-light-border bg-vanguard-light-surf dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="VD: 1012345678"
                    className="mt-1.5 w-full rounded-xl border border-vanguard-light-border bg-vanguard-light-surf px-4 py-3 font-mono text-sm outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Chủ tài khoản
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => {
                      setAccountHolder(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="VD: NGUYEN VAN A"
                    className="mt-1.5 w-full rounded-xl border border-vanguard-light-border bg-vanguard-light-surf px-4 py-3 text-sm font-semibold uppercase outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-vanguard-light-border pt-6 dark:border-vanguard-dark-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-5 py-3 text-xs font-semibold hover:bg-vanguard-light-surfDim dark:hover:bg-vanguard-dark-surfDim transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading || withdrawNum <= 0 || withdrawNum > maxAmount}
                  className="flex items-center gap-2 rounded-xl bg-vanguard-primary px-6 py-3 text-xs font-bold text-vanguard-dark-bg hover:opacity-90 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowUpRight size={16} />
                  )}
                  {isLoading ? "Đang xử lý..." : "Xác nhận rút tiền"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
