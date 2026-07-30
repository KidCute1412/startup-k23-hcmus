import { apiClient } from '@/lib/apiClient';

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  referenceId?: string | null;
  createdAt: string;
}

export interface RenterWallet {
  id: string;
  userId: string;
  balance: number;
  frozenBalance: number;
  isActive: boolean;
}

export interface LenderWallet {
  id: string;
  userId: string;
  balance: number;
  frozenBalance: number;
  isActive: boolean;
}

export interface MutuxCreditLine {
  id: string;
  userId: string;
  creditLimit: number;
  usedAmount: number;
  status: string;
}

export interface TopupRequest {
  amount: number;
}

export interface WithdrawRequest {
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
}

export const walletService = {
  getRenterWallet: () => apiClient<RenterWallet>('/wallets/renter'),
  getLenderWallet: () => apiClient<LenderWallet>('/wallets/lender'),
  getMutuxCreditLine: () => apiClient<MutuxCreditLine>('/wallets/mutux'),
  
  createTopupCheckout: (request: TopupRequest) =>
    apiClient<any>('/wallets/topups/checkout', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  simulateTopupSuccess: (topupId: string) =>
    apiClient<null>(`/wallets/topups/${encodeURIComponent(topupId)}/simulate-success`, {
      method: 'POST',
    }),

  withdraw: (request: WithdrawRequest) =>
    apiClient<{ id: string; status: string }>('/wallets/lender/withdraw', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};
