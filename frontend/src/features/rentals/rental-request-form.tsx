"use client";

import { AlertCircle, CheckCircle2, Send, WalletCards } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/field";
import { PricingSummary } from "./pricing-summary";
import type { RentalRequestDraft } from "./types";
import { useCart, type CartItem } from "@/features/cart/cart-context";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { QuickTopupModal } from "@/features/wallet/quick-topup-modal";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { ApiError, errorText } from "@/hooks/useCart";

type RentalRequestFormProps = {
  items: CartItem[];
};

type WalletLoadStatus = "loading" | "ready" | "error";

export function RentalRequestForm({ items }: RentalRequestFormProps) {
  const toast = useToast();
  const { checkout, mutating: isCreating } = useCart();
  const { renterWallet, creditLine, fetchRenterWallet, fetchCreditLine } = useWallet();
  const { user } = useAuth();
  const router = useRouter();

  const [draft, setDraft] = useState<Omit<RentalRequestDraft, "gearId" | "startDate" | "endDate">>({
    depositType: "traditional",
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
  });

  const [touched, setTouched] = useState<{
    shippingName?: boolean;
    shippingPhone?: boolean;
    shippingAddress?: boolean;
  }>({});

  const [submitted, setSubmitted] = useState(false);
  const [isQuickTopupOpen, setIsQuickTopupOpen] = useState(false);
  const [insufficientError, setInsufficientError] = useState<string | null>(null);
  const [checkoutErrorCode, setCheckoutErrorCode] = useState<string | null>(null);
  const [cashWalletStatus, setCashWalletStatus] = useState<WalletLoadStatus>("loading");
  const [creditWalletStatus, setCreditWalletStatus] = useState<WalletLoadStatus>("loading");

  // Auto-fill delivery info from authenticated user profile if available
  useEffect(() => {
    if (user) {
      setDraft((current) => {
        const shippingName = current.shippingName || user.fullName || "";
        const shippingPhone = current.shippingPhone || user.phone || "";
        const shippingAddress = current.shippingAddress || user.address || "";
        if (
          shippingName === current.shippingName &&
          shippingPhone === current.shippingPhone &&
          shippingAddress === current.shippingAddress
        ) {
          return current;
        }
        return { ...current, shippingName, shippingPhone, shippingAddress };
      });
    }
  }, [user]);

  const refreshWallets = useCallback(async () => {
    setCashWalletStatus("loading");
    setCreditWalletStatus("loading");
    const cashRequest = fetchRenterWallet()
      .then(() => setCashWalletStatus("ready" as const))
      .catch(() => setCashWalletStatus("error" as const));
    const creditRequest = fetchCreditLine()
      .then(() => setCreditWalletStatus("ready" as const))
      .catch(() => setCreditWalletStatus("error" as const));
    await Promise.allSettled([cashRequest, creditRequest]);
  }, [fetchCreditLine, fetchRenterWallet]);

  useEffect(() => {
    void refreshWallets();
  }, [refreshWallets]);

  // Real-time Form Validation
  const trimmedName = draft.shippingName.trim();
  const trimmedPhone = draft.shippingPhone.trim();
  const trimmedAddress = draft.shippingAddress.trim();

  const isNameValid = trimmedName.length > 0;
  const phoneRegex = /^(0[35789])[0-9]{8}$/;
  const isPhoneValid = phoneRegex.test(trimmedPhone);
  const isAddressValid = trimmedAddress.length >= 5;

  const isFormValid = isNameValid && isPhoneValid && isAddressValid;

  // Compute total required amount (rental total + traditional deposit)
  const { totalRentalAmount, totalDepositAmount } = useMemo(() => {
    let rentalSum = 0;
    let depositSum = 0;
    for (const item of items) {
      rentalSum += item.rentalFee;
      depositSum += item.depositAmount;
    }
    return {
      totalRentalAmount: rentalSum,
      totalDepositAmount: depositSum,
    };
  }, [items]);

  const rawBalance = renterWallet?.availableBalance ?? renterWallet?.balance ?? 0;
  const currentBalance = typeof rawBalance === "string" ? parseFloat(rawBalance) : rawBalance;
  const availableCredit = creditLine?.displayBalance ?? 0;
  const cashRequired = draft.depositType === "traditional"
    ? totalRentalAmount + totalDepositAmount
    : totalRentalAmount;
  const isBalanceSufficient = currentBalance >= cashRequired;
  const isCreditSufficient = draft.depositType !== "credit_line" || availableCredit >= totalDepositAmount;
  const isSelectedWalletReady = cashWalletStatus === "ready" &&
    (draft.depositType !== "credit_line" || creditWalletStatus === "ready");
  const isCreditUsable = creditWalletStatus === "ready" &&
    creditLine?.granted === true && creditLine.status === "active";
  const areWalletsActive = renterWallet?.status === "active" &&
    (draft.depositType !== "credit_line" || isCreditUsable);
  const isFinanciallyReady = isSelectedWalletReady &&
    areWalletsActive && isBalanceSufficient && isCreditSufficient;
  const cashShortfall = Math.max(0, cashRequired - currentBalance);
  const creditShortfall = Math.max(0, totalDepositAmount - availableCredit);

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

          {(cashWalletStatus === "loading" ||
            (draft.depositType === "credit_line" && creditWalletStatus === "loading")) && (
            <div className="mb-6 rounded-v-sm border border-vanguard-primary/40 bg-vanguard-primary/10 p-4 text-sm text-vanguard-secondary dark:text-vanguard-primary">
              Đang xác minh số dư ví và hạn mức Mutux…
            </div>
          )}

          {cashWalletStatus === "error" && (
            <div role="alert" className="mb-6 rounded-v-sm border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
              <p className="font-bold">Không thể xác minh số dư ví tiêu dùng.</p>
              <p className="mt-1 text-xs">Vui lòng tải lại thông tin ví trước khi gửi yêu cầu thuê.</p>
              <button
                type="button"
                onClick={() => void refreshWallets()}
                className="mt-3 rounded-v-sm border border-rose-500/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
              >
                Thử lại
              </button>
            </div>
          )}

          {creditWalletStatus === "error" && cashWalletStatus === "ready" && (
            <div role="alert" className="mb-6 rounded-v-sm border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-bold">Không thể tải hạn mức Mutux.</p>
              <p className="mt-1 text-xs">
                Bạn vẫn có thể chọn cọc tiền mặt bằng ví ảo hoặc thử tải lại hạn mức.
              </p>
              <button
                type="button"
                onClick={() => void refreshWallets()}
                className="mt-3 rounded-v-sm border border-amber-500/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
              >
                Thử lại
              </button>
            </div>
          )}

          {isSelectedWalletReady && !isFinanciallyReady && (
            <div className="mb-6 rounded-v-sm border border-amber-500/40 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 text-amber-500 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-bold">Ví Mutux của bạn chưa đủ số dư để hoàn tất đơn thuê này!</p>
                  <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Cần {formatCurrency(cashRequired)} từ ví tiêu dùng
                    {draft.depositType === "credit_line" && ` và ${formatCurrency(totalDepositAmount)} hạn mức khả dụng`}.
                    {" "}Hiện có {formatCurrency(currentBalance)} trong ví
                    {draft.depositType === "credit_line" && ` và ${formatCurrency(availableCredit)} hạn mức`}.
                  </p>
                  {(!isBalanceSufficient || !isCreditSufficient) && (
                    <p className="mt-1 text-xs font-semibold">
                      Còn thiếu {!isBalanceSufficient ? formatCurrency(cashShortfall) : ""}
                      {!isBalanceSufficient && !isCreditSufficient ? " trong ví và " : ""}
                      {!isCreditSufficient ? `${formatCurrency(creditShortfall)} hạn mức` : ""}.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isBalanceSufficient) setIsQuickTopupOpen(true);
                      else router.push("/wallet");
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-v-sm bg-vanguard-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition"
                  >
                    <WalletCards size={14} />
                    {!isBalanceSufficient ? "Nạp tiền ngay qua PayOS" : "Quản lý hạn mức Mutux"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {insufficientError && (
            <div className="mb-6 rounded-v-sm border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 text-rose-500 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold">Không thể khởi tạo yêu cầu thuê!</p>
                  <p className="mt-1 text-xs">{insufficientError}</p>
                  {(checkoutErrorCode === "INSUFFICIENT_CASH" ||
                    checkoutErrorCode === "INSUFFICIENT_FUNDS" ||
                    checkoutErrorCode === "INSUFFICIENT_CREDIT") && (
                    <button
                      type="button"
                      onClick={() => {
                        if (checkoutErrorCode === "INSUFFICIENT_CREDIT") router.push("/wallet");
                        else setIsQuickTopupOpen(true);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-v-sm bg-vanguard-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition"
                    >
                      <WalletCards size={14} />
                      {checkoutErrorCode === "INSUFFICIENT_CREDIT"
                        ? "Quản lý hạn mức Mutux"
                        : "Nạp tiền bổ sung qua PayOS"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {submitted ? (
            <div className="mb-6 rounded-v-sm border border-emerald-500/40 bg-emerald-500/10 p-5 text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-base">Tạo yêu cầu thuê thành công!</h4>
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                    Đơn thuê của bạn đã được khởi tạo và gửi tới chủ sở hữu gear. Đang chuyển hướng đến danh sách đơn thuê...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form
              className="grid gap-5"
              onSubmit={async (event) => {
                event.preventDefault();
                setInsufficientError(null);
                setCheckoutErrorCode(null);

                // Mark all touched
                setTouched({ shippingName: true, shippingPhone: true, shippingAddress: true });

                if (!isFormValid) {
                  toast.warning("Vui lòng điền đầy đủ và chính xác thông tin giao nhận.");
                  return;
                }

                if (!isSelectedWalletReady) {
                  toast.warning("Chưa thể xác minh thông tin ví. Vui lòng thử lại.");
                  return;
                }

                if (!isFinanciallyReady) {
                  toast.warning("Số dư ví hoặc hạn mức Mutux chưa đủ để gửi yêu cầu thuê.");
                  return;
                }

                try {
                  await checkout({
                    cartItemIds: items.map((item) => item.id),
                    depositType: draft.depositType as "traditional" | "credit_line",
                    shippingName: trimmedName,
                    shippingPhone: trimmedPhone,
                    shippingAddress: trimmedAddress,
                  });
                  toast.success("Tạo yêu cầu thuê thành công!");
                  setSubmitted(true);
                  setTimeout(() => {
                    router.push("/orders");
                  }, 1500);
                } catch (e: any) {
                  const code = e instanceof ApiError ? e.code : e?.code;
                  const msg = errorText(e);
                  toast.error(msg);
                  setInsufficientError(msg);
                  setCheckoutErrorCode(code ?? null);

                  if (
                    code === "INSUFFICIENT_FUNDS" ||
                    code === "INSUFFICIENT_CASH" ||
                    code === "INSUFFICIENT_CREDIT"
                  ) {
                    await refreshWallets();
                    if (code !== "INSUFFICIENT_CREDIT") setIsQuickTopupOpen(true);
                  }
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
                  <label
                    key="credit_line"
                    className="flex cursor-pointer items-center gap-3 rounded-v-sm border border-vanguard-light-border p-4 text-sm dark:border-vanguard-dark-border"
                  >
                    <input
                      type="radio"
                      name="depositType"
                      value="credit_line"
                      checked={draft.depositType === "credit_line"}
                      disabled={!isCreditUsable}
                      onChange={() =>
                        setDraft((current) => ({
                          ...current,
                          depositType: "credit_line",
                        }))
                      }
                      className="accent-vanguard-primary"
                    />
                    Cọc bằng hạn mức Mutux
                    {!isCreditUsable && (
                      <span className="text-xs text-vanguard-light-textMuted">
                        {creditWalletStatus === "error"
                          ? "(không tải được)"
                          : creditLine?.status === "expired"
                            ? "(đã hết hạn)"
                            : "(chưa được cấp)"}
                      </span>
                    )}
                  </label>
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="font-display text-xs font-semibold uppercase tracking-wider">
                    Người nhận *
                  </span>
                  <Input
                    value={draft.shippingName}
                    onChange={(event) => {
                      setDraft((value) => ({
                        ...value,
                        shippingName: event.target.value,
                      }));
                      setTouched((t) => ({ ...t, shippingName: true }));
                    }}
                    onBlur={() => setTouched((t) => ({ ...t, shippingName: true }))}
                    placeholder="Nguyễn Văn A"
                  />
                  {touched.shippingName && !isNameValid ? (
                    <span className="text-xs text-rose-500 font-medium">Vui lòng nhập tên người nhận</span>
                  ) : (
                    <span className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Tên đầy đủ người nhận hàng</span>
                  )}
                </label>

                <label className="grid gap-2 text-sm">
                  <span className="font-display text-xs font-semibold uppercase tracking-wider">
                    Số điện thoại *
                  </span>
                  <Input
                    value={draft.shippingPhone}
                    onChange={(event) => {
                      setDraft((value) => ({
                        ...value,
                        shippingPhone: event.target.value,
                      }));
                      setTouched((t) => ({ ...t, shippingPhone: true }));
                    }}
                    onBlur={() => setTouched((t) => ({ ...t, shippingPhone: true }))}
                    placeholder="09xx xxx xxx"
                  />
                  {touched.shippingPhone && !isPhoneValid ? (
                    <span className="text-xs text-rose-500 font-medium">Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09)</span>
                  ) : (
                    <span className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">10 chữ số bắt đầu bằng 03, 05, 07, 08, 09</span>
                  )}
                </label>
              </div>

              <label className="grid gap-2 text-sm">
                <span className="font-display text-xs font-semibold uppercase tracking-wider">
                  Địa chỉ nhận gear *
                </span>
                <Textarea
                  value={draft.shippingAddress}
                  onChange={(event) => {
                    setDraft((value) => ({
                      ...value,
                      shippingAddress: event.target.value,
                    }));
                    setTouched((t) => ({ ...t, shippingAddress: true }));
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, shippingAddress: true }))}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                />
                {touched.shippingAddress && !isAddressValid ? (
                  <span className="text-xs text-rose-500 font-medium">Địa chỉ giao nhận phải có ít nhất 5 ký tự</span>
                ) : (
                  <span className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Địa chỉ giao nhận chi tiết (tối thiểu 5 ký tự)</span>
                )}
              </label>

              <Button
                type="submit"
                disabled={!isFormValid || !isFinanciallyReady || isCreating}
                icon={<Send size={15} />}
                className="w-full bg-vanguard-primary font-bold text-vanguard-dark-bg hover:opacity-90 disabled:opacity-50 py-3"
              >
                {isCreating ? "Đang xử lý..." : "Gửi yêu cầu thuê"}
              </Button>
            </form>
          )}
        </Card>

        <PricingSummary
          items={items}
          depositType={draft.depositType as "traditional" | "credit_line"}
        />
      </div>

      <QuickTopupModal
        isOpen={isQuickTopupOpen}
        requiredAmount={cashRequired}
        currentBalance={currentBalance}
        onClose={() => setIsQuickTopupOpen(false)}
        onSuccess={() => {
          void refreshWallets();
          setInsufficientError(null);
          setCheckoutErrorCode(null);
        }}
      />
    </>
  );
}
