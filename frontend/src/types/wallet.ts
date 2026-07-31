export interface WalletTransaction {
  id: string;
  wallet_id?: string;
  walletId?: string;
  type: string;
  amount: number | string;
  balance_before?: number | string;
  balanceBefore?: number | string;
  balance_after?: number | string;
  balanceAfter?: number | string;
  reference?: string | null;
  note?: string | null;
  created_at?: string;
  createdAt?: string;
}

export type RenterWalletTransaction = WalletTransaction;

export interface PaymentInstructions {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
}

export interface TopupCheckout {
  topupId: string;
  orderCode: number;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  paymentInstructions: PaymentInstructions;
}

export interface TopupCompletion {
  topupId: string;
  status: 'success';
  walletBalance: number;
}

export interface RenterWallet {
  id: string;
  user_id?: string;
  userId?: string;
  balance: number | string;
  locked_balance?: number | string;
  lockedBalance?: number | string;
  frozenBalance?: number;
  isActive?: boolean;
  transactions?: RenterWalletTransaction[];
}

export interface LenderWallet {
  id: string;
  lender_id?: string;
  userId?: string;
  balance: number | string;
  total_withdrawn?: number | string;
  frozenBalance?: number;
  status?: string;
  isActive?: boolean;
  transactions?: {
    data: WalletTransaction[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface MutuxCreditLine {
  id: string | null;
  granted: boolean;
  userId: string;
  totalLimit: number;
  displayBalance: number;
  lockedBalance: number;
  outstandingDebt: number;
  status: string;
  approvedAt: string | null;
  expiredAt: string | null;
}

export interface RepayCreditDebtResult {
  repaidAmount: number;
  renterWalletBalance: number;
  mutuxWallet: MutuxCreditLine;
}

export interface TopupRequest {
  amount: number;
  method: 'payos';
}

export interface WithdrawRequest {
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
}
