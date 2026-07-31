import { useCallback, useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { ApiError, PaginationMeta } from '@/lib/apiClient';
import type { ResolveDisputePayload } from '@/types/admin';
import type { DisputeItem, DisputeStatus } from '@/types/dispute';

export function useAdminDisputes(
  initialStatus?: DisputeStatus,
  initialPage = 1,
  limit = 10,
) {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNonAdmin, setIsNonAdmin] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | undefined>(initialStatus);
  const [page, setPage] = useState<number>(initialPage);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsNonAdmin(false);

    try {
      const res = await adminService.getDisputeQueue({
        status: statusFilter,
        page,
        limit,
      });
      setDisputes(res.data || []);
      setMeta(res.meta || null);
    } catch (err: any) {
      if (err instanceof ApiError && (err.status === 403 || err.code === 'ADMIN_ONLY')) {
        setIsNonAdmin(true);
        setError('Truy cập bị từ chối: Tài khoản của bạn không có quyền Quản trị viên (ADMIN_ONLY).');
      } else {
        setError(err.message || 'Không thể tải danh sách tranh chấp.');
      }
      setDisputes([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, limit]);

  useEffect(() => {
    void fetchDisputes();
  }, [fetchDisputes]);

  const resolveDispute = async (id: string, payload: ResolveDisputePayload) => {
    try {
      await adminService.resolveDispute(id, payload);
      await fetchDisputes();
    } catch (err: any) {
      const msg = err.message || 'Phân xử tranh chấp thất bại.';
      setError(msg);
      throw err;
    }
  };

  return {
    disputes,
    meta,
    loading,
    error,
    isNonAdmin,
    statusFilter,
    setStatusFilter: (s?: DisputeStatus) => {
      setStatusFilter(s);
      setPage(1);
    },
    page,
    setPage,
    refetch: fetchDisputes,
    resolveDispute,
  };
}
