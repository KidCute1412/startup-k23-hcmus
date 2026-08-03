import { useCallback, useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { creditLimitService } from '@/services/creditLimitService';
import { ApiError } from '@/lib/apiClient';

export interface AdminOverviewStats {
  kycPending: number;
  gearPending: number;
  disputeOpen: number;
  creditLimitPending: number;
}

export function useAdminOverview() {
  const [statsData, setStatsData] = useState<AdminOverviewStats>({
    kycPending: 0,
    gearPending: 0,
    disputeOpen: 0,
    creditLimitPending: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNonAdmin, setIsNonAdmin] = useState<boolean>(false);

  const fetchOverviewStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsNonAdmin(false);

    try {
      const [kycRes, gearRes, disputeRes, creditRes] = await Promise.allSettled([
        adminService.getKycQueue({ status: 'pending', limit: 1 }),
        adminService.getGearQueue({ approvalStatus: 'pending', limit: 1 }),
        adminService.getDisputeQueue({ status: 'open', limit: 1 }),
        creditLimitService.getAdminRequests({ status: 'pending', limit: 1 }),
      ]);

      let isForbidden = false;

      let kycPending = 0;
      if (kycRes.status === 'fulfilled') {
        kycPending = kycRes.value.meta?.total ?? 0;
      } else if (kycRes.reason instanceof ApiError && kycRes.reason.status === 403) {
        isForbidden = true;
      }

      let gearPending = 0;
      if (gearRes.status === 'fulfilled') {
        gearPending = gearRes.value.meta?.total ?? 0;
      } else if (gearRes.reason instanceof ApiError && gearRes.reason.status === 403) {
        isForbidden = true;
      }

      let disputeOpen = 0;
      if (disputeRes.status === 'fulfilled') {
        disputeOpen = disputeRes.value.meta?.total ?? 0;
      } else if (disputeRes.reason instanceof ApiError && disputeRes.reason.status === 403) {
        isForbidden = true;
      }

      let creditLimitPending = 0;
      if (creditRes.status === 'fulfilled') {
        creditLimitPending = creditRes.value.meta?.total ?? 0;
      } else if (creditRes.reason instanceof ApiError && creditRes.reason.status === 403) {
        isForbidden = true;
      }

      if (isForbidden) {
        setIsNonAdmin(true);
        setError('Truy cập bị từ chối: Tài khoản của bạn không có quyền Quản trị viên (ADMIN_ONLY).');
      } else {
        setStatsData({
          kycPending,
          gearPending,
          disputeOpen,
          creditLimitPending,
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Không thể kết nối đến backend admin.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverviewStats();
  }, [fetchOverviewStats]);

  return {
    statsData,
    loading,
    error,
    isNonAdmin,
    refetch: fetchOverviewStats,
  };
}
