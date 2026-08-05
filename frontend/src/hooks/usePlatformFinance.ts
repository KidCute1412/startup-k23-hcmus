"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient, apiClientPaginated } from "@/lib/apiClient";

export type PlatformFinanceOverview = { rentalHoldBalance: number; platformRevenueBalance: number; lenderPayableBalance: number; heldRentalOrders: number; lockedDepositBalance: number };

export function usePlatformFinance() {
  const [overview, setOverview] = useState<PlatformFinanceOverview | null>(null);
  const [rateBps, setRateBps] = useState(3000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [config, data] = await Promise.all([
        apiClient<{ platformFeeRateBps: number }>("/admin/platform-finance/config"),
        apiClient<PlatformFinanceOverview>("/admin/platform-finance/overview"),
      ]);
      setRateBps(config.platformFeeRateBps); setOverview(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải dữ liệu tài chính"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const updateRate = useCallback(async (nextRateBps: number) => {
    await apiClient("/admin/platform-finance/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platformFeeRateBps: nextRateBps }) });
    await refresh();
  }, [refresh]);

  const fetchRentalSettlements = useCallback(async (page: number, limit: number, status?: string) => {
    let path = `/admin/platform-finance/rental-settlements?page=${page}&limit=${limit}`;
    if (status && status !== 'all') path += `&status=${status}`;
    return apiClientPaginated<any[]>(path);
  }, []);

  const fetchRevenueTransactions = useCallback(async (page: number, limit: number) => {
    const path = `/admin/platform-finance/revenue-transactions?page=${page}&limit=${limit}`;
    return apiClientPaginated<any[]>(path);
  }, []);

  const fetchLenderPayableTransactions = useCallback(async (page: number, limit: number, type?: string) => {
    let path = `/admin/platform-finance/lender-payable-transactions?page=${page}&limit=${limit}`;
    if (type && type !== 'all') path += `&type=${type}`;
    return apiClientPaginated<any[]>(path);
  }, []);

  const fetchEscrowHistory = useCallback(async (page: number, limit: number, status?: string) => {
    let path = `/admin/platform-finance/escrow-history?page=${page}&limit=${limit}`;
    if (status && status !== 'all') path += `&status=${status}`;
    return apiClientPaginated<any[]>(path);
  }, []);

  return {
    overview,
    rateBps,
    loading,
    error,
    refresh,
    updateRate,
    fetchRentalSettlements,
    fetchRevenueTransactions,
    fetchLenderPayableTransactions,
    fetchEscrowHistory,
  };
}

