import { apiClient, apiClientPaginated, type PaginationMeta } from '@/lib/apiClient';
import type {
  CreateRentalOrderRequest,
  GetRentalOrdersParams,
  RentalOrder,
  UploadProofBatchRequest,
} from '@/types/rentals';

export const rentalOrderService = {
  getRentalOrders: async (params: GetRentalOrdersParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.role) query.set('role', params.role);

    return apiClientPaginated<RentalOrder[]>(
      `/rental-orders${query.size ? `?${query.toString()}` : ''}`
    );
  },

  getRentalOrder: (id: string) =>
    apiClient<RentalOrder>(`/rental-orders/${encodeURIComponent(id)}`),

  createRentalOrder: (request: CreateRentalOrderRequest) =>
    apiClient<RentalOrder>('/rental-orders', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  confirmRentalOrder: (id: string) =>
    apiClient<RentalOrder>(`/rental-orders/${encodeURIComponent(id)}/confirm`, { method: 'PATCH' }),

  shipRentalOrder: (id: string) =>
    apiClient<RentalOrder>(`/rental-orders/${encodeURIComponent(id)}/ship`, { method: 'PATCH' }),

  confirmRentalReceipt: (id: string, request: Omit<UploadProofBatchRequest, 'stage'>) =>
    apiClient<RentalOrder>(`/rental-orders/${encodeURIComponent(id)}/confirm-receipt`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  returnRentalOrder: (id: string, request: Omit<UploadProofBatchRequest, 'stage'>) =>
    apiClient<RentalOrder>(`/rental-orders/${encodeURIComponent(id)}/return`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  confirmRentalReturn: (id: string) =>
    apiClient<RentalOrder>(`/rental-orders/${encodeURIComponent(id)}/confirm-return`, { method: 'PATCH' }),

  cancelRentalOrder: (id: string) =>
    apiClient<RentalOrder>(`/rental-orders/${encodeURIComponent(id)}/cancel`, { method: 'PATCH' }),
};
