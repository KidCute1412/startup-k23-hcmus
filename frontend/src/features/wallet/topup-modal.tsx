"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, QrCode, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/components/ui/toast";
import type { TopupCheckout } from "@/types/wallet";

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (topup: TopupCheckout) => void;
}

const PRESET_AMOUNTS = [200000, 500000, 1000000, 2000000, 5000000, 10000000];

export function TopupModal({ isOpen, onClose, onSuccess }: TopupModalProps) {
  const toast = useToast();
  const { createTopupCheckout } = useWallet();
  const [selectedPreset, setSelectedPreset] = useState<number>(500000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
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

  const finalAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedPreset;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0) {
      toast.warning("Vui lòng chọn hoặc nhập số tiền nạp hợp lệ.");
      return;
    }

    setIsLoading(true);
    try {
      const topup = await createTopupCheckout({ amount: finalAmount, method: "payos" });
      onSuccess(topup);
      onClose();
    } catch (err: any) {
      toast.error("Khởi tạo nạp tiền thất bại: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
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

        {/* Header */}
        <div className="border-b border-vanguard-light-border pb-6 dark:border-vanguard-dark-border">
          <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
            Nạp tiền Ví Mutux
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold">Chọn số tiền nạp</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Presets Grid */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Mệnh giá phổ biến
            </label>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(amt);
                    setCustomAmount("");
                  }}
                  className={`rounded-xl border py-3 px-2 text-xs font-bold transition ${
                    selectedPreset === amt && !customAmount
                      ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary shadow-sm"
                      : "border-vanguard-light-border bg-vanguard-light-surfDim hover:border-vanguard-primary/40 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim"
                  }`}
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Hoặc nhập số tiền tùy chọn (VNĐ)
            </label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="VD: 1500000"
              className="mt-2 w-full rounded-xl border border-vanguard-light-border bg-vanguard-light-surf px-4 py-3 text-sm outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim"
            />
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
              disabled={isLoading || finalAmount <= 0}
              className="flex items-center gap-2 rounded-xl bg-vanguard-primary px-6 py-3 text-xs font-bold text-vanguard-dark-bg hover:opacity-90 transition disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <QrCode size={16} />
              )}
              {isLoading ? "Đang xử lý..." : "Tiếp tục thanh toán"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
