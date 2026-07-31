export interface RentalOrder {
  id: string;
  gearId: string;
  renterId: string;
  lenderId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'active' | 'returning' | 'completed' | 'cancelled' | 'disputed';
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
  start_date?: string;
  end_date?: string;
  rental_fee?: number;
  deposit_amount?: number;
  deposit_type?: 'traditional' | 'credit_line';
  shipping_address?: string;
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

export interface RentalProof {
  id: string;
  rentalOrderId: string;
  uploaderId: string;
  stage: 'pre_shipment' | 'post_receipt' | 'pre_return' | 'post_return' | string;
  proofType: 'image' | 'video';
  fileUrl: string;
  note?: string | null;
  createdAt: string;
}

export interface UploadProofRequest {
  stage: string;
  fileUrl: string;
  note?: string;
}
