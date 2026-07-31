"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CreditCard, Loader2, ShieldCheck, WalletCards, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useWallet } from "@/hooks/useWallet";
import { PayosModal } from "@/features/wallet/payos-modal";
import type { TopupCheckout } from "@/types/wallet";

interface QuickTopupModalProps {
  isOpen: boolean;
  requiredAmount?: number;
  currentBalance?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_AMOUNTS = [200000, 500000, 1000000, 2000000, 5000000];

export function QuickTopupModal({
  isOpen,
  requiredAmount = 0,
  currentBalance = 0,
  onClose,
  onSuccess,
}: QuickTopupModalProps) {
  const { createTopupCheckout, simulateTopupSuccess } = useWallet();
  const deficit = Math.max(0, requiredAmount - currentBalance);
  
  const [selectedAmount, setSelectedAmount] = useState<number>(deficit > 0 ? deficit : 500000);
  const [customInput, setCustomInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTopup, setActiveTopup] = useState<TopupCheckout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const finalAmount = customInput ? parseInt(customInput, 10) || 0 : selectedAmount;

  const handleStartTopup = async () => {
    if (finalAmount <= 0) {
      alert("Vui lòng chọn hoặc nhập số tiền nạp hợp lệ.");
      return;
    }
    setIsLoading(true);
    try {
      const topup = await createTopupCheckout({ amount: finalAmount, method: "payos" });
      setActiveTopup(topup);
    } catch (e: any) {
      alert("Tạo yêu cầu nạp tiền thất bại: " + (e.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateSuccess = async (topupId: string) => {
    const result = await simulateTopupSuccess(topupId);
    setActiveTopup(null);
    onSuccess();
    onClose();
    return result;
  };

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[9999] h-screen w-screen min-h-screen overflow-y-auto bg-black/60 p-4 sm:p-6 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-2xl bg-vanguard-light-surf p-6 shadow-2xl dark:border dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf text-vanguard-light-text dark:text-vanguard-dark-text">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-vanguard-light-textMuted hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfDim transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center justify-between border-b border-vanguard-light-border pb-4 dark:border-vanguard-dark-border">
            <div>
              <Badge className="bg-vanguard-primary/10 text-vanguard-primary border-vanguard-primary/30">
                Nạp tiền nhanh
              </Badge>
              <h2 className="mt-2 font-display text-xl font-bold">Số dư ví không đủ</h2>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {deficit > 0 && (
              <div className="rounded-v-sm border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300">
                <div className="flex justify-between items-center font-medium">
                  <span>Cần thanh toán đơn:</span>
                  <span className="font-bold">{formatCurrency(requiredAmount)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span>Số dư hiện tại:</span>
                  <span>{formatCurrency(currentBalance)}</span>
                </div>
                <div className="flex justify-between items-center mt-1 font-bold text-amber-600 dark:text-amber-200">
                  <span>Số tiền còn thiếu:</span>
                  <span>{formatCurrency(deficit)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Chọn mệnh giá nạp
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomInput("");
                    }}
                    className={`rounded-v-sm border p-2.5 text-xs font-bold transition ${
                      selectedAmount === amt && !customInput
                        ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary"
                        : "border-vanguard-light-border bg-vanguard-light-surfDim hover:border-vanguard-primary/50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim"
                    }`}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Hoặc nhập số tiền tùy chọn (VNĐ)
              </label>
              <input
                type="number"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={`Tối thiểu ${formatCurrency(deficit || 50000)}`}
                className="mt-1 w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text"
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={handleStartTopup}
                disabled={isLoading || finalAmount <= 0}
                className="w-full bg-vanguard-primary font-bold text-vanguard-dark-bg hover:opacity-90 py-3"
                icon={isLoading ? <Loader2 size={16} className="animate-spin" /> : <WalletCards size={16} />}
              >
                {isLoading ? "Đang tạo lệnh PayOS..." : `Nạp ${formatCurrency(finalAmount)} qua PayOS`}
              </Button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}

      <PayosModal
        topup={activeTopup}
        isOpen={Boolean(activeTopup)}
        onClose={() => setActiveTopup(null)}
        onSimulateSuccess={handleSimulateSuccess}
      />
    </>
  );
}
