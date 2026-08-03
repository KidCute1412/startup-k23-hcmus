import type { AvailabilityStatus, GearCategory } from "@/types/catalog";

export type ListingStatus =
  | "draft"
  | "pending_approval"
  | "active"
  | "paused"
  | "rejected";

export type LenderGear = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  shortDescription: string;
  imageUrl: string;
  badge?: string;
  condition: string;
  availability: AvailabilityStatus;
  listingStatus: ListingStatus;
  /** Raw backend approval_status — needed to re-derive listingStatus after relist */
  approvalStatus: "pending" | "approved" | "rejected";
  dailyPrice: number;
  depositCash: number;
  creditLineRequired: number;
  totalRentals: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AddGearFormValues = {
  name: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  condition: string;
  badge?: string;
  dailyPrice: number;
  depositCash: number;
  creditLineRequired: number;
  imageUrl: string;
  specifications: { label: string; value: string }[];
};

export type { GearCategory };
