"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/apiClient";
import { creditLimitService } from "@/services/creditLimitService";
import type { MyCreditLimitRequests } from "@/types/credit-limit";

const errorMessages: Record<string, string> = {
  ACTIVE_REQUEST_EXISTS: "Bạn đã có một yêu cầu đang được xử lý.",
  KYC_OR_CONSENT_REQUIRED: "Bạn cần hoàn tất KYC và đồng ý điều khoản tín dụng.",
  COMPLETED_ORDERS_REQUIRED: "Bạn chưa đủ số đơn thuê hoàn tất cho hạn mức này.",
  OUTSTANDING_DEBT: "Hãy thanh toán dư nợ trước khi nâng hạn mức.",
  OPEN_DISPUTE: "Bạn đang có tranh chấp chưa xử lý.",
  ADVERSE_DISPUTE: "Tài khoản có tranh chấp bị khấu trừ tiền cọc.",
  INVALID_CREDIT_TIER: "Hạn mức yêu cầu không hợp lệ.",
};

export function useCreditLimit() {
  const [requests, setRequests] = useState<MyCreditLimitRequests>({
    active: null,
    history: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(action: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await action();
    } catch (cause) {
      const message =
        cause instanceof ApiError && cause.code
          ? errorMessages[cause.code] ?? cause.message
          : cause instanceof Error
            ? cause.message
            : "Không thể xử lý yêu cầu hạn mức.";
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(
    () =>
      run(async () => {
        const result = await creditLimitService.getMine();
        setRequests(result);
        return result;
      }),
    [run],
  );
  const create = useCallback(
    (requestedLimit: number) =>
      run(async () => {
        await creditLimitService.create(requestedLimit);
        return refetch();
      }),
    [refetch, run],
  );
  const cancel = useCallback(
    (id: string) =>
      run(async () => {
        await creditLimitService.cancel(id);
        return refetch();
      }),
    [refetch, run],
  );

  return { requests, loading, error, refetch, create, cancel };
}
