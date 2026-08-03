"use client";

import { useCallback, useEffect, useState } from "react";
import {
  accountService,
  type LenderUpgradeRequest,
} from "@/services/accountService";

export function useLenderUpgrade() {
  const [request, setRequest] = useState<LenderUpgradeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void accountService
      .getLenderUpgradeStatus()
      .then((value) => {
        if (active) setRequest(value);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const requestUpgrade = useCallback(async (reason?: string) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const updated = await accountService.requestLenderUpgrade(reason);
      setRequest(updated);
      setMessage("Đã gửi yêu cầu nâng cấp thành công.");
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Không thể gửi yêu cầu nâng cấp lúc này.",
      );
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { request, loading, submitting, message, requestUpgrade };
}
