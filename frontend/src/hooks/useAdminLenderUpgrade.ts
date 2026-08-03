import { useCallback, useEffect, useState } from 'react';
import { adminService, type LenderUpgradeQueueItem } from '@/services/adminService';
import { ApiError, PaginationMeta } from '@/lib/apiClient';
import { useToast } from '@/components/ui/toast';

export type LenderUpgradeRequestStatus = 'pending' | 'approved' | 'rejected';

export function useAdminLenderUpgrade(initialStatus: LenderUpgradeRequestStatus = 'pending', initialPage = 1, limit = 10) {
  const toast = useToast();
  const [requests, setRequests] = useState<LenderUpgradeQueueItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [statusFilter, setStatusFilter] = useState<LenderUpgradeRequestStatus>(initialStatus);
  const [page, setPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNonAdmin, setIsNonAdmin] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUpgradeRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsNonAdmin(false);

    try {
      const res = await adminService.listLenderUpgradeRequests({
        status: statusFilter,
        page,
        limit,
      });
      setRequests(res.data);
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
        setError('Không thể tải danh sách hàng chờ nâng cấp.');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, limit]);

  useEffect(() => {
    void fetchUpgradeRequests();
  }, [fetchUpgradeRequests]);

  const approveRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      await adminService.approveLenderUpgradeRequest(requestId);
      toast.success('Đã duyệt yêu cầu nâng cấp thành công!');
      await fetchUpgradeRequests();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Lỗi phê duyệt: ${err.message}`);
      }
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectRequest = async (requestId: string, reviewNote: string) => {
    setActionLoadingId(requestId);
    try {
      await adminService.rejectLenderUpgradeRequest(requestId, reviewNote);
      toast.success('Đã từ chối yêu cầu nâng cấp.');
      await fetchUpgradeRequests();
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
    requests,
    meta,
    statusFilter,
    setStatusFilter: (s: LenderUpgradeRequestStatus) => {
      setStatusFilter(s);
      setPage(1);
    },
    page,
    setPage,
    loading,
    error,
    isNonAdmin,
    actionLoadingId,
    refetch: fetchUpgradeRequests,
    approveRequest,
    rejectRequest,
  };
}
