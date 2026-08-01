import { useCallback, useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { ApiError, PaginationMeta } from '@/lib/apiClient';
import { useToast } from '@/components/ui/toast';
import type { AdminKycUser, KycStatus } from '@/types/admin';

export function useAdminKyc(initialStatus: KycStatus = 'pending', initialPage = 1, limit = 10) {
  const toast = useToast();
  const [kycUsers, setKycUsers] = useState<AdminKycUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [statusFilter, setStatusFilter] = useState<KycStatus>(initialStatus);
  const [page, setPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNonAdmin, setIsNonAdmin] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchKycQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsNonAdmin(false);

    try {
      const res = await adminService.getKycQueue({
        status: statusFilter,
        page,
        limit,
      });
      setKycUsers(res.data);
      setMeta(res.meta);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403 || err.code === 'ADMIN_ONLY') {
          setIsNonAdmin(true);
          setError('Truy cập bị từ chối: Tài khoản của bạn không có quyền Quản trị viên (ADMIN_ONLY).');
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Không thể tải danh sách KYC queue.');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, limit]);

  useEffect(() => {
    void fetchKycQueue();
  }, [fetchKycQueue]);

  const approveKyc = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      await adminService.approveKyc(userId);
      await fetchKycQueue();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Lỗi phê duyệt: ${err.message}`);
      }
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectKyc = async (userId: string, reason?: string) => {
    setActionLoadingId(userId);
    try {
      await adminService.rejectKyc(userId, { reason });
      await fetchKycQueue();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Lỗi từ chối: ${err.message}`);
      }
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  };

  return {
    kycUsers,
    meta,
    statusFilter,
    setStatusFilter: (s: KycStatus) => {
      setStatusFilter(s);
      setPage(1);
    },
    page,
    setPage,
    loading,
    error,
    isNonAdmin,
    actionLoadingId,
    refetch: fetchKycQueue,
    approveKyc,
    rejectKyc,
  };
}
