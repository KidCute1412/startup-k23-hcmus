import type { RentalOrder } from "./rentals";

export type CartAvailabilityCode =
  | "available"
  | "gear_unavailable"
  | "period_conflict";

export interface CartItem {
  id: string;
  gearId: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  rentPricePerDay: number;
  rentalFee: number;
  depositAmount: number;
  availability: { eligible: boolean; code: CartAvailabilityCode };
  gear: {
    id: string;
    name: string;
    status: string;
    approvalStatus: string;
    primaryMediaUrl: string | null;
    lender: { id: string; fullName: string | null };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  updatedAt: string;
}

export interface BatchCheckoutRequest {
  cartItemIds: string[];
  depositType: "traditional" | "credit_line";
  addressId: string;
}

export interface BatchCheckoutResponse {
  orders: RentalOrder[];
  removedCartItemIds: string[];
}
