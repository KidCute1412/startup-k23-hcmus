'use client';

import { useCallback, useState } from 'react';
import { rentalOrderService } from '@/services/rentalOrderService';
import { type PaginationMeta } from '@/lib/apiClient';
import type {
  CreateRentalOrderRequest,
  GetRentalOrdersParams,
  RentalOrder,
} from '@/types/rentals';

export function useRentalOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [currentOrder, setCurrentOrder] = useState<RentalOrder | null>(null);

  const fetchOrders = useCallback(async (params?: GetRentalOrdersParams) => {
    setIsLoading(true); setError(null);
    try {
      const result = await rentalOrderService.getRentalOrders(params);
      setOrders(result.data);
      setMeta(result.meta);
      return result;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể lấy danh sách đơn thuê.';
      setError(message); throw cause;
    } finally { setIsLoading(false); }
  }, []);

  const fetchOrder = useCallback(async (id: string) => {
    setIsLoading(true); setError(null);
    try {
      const data = await rentalOrderService.getRentalOrder(id);
      setCurrentOrder(data);
      return data;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể lấy chi tiết đơn thuê.';
      setError(message); throw cause;
    } finally { setIsLoading(false); }
  }, []);

  const createOrder = useCallback(async (request: CreateRentalOrderRequest) => {
    setIsLoading(true); setError(null);
    try {
      return await rentalOrderService.createRentalOrder(request);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Tạo đơn thuê thất bại.';
      setError(message); throw cause;
    } finally { setIsLoading(false); }
  }, []);

  const updateOrderStatus = useCallback(
    async (id: string, action: keyof typeof rentalOrderService) => {
      setIsLoading(true); setError(null);
      try {
        const method = rentalOrderService[action] as (id: string) => Promise<RentalOrder>;
        const updated = await method(id);
        setCurrentOrder(updated);
        return updated;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Cập nhật trạng thái đơn thuê thất bại.';
        setError(message); throw cause;
      } finally { setIsLoading(false); }
    },
    []
  );

  return {
    orders,
    meta,
    currentOrder,
    isLoading,
    error,
    fetchOrders,
    fetchOrder,
    createOrder,
    setCurrentOrder,
    confirmOrder: (id: string) => updateOrderStatus(id, 'confirmRentalOrder'),
    shipOrder: (id: string) => updateOrderStatus(id, 'shipRentalOrder'),
    confirmReceipt: (id: string) => updateOrderStatus(id, 'confirmRentalReceipt'),
    returnOrder: (id: string) => updateOrderStatus(id, 'returnRentalOrder'),
    confirmReturn: (id: string) => updateOrderStatus(id, 'confirmRentalReturn'),
    cancelOrder: (id: string) => updateOrderStatus(id, 'cancelRentalOrder'),
  };
}
