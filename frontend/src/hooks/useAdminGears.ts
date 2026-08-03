import { useCallback, useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { ApiError, PaginationMeta } from '@/lib/apiClient';
import { useToast } from '@/components/ui/toast';
import type { AdminGearItem, ApprovalStatus } from '@/types/admin';

export function useAdminGears(initialStatus: ApprovalStatus = 'pending', initialPage = 1, limit = 10) {
  const toast = useToast();
  const [gears, setGears] = useState<AdminGearItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus>(initialStatus);
  const [page, setPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNonAdmin, setIsNonAdmin] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchGearQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsNonAdmin(false);

    try {
      const res = await adminService.getGearQueue({
        approvalStatus: statusFilter,
        page,
        limit,
      });
      setGears(res.data);
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
        setError('Không thể tải danh sách kiểm định thiết bị.');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, limit]);

  useEffect(() => {
    void fetchGearQueue();
  }, [fetchGearQueue]);

  const approveGear = async (gearId: string) => {
    setActionLoadingId(gearId);
    try {
      await adminService.approveGear(gearId);
      toast.success('Đã phê duyệt thiết bị cho thuê thành công.');
      await fetchGearQueue();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Lỗi phê duyệt thiết bị: ${err.message}`);
      }
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectGear = async (gearId: string, reason?: string) => {
    setActionLoadingId(gearId);
    try {
      await adminService.rejectGear(gearId, { reason });
      toast.success('Đã từ chối thiết bị đăng tải.');
      await fetchGearQueue();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Lỗi từ chối thiết bị: ${err.message}`);
      }
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  };

  return {
    gears,
    meta,
    statusFilter,
    setStatusFilter: (s: ApprovalStatus) => {
      setStatusFilter(s);
      setPage(1);
    },
    page,
    setPage,
    loading,
    error,
    isNonAdmin,
    actionLoadingId,
    refetch: fetchGearQueue,
    approveGear,
    rejectGear,
  };
}
