"use client";

import { AlertCircle, Send, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/field";
import { PricingSummary } from "./pricing-summary";
import type { RentalRequestDraft } from "./types";
import { useCart, type CartItem } from "@/features/cart/cart-context";
import { useRentalOrder } from "@/hooks/useRentalOrder";
import { useWallet } from "@/hooks/useWallet";
import { useRouter } from "next/navigation";
import { QuickTopupModal } from "@/features/wallet/quick-topup-modal";
import { formatCurrency, rentalDays } from "@/lib/format";

type RentalRequestFormProps = {
  items: CartItem[];
};

export function RentalRequestForm({ items }: RentalRequestFormProps) {
  const { clearCart } = useCart();
  const { createOrder, isLoading: isCreating } = useRentalOrder();
  const { renterWallet, fetchRenterWallet } = useWallet();
  const router = useRouter();

  const [draft, setDraft] = useState<Omit<RentalRequestDraft, "gearId" | "startDate" | "endDate">>({
    depositType: "traditional",
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isQuickTopupOpen, setIsQuickTopupOpen] = useState(false);
  const [insufficientError, setInsufficientError] = useState<string | null>(null);

  useEffect(() => {
    fetchRenterWallet().catch(console.error);
  }, [fetchRenterWallet]);

  // Compute total required amount (rental total + traditional deposit)
  const { totalRentalAmount, totalDepositAmount, totalRequired } = useMemo(() => {
    let rentalSum = 0;
    let depositSum = 0;
    for (const item of items) {
      const days = rentalDays(item.startDate, item.endDate);
      const validDays = days > 0 ? days : 1;
      const gearPrice = (item.gear as any).pricePerDay ?? (item.gear as any).price_per_day ?? item.gear.pricing?.dailyPrice ?? 0;
      const pricePerDay = typeof gearPrice === "string" ? parseFloat(gearPrice) : gearPrice;
      const rawDeposit = (item.gear as any).depositValue ?? (item.gear as any).deposit_value ?? (draft.depositType === "traditional" ? item.gear.pricing?.depositCash : item.gear.pricing?.creditLineRequired) ?? 0;
      const depositVal = typeof rawDeposit === "string" ? parseFloat(rawDeposit) : rawDeposit;
      rentalSum += pricePerDay * validDays;
      depositSum += depositVal;
    }
    const required = draft.depositType === "traditional" ? rentalSum + depositSum : rentalSum;
    return {
      totalRentalAmount: rentalSum,
      totalDepositAmount: depositSum,
      totalRequired: required,
    };
  }, [items, draft.depositType]);

  const rawBalance = renterWallet?.balance ?? 0;
  const currentBalance = typeof rawBalance === "string" ? parseFloat(rawBalance) : rawBalance;
  const isBalanceSufficient = currentBalance >= totalRequired;

  const canSubmit = useMemo(
    () =>
      draft.shippingName.trim() &&
      draft.shippingPhone.trim() &&
      draft.shippingAddress.trim(),
    [draft.shippingAddress, draft.shippingName, draft.shippingPhone],
  );

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5 md:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-vanguard-light-border pb-5 dark:border-vanguard-dark-border">
            <div>
              <Badge>Rental Checkout</Badge>
              <h1 className="mt-3 font-display text-3xl font-bold">
                Yêu cầu thuê ({items.length} thiết bị)
              </h1>
            </div>
          </div>

          {!isBalanceSufficient && (
            <div className="mb-6 rounded-v-sm border border-amber-500/40 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 text-amber-500 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-bold">Ví Mutux của bạn chưa đủ số dư để hoàn tất đơn thuê này!</p>
                  <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Tổng cần thanh toán: <span className="font-bold">{formatCurrency(totalRequired)}</span> — Số dư hiện tại: <span className="font-bold text-vanguard-primary">{formatCurrency(currentBalance)}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsQuickTopupOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-v-sm bg-vanguard-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition"
                  >
                    <WalletCards size={14} /> Nạp tiền ngay qua PayOS
                  </button>
                </div>
              </div>
            </div>
          )}

          {insufficientError && (
            <div className="mb-6 rounded-v-sm border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
              {insufficientError}
            </div>
          )}

          <form
            className="grid gap-5"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!canSubmit) return;
              setInsufficientError(null);

              if (!isBalanceSufficient) {
                setIsQuickTopupOpen(true);
                return;
              }

              try {
                for (const item of items) {
                  await createOrder({
                    gearId: item.gear.id,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    depositType: draft.depositType as "traditional" | "credit_line",
                    shippingName: draft.shippingName,
                    shippingPhone: draft.shippingPhone,
                    shippingAddress: draft.shippingAddress,
                  });
                }
                setSubmitted(true);
                clearCart();
                alert("Tạo đơn thuê thành công!");
                router.push("/orders");
              } catch (e: any) {
                const msg = e.message || "Vui lòng kiểm tra lại số dư ví";
                setInsufficientError("Lỗi tạo yêu cầu thuê: " + msg);
              }
            }}
          >
            <fieldset className="grid gap-3">
              <legend className="font-display text-xs font-semibold uppercase tracking-wider">
                Hình thức cọc
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  key="traditional"
                  className="flex cursor-pointer items-center gap-3 rounded-v-sm border border-vanguard-light-border p-4 text-sm dark:border-vanguard-dark-border"
                >
                  <input
                    type="radio"
                    name="depositType"
                    value="traditional"
                    checked={draft.depositType === "traditional"}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        depositType: "traditional",
                      }))
                    }
                    className="accent-vanguard-primary"
                  />
                  Cọc tiền mặt (Ví ảo)
                </label>
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="font-display text-xs font-semibold uppercase tracking-wider">
                  Người nhận
                </span>
                <Input
                  value={draft.shippingName}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      shippingName: event.target.value,
                    }))
                  }
                  placeholder="Nguyễn Văn A"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-display text-xs font-semibold uppercase tracking-wider">
                  Số điện thoại
                </span>
                <Input
                  value={draft.shippingPhone}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      shippingPhone: event.target.value,
                    }))
                  }
                  placeholder="09xx xxx xxx"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm">
              <span className="font-display text-xs font-semibold uppercase tracking-wider">
                Địa chỉ nhận gear
              </span>
              <Textarea
                value={draft.shippingAddress}
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    shippingAddress: event.target.value,
                  }))
                }
                placeholder="Số nhà, phường/xã, quận/huyện, tỉnh/thành"
              />
            </label>

            {submitted ? (
              <div className="rounded-v-sm border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">
                Bản nháp yêu cầu thuê đã được tạo thành công.
              </div>
            ) : null}

            <Button type="submit" disabled={!canSubmit || isCreating} icon={<Send size={15} />}>
              {isCreating ? "Đang xử lý..." : "Tạo yêu cầu thuê & Thanh toán"}
            </Button>
          </form>
        </Card>

        <PricingSummary
          items={items}
          depositType={draft.depositType}
        />
      </div>

      <QuickTopupModal
        isOpen={isQuickTopupOpen}
        requiredAmount={totalRequired}
        currentBalance={currentBalance}
        onClose={() => setIsQuickTopupOpen(false)}
        onSuccess={() => {
          fetchRenterWallet().catch(console.error);
          setInsufficientError(null);
        }}
      />
    </>
  );
}
