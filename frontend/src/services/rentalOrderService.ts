import { apiClient, apiClientPaginated, type PaginationMeta } from '@/lib/apiClient';

export interface RentalOrder {
  id: string;
  gearId: string;
  renterId: string;
  lenderId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'active' | 'returning' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  rentPrice: number;
  depositCash: number;
  depositType: 'traditional' | 'credit_line';
  shippingAddress: string;
  shippingName: string;
  shippingPhone: string;
  createdAt: string;
  updatedAt: string;
  // Backend snake_case properties
  start_date?: string;
  end_date?: string;
  rental_fee?: number;
  deposit_amount?: number;
  deposit_type?: 'traditional' | 'credit_line';
  shipping_address?: string;

  // Nested relation placeholders
  gear?: { name: string; media?: { url: string }[] };
  renter?: { fullName?: string; avatarUrl?: string; full_name?: string; avatar_url?: string };
  lender?: { fullName?: string; avatarUrl?: string; full_name?: string; avatar_url?: string };
}

export interface CreateRentalOrderRequest {
  gearId: string;
  startDate: string;
  endDate: string;
  depositType: 'traditional' | 'credit_line';
  shippingAddress: string;
  shippingName: string;
  shippingPhone: string;
}

export interface GetRentalOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const rentalOrderService = {
  getRentalOrders: async (params: GetRentalOrdersParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);

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

  confirmRentalReceipt: (id: string) =>
    apiClient<RentalOrder>(`/rental-orders/${encodeURIComponent(id)}/confirm-receipt`, { method: 'PATCH' }),

  returnRentalOrder: (id: string) =>
    apiClient<RentalOrder>(`/rental-orders/${encodeURIComponent(id)}/return`, { method: 'PATCH' }),

  confirmRentalReturn: (id: string) =>
    apiClient<RentalOrder>(`/rental-orders/${encodeURIComponent(id)}/confirm-return`, { method: 'PATCH' }),

  cancelRentalOrder: (id: string) =>
    apiClient<RentalOrder>(`/rental-orders/${encodeURIComponent(id)}/cancel`, { method: 'PATCH' }),
};
