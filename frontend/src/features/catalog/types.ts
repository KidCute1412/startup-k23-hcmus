export type AvailabilityStatus = "available" | "reserved" | "maintenance";

export type GearCategory = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
};

export type GearMedia = {
  id: string;
  imageUrl: string;
  alt: string;
};

export type GearSpecification = {
  label: string;
  value: string;
};

export type RentalPricing = {
  retailPrice: number;
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
};

export type Gear = {
  id: string;
  name: string;
  slug: string;
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
};
