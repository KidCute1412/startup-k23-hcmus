import { apiClient } from '@/lib/apiClient';
import type {
  LenderWallet,
  MutuxCreditLine,
  RenterWallet,
  TopupCheckout,
  TopupCompletion,
  TopupRequest,
  WithdrawRequest,
  RepayCreditDebtResult,
} from '@/types/wallet';

export const walletService = {
  getRenterWallet: () => apiClient<RenterWallet>('/wallets/renter'),
  getLenderWallet: () => apiClient<LenderWallet>('/wallets/lender'),
  getMutuxCreditLine: () => apiClient<MutuxCreditLine>('/wallets/mutux'),
  repayMutuxDebt: () =>
    apiClient<RepayCreditDebtResult>('/wallets/mutux/debt/repay', {
      method: 'POST',
    }),
  
  createTopupCheckout: (request: TopupRequest) =>
    apiClient<TopupCheckout>('/wallets/topups/checkout', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  simulateTopupSuccess: (topupId: string) =>
    apiClient<TopupCompletion>(`/wallets/topups/${encodeURIComponent(topupId)}/simulate-success`, {
      method: 'POST',
    }),

  withdraw: (request: WithdrawRequest) =>
    apiClient<{ id: string; status: string }>('/wallets/lender/withdraw', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};
