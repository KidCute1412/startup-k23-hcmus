"use client";

import { useCallback, useEffect, useState } from "react";
import {
  accountService,
  type AddressRequest,
  type UserAddress,
} from "@/services/accountService";

export type { AddressRequest, UserAddress } from "@/services/accountService";

export function useAddresses() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setAddresses(await accountService.listAddresses());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể tải sổ địa chỉ.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mutate = useCallback(
    async (operation: () => Promise<unknown>) => {
      setIsSaving(true);
      setError(null);
      try {
        await operation();
        await load();
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Yêu cầu không thành công.";
        setError(message);
        throw cause;
      } finally {
        setIsSaving(false);
      }
    },
    [load],
  );

  return {
    addresses,
    isLoading,
    isSaving,
    error,
    reload: load,
    createAddress: (request: AddressRequest) =>
      mutate(() => accountService.createAddress(request)),
    updateAddress: (id: string, request: Partial<AddressRequest>) =>
      mutate(() => accountService.updateAddress(id, request)),
    deleteAddress: (id: string) =>
      mutate(() => accountService.deleteAddress(id)),
    setDefaultAddress: (id: string) =>
      mutate(() => accountService.setDefaultAddress(id)),
  };
}
