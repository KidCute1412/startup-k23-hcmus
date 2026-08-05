"use client";

import { AlertCircle, CheckCircle2, Send, WalletCards } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PricingSummary } from "./pricing-summary";
import type { RentalRequestDraft } from "./types";
import { useCart, type CartItem } from "@/features/cart/cart-context";
import { useWallet } from "@/hooks/useWallet";
import { useAddresses } from "@/hooks/useAddresses";
import { useRouter } from "next/navigation";
import { QuickTopupModal } from "@/features/wallet/quick-topup-modal";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { ApiError, errorText } from "@/hooks/useCart";
import { useRentalOrder } from "@/hooks/useRentalOrder";
import type { RentalFinancialSummary } from "@/types/rentals";

type RentalRequestFormProps = {
  items: CartItem[];
};

type WalletLoadStatus = "loading" | "ready" | "error";

export function RentalRequestForm({ items }: RentalRequestFormProps) {
  const toast = useToast();
  const { checkout, mutating: isCreating } = useCart();
  const { fetchFinancialSummary } = useRentalOrder();
  const { renterWallet, creditLine, fetchRenterWallet, fetchCreditLine } =
    useWallet();
  const {
    addresses,
    isLoading: areAddressesLoading,
    error: addressesError,
  } = useAddresses();
  const router = useRouter();

  const [draft, setDraft] = useState<
    Omit<RentalRequestDraft, "gearId" | "startDate" | "endDate">
  >({
    depositType: "traditional",
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
  });

  const [touched, setTouched] = useState<{
    address?: boolean;
  }>({});
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [isQuickTopupOpen, setIsQuickTopupOpen] = useState(false);
  const [insufficientError, setInsufficientError] = useState<string | null>(
    null,
  );
  const [checkoutErrorDetails, setCheckoutErrorDetails] = useState<
    string | null
  >(null);
  const [checkoutErrorCode, setCheckoutErrorCode] = useState<string | null>(
    null,
  );
  const [cashWalletStatus, setCashWalletStatus] =
    useState<WalletLoadStatus>("loading");
  const [creditWalletStatus, setCreditWalletStatus] =
    useState<WalletLoadStatus>("loading");
  const [financialSummary, setFinancialSummary] =
    useState<RentalFinancialSummary | null>(null);
  const [financialSummaryStatus, setFinancialSummaryStatus] =
    useState<WalletLoadStatus>("loading");

  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      setSelectedAddressId(
        addresses.find((address) => address.isDefault)?.id ?? addresses[0].id,
      );
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    const selected = addresses.find(
      (address) => address.id === selectedAddressId,
    );
    if (!selected) return;
    setDraft((current) => ({
      ...current,
      shippingName: selected.receiverName,
      shippingPhone: selected.phone,
      shippingAddress: [
        selected.detailAddress,
        selected.ward,
        selected.district,
        selected.province,
      ].join(", "),
    }));
  }, [addresses, selectedAddressId]);

  const refreshWallets = useCallback(async () => {
    setCashWalletStatus("loading");
    setCreditWalletStatus("loading");
    setFinancialSummaryStatus("loading");
    const cashRequest = fetchRenterWallet()
      .then(() => setCashWalletStatus("ready" as const))
      .catch(() => setCashWalletStatus("error" as const));
    const creditRequest = fetchCreditLine()
      .then(() => setCreditWalletStatus("ready" as const))
      .catch(() => setCreditWalletStatus("error" as const));
    const summaryRequest = fetchFinancialSummary()
      .then((summary) => {
        setFinancialSummary(summary);
        setFinancialSummaryStatus("ready");
      })
      .catch(() => setFinancialSummaryStatus("error"));
    await Promise.allSettled([cashRequest, creditRequest, summaryRequest]);
  }, [fetchCreditLine, fetchFinancialSummary, fetchRenterWallet]);

  useEffect(() => {
    void refreshWallets();
  }, [refreshWallets]);

  // Real-time Form Validation
  const trimmedAddress = draft.shippingAddress.trim();

  const isAddressValid =
    Boolean(selectedAddressId) && trimmedAddress.length >= 5;

  const isFormValid = isAddressValid;

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

  const rawBalance =
    renterWallet?.availableBalance ?? renterWallet?.balance ?? 0;
  const currentBalance =
    typeof rawBalance === "string" ? parseFloat(rawBalance) : rawBalance;
  const availableCredit = creditLine?.displayBalance ?? 0;
  const cashRequired =
    draft.depositType === "traditional"
      ? totalRentalAmount + totalDepositAmount
      : totalRentalAmount;
  const pendingCashCommitment =
    financialSummary?.cash.pendingCashCommitment ?? 0;
  const pendingCreditCommitment =
    financialSummary?.credit.pendingDepositCommitment ?? 0;
  const cashRequiredWithPending = cashRequired + pendingCashCommitment;
  const creditRequiredWithPending =
    totalDepositAmount + pendingCreditCommitment;
  const isBalanceSufficient = currentBalance >= cashRequiredWithPending;
  const isCreditSufficient =
    draft.depositType !== "credit_line" ||
    availableCredit >= creditRequiredWithPending;
  const isSelectedWalletReady =
    cashWalletStatus === "ready" &&
    (draft.depositType !== "credit_line" || creditWalletStatus === "ready");
  const isCreditUsable =
    creditWalletStatus === "ready" &&
    creditLine?.granted === true &&
    creditLine.status === "active";
  const areWalletsActive =
    renterWallet?.status === "active" &&
    (draft.depositType !== "credit_line" || isCreditUsable);
  const isFinanciallyReady =
    isSelectedWalletReady &&
    financialSummaryStatus === "ready" &&
    areWalletsActive &&
    isBalanceSufficient &&
    isCreditSufficient;
  const cashShortfall = Math.max(0, cashRequiredWithPending - currentBalance);
  const creditShortfall = Math.max(
    0,
    creditRequiredWithPending - availableCredit,
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

          {(cashWalletStatus === "loading" ||
            (draft.depositType === "credit_line" &&
              creditWalletStatus === "loading") ||
            financialSummaryStatus === "loading") && (
            <div className="mb-6 rounded-v-sm border border-vanguard-primary/40 bg-vanguard-primary/10 p-4 text-sm text-vanguard-secondary dark:text-vanguard-primary">
              Đang xác minh số dư ví và hạn mức Mutux…
            </div>
          )}

          {cashWalletStatus === "error" && (
            <div
              role="alert"
              className="mb-6 rounded-v-sm border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200"
            >
              <p className="font-bold">
                Không thể xác minh số dư ví tiêu dùng.
              </p>
              <p className="mt-1 text-xs">
                Vui lòng tải lại thông tin ví trước khi gửi yêu cầu thuê.
              </p>
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
            <div
              role="alert"
              className="mb-6 rounded-v-sm border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200"
            >
              <p className="font-bold">Không thể tải hạn mức Mutux.</p>
              <p className="mt-1 text-xs">
                Bạn vẫn có thể chọn cọc tiền mặt bằng ví ảo hoặc thử tải lại hạn
                mức.
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

          {financialSummaryStatus === "error" && (
            <div
              role="alert"
              className="mb-6 rounded-v-sm border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200"
            >
              <p className="font-bold">
                Không thể kiểm tra các đơn đang chờ xác nhận.
              </p>
              <p className="mt-1 text-xs">
                Vui lòng thử lại trước khi gửi yêu cầu thuê để kiểm tra đúng khả
                năng chi trả.
              </p>
              <button
                type="button"
                onClick={() => void refreshWallets()}
                className="mt-3 rounded-v-sm border border-rose-500/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
              >
                Thử lại
              </button>
            </div>
          )}

          {isSelectedWalletReady && !isFinanciallyReady && (
            <div className="mb-6 rounded-v-sm border border-amber-500/40 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="mt-0.5 text-amber-500 shrink-0"
                />
                <div className="flex-1 text-sm">
                  <p className="font-bold">
                    Ví Mutux của bạn chưa đủ số dư để hoàn tất đơn thuê này!
                  </p>
                  <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Cần {formatCurrency(cashRequiredWithPending)} từ ví tiêu
                    dùng, gồm {formatCurrency(pendingCashCommitment)} nghĩa vụ
                    từ đơn đang chờ
                    {draft.depositType === "credit_line" &&
                      ` và ${formatCurrency(creditRequiredWithPending)} hạn mức, gồm ${formatCurrency(pendingCreditCommitment)} từ đơn đang chờ`}
                    . Hiện có {formatCurrency(currentBalance)} trong ví
                    {draft.depositType === "credit_line" &&
                      ` và ${formatCurrency(availableCredit)} hạn mức`}
                    .
                  </p>
                  {financialSummary?.pendingOrderCount ? (
                    <p className="mt-1 text-xs">
                      Có {financialSummary.pendingOrderCount} đơn đang chờ
                      lender xác nhận. Các đơn này chưa trừ tiền nhưng vẫn được
                      tính vào khả năng chi trả.
                    </p>
                  ) : null}
                  {(!isBalanceSufficient || !isCreditSufficient) && (
                    <p className="mt-1 text-xs font-semibold">
                      Còn thiếu{" "}
                      {!isBalanceSufficient
                        ? formatCurrency(cashShortfall)
                        : ""}
                      {!isBalanceSufficient && !isCreditSufficient
                        ? " trong ví và "
                        : ""}
                      {!isCreditSufficient
                        ? `${formatCurrency(creditShortfall)} hạn mức`
                        : ""}
                      .
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
                    {!isBalanceSufficient
                      ? "Nạp tiền ngay qua PayOS"
                      : "Quản lý hạn mức Mutux"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {insufficientError && (
            <div className="mb-6 rounded-v-sm border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="mt-0.5 text-rose-500 shrink-0"
                />
                <div className="flex-1">
                  <p className="font-bold">Không thể khởi tạo yêu cầu thuê!</p>
                  <p className="mt-1 text-xs">{insufficientError}</p>
                  {checkoutErrorDetails && (
                    <p className="mt-1 text-xs font-semibold">
                      {checkoutErrorDetails}
                    </p>
                  )}
                  {(checkoutErrorCode === "INSUFFICIENT_CASH" ||
                    checkoutErrorCode === "INSUFFICIENT_FUNDS" ||
                    checkoutErrorCode === "INSUFFICIENT_CREDIT") && (
                    <button
                      type="button"
                      onClick={() => {
                        if (checkoutErrorCode === "INSUFFICIENT_CREDIT")
                          router.push("/wallet");
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
                  <h4 className="font-bold text-base">
                    Tạo yêu cầu thuê thành công!
                  </h4>
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                    Đơn thuê của bạn đã được khởi tạo và gửi tới chủ sở hữu
                    gear. Đang chuyển hướng đến danh sách đơn thuê...
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
                setCheckoutErrorDetails(null);

                // Mark all touched
                setTouched({ address: true });

                if (!isFormValid) {
                  toast.warning(
                    "Vui lòng điền đầy đủ và chính xác thông tin giao nhận.",
                  );
                  return;
                }

                if (!isSelectedWalletReady) {
                  toast.warning(
                    "Chưa thể xác minh thông tin ví. Vui lòng thử lại.",
                  );
                  return;
                }

                if (!isFinanciallyReady) {
                  toast.warning(
                    "Số dư ví hoặc hạn mức Mutux chưa đủ để gửi yêu cầu thuê.",
                  );
                  return;
                }

                try {
                  await checkout({
                    cartItemIds: items.map((item) => item.id),
                    depositType: draft.depositType as
                      | "traditional"
                      | "credit_line",
                    addressId: selectedAddressId,
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
                    e instanceof ApiError &&
                    e.details &&
                    typeof e.details === "object"
                  ) {
                    const details = e.details as {
                      available?: number;
                      pendingCommitment?: number;
                      currentOrderRequirement?: number;
                      totalRequired?: number;
                      shortfall?: number;
                    };
                    const detailText = [
                      details.available !== undefined
                        ? `Khả dụng: ${formatCurrency(details.available)}`
                        : null,
                      details.pendingCommitment !== undefined
                        ? `Đang chờ: ${formatCurrency(details.pendingCommitment)}`
                        : null,
                      details.currentOrderRequirement !== undefined
                        ? `Đơn này: ${formatCurrency(details.currentOrderRequirement)}`
                        : null,
                      details.totalRequired !== undefined
                        ? `Tổng cần: ${formatCurrency(details.totalRequired)}`
                        : null,
                      details.shortfall !== undefined
                        ? `Thiếu: ${formatCurrency(details.shortfall)}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ");
                    setCheckoutErrorDetails(detailText || null);
                  }

                  if (
                    code === "INSUFFICIENT_FUNDS" ||
                    code === "INSUFFICIENT_CASH" ||
                    code === "INSUFFICIENT_CREDIT"
                  ) {
                    await refreshWallets();
                    if (code !== "INSUFFICIENT_CREDIT")
                      setIsQuickTopupOpen(true);
                  }
                }
              }}
            >
              <fieldset className="grid gap-3">
                <legend className="font-display text-xs font-semibold uppercase tracking-wider mb-5">
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

              <fieldset className="grid gap-3">
                <legend className="font-display text-xs font-semibold uppercase tracking-wider mb-5">
                  Chọn địa chỉ nhận gear *
                </legend>
                {areAddressesLoading && (
                  <p className="text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Đang tải sổ địa chỉ...
                  </p>
                )}
                {addressesError && (
                  <p className="text-sm text-rose-500">{addressesError}</p>
                )}
                {!areAddressesLoading && addresses.length === 0 && (
                  <div className="rounded-v-sm border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                    <p className="font-semibold">
                      Bạn chưa có địa chỉ giao nhận.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/account?tab=addresses")}
                      className="mt-2 font-bold text-vanguard-secondary underline dark:text-vanguard-primary"
                    >
                      Thêm địa chỉ trong sổ địa chỉ
                    </button>
                  </div>
                )}
                <div className="grid gap-3">
                  {addresses.map((address) => {
                    const fullAddress = [
                      address.detailAddress,
                      address.ward,
                      address.district,
                      address.province,
                    ].join(", ");
                    return (
                      <label
                        key={address.id}
                        className={`flex cursor-pointer gap-3 rounded-v-sm border p-4 text-sm transition ${selectedAddressId === address.id ? "border-vanguard-primary bg-vanguard-primary/10" : "border-vanguard-light-border dark:border-vanguard-dark-border"}`}
                      >
                        <input
                          type="radio"
                          name="addressId"
                          value={address.id}
                          checked={selectedAddressId === address.id}
                          onChange={() => {
                            setSelectedAddressId(address.id);
                            setTouched({ address: true });
                          }}
                          className="mt-1 accent-vanguard-primary"
                        />
                        <span className="grid gap-1">
                          <span className="font-semibold">
                            {address.receiverName} · {address.phone}
                          </span>
                          <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                            {fullAddress}
                          </span>
                          {address.isDefault && (
                            <span className="text-xs font-bold uppercase tracking-wider text-vanguard-secondary dark:text-vanguard-primary">
                              Mặc định
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {touched.address && !isAddressValid && addresses.length > 0 && (
                  <span className="text-xs font-medium text-rose-500">
                    Vui lòng chọn một địa chỉ giao nhận
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => router.push("/account?tab=addresses")}
                  className="justify-self-start text-sm font-bold text-vanguard-secondary underline dark:text-vanguard-primary"
                >
                  Quản lý sổ địa chỉ
                </button>
              </fieldset>

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
