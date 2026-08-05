const transactionLabels: Record<string, string> = {
  topup: "Nạp tiền vào ví",
  credit_debt_repay: "Thanh toán dư nợ tín dụng",
  credit_fee: "Phí sử dụng hạn mức Mutux",
  order_lock: "Thanh toán phí thuê",
  deposit_lock: "Khóa tiền cọc",
  deposit_release: "Hoàn tiền cọc",
  compensation: "Khoản bồi thường",
  renter_compensation: "Hoàn tiền thuê do tranh chấp",
  income: "Doanh thu tiền thuê",
  withdrawal: "Rút tiền về ngân hàng",
  withdraw: "Rút tiền về ngân hàng",
  fee_deduction: "Phí nền tảng",
  refund: "Hoàn tiền",
};

const outgoingTransactionTypes = new Set([
  "credit_debt_repay",
  "credit_fee",
  "deposit_lock",
  "fee_deduction",
  "order_lock",
  "withdrawal",
  "withdraw",
]);

export function getWalletTransactionLabel(type: string) {
  return (
    transactionLabels[type] ??
    type
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

export function isOutgoingWalletTransaction(type: string) {
  return outgoingTransactionTypes.has(type);
}
