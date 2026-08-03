export type AvailabilityStatus = "available" | "reserved" | "maintenance";

export type GearCategory = {
  id: string;
  parentId?: string | null;
  name: string;
  slug?: string;
  description: string | null;
  imageUrl?: string;
};

export type GearMedia = {
  id: string;
  imageUrl: string;
  alt: string;
  type?: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

export type GearSpecification = { label: string; value: string };

export type RentalPricing = {
  retailPrice: number | null;
  dailyPrice: number;
  depositCash: number;
  creditLineRequired: number;
};

export type LenderTrust = {
  name: string;
  tier: string;
  responseRate: number;
  completedRentals: number;
  location: string;
  id?: string;
  avatarUrl?: string | null;
  rating?: number;
  totalReviews?: number;
};

export type GearReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; fullName: string | null; avatarUrl: string | null };
};

export type Gear = {
  id: string;
  name: string;
  slug?: string;
  categoryId: string;
  categoryName: string;
  shortDescription: string;
  description: string;
  badge?: string;
  condition: string;
  rating: number;
  reviewCount: number;
  media: GearMedia[];
  specifications: GearSpecification[];
  pricing: RentalPricing;
  availability: AvailabilityStatus;
  lender: LenderTrust;
  featured?: boolean;
  limited?: string;
  serialNumber?: string | null;
  reviews?: GearReview[];
  status?: string;
  approvalStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};
