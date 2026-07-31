'use client';

import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/apiClient';
import { walletService } from '@/services/walletService';
import type {
  LenderWallet,
  MutuxCreditLine,
  RenterWallet,
  TopupRequest,
  WithdrawRequest,
} from '@/types/wallet';

export function useWallet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [renterWallet, setRenterWallet] = useState<RenterWallet | null>(null);
  const [lenderWallet, setLenderWallet] = useState<LenderWallet | null>(null);
  const [creditLine, setCreditLine] = useState<MutuxCreditLine | null>(null);

  const fetchRenterWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await walletService.getRenterWallet();
      setRenterWallet(data);
      return data;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể lấy thông tin ví người thuê.';
      setError(message);
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLenderWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await walletService.getLenderWallet();
      setLenderWallet(data);
      return data;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể lấy thông tin ví người cho thuê.';
      setError(message);
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCreditLine = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await walletService.getMutuxCreditLine();
      setCreditLine(data);
      return data;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) {
        setCreditLine(null);
        return null;
      }
      const message = cause instanceof Error ? cause.message : 'Không thể lấy thông tin hạn mức tín dụng.';
      setError(message);
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTopupCheckout = useCallback(async (request: TopupRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      return await walletService.createTopupCheckout(request);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Tạo yêu cầu nạp tiền thất bại.';
      setError(message);
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const withdraw = useCallback(async (request: WithdrawRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      return await walletService.withdraw(request);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Yêu cầu rút tiền thất bại.';
      setError(message);
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const simulateTopupSuccess = useCallback(async (topupId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await walletService.simulateTopupSuccess(topupId);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Mô phỏng nạp tiền thành công thất bại.';
      setError(message);
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    renterWallet,
    lenderWallet,
    creditLine,
    isLoading,
    error,
    fetchRenterWallet,
    fetchLenderWallet,
    fetchCreditLine,
    createTopupCheckout,
    withdraw,
    simulateTopupSuccess,
  };
}
