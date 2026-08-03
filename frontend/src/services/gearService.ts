import type { Gear, GearCategory, GearSpecification } from "@/types/catalog";
import { apiClient, apiClientPaginated, type PaginationMeta } from "@/lib/apiClient";

export type GearCatalogSort =
  | "relevance"
  | "newest"
  | "priceAsc"
  | "priceDesc"
  | "ratingDesc";

export type GetGearsParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  sort?: GearCatalogSort;
};

type WireCategory = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
};

type WireGear = {
  id: string;
  categoryId: string | null;
  name: string;
  brand: string | null;
  model: string | null;
  description: string | null;
  specifications: Record<string, unknown> | null;
  value: number | null;
  rentPricePerDay: number;
  category: WireCategory | null;
  media: Array<{
    id: string;
    type: string;
    url: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
  rating: number;
  reviewCount: number;
  lender: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    rating: number;
    totalReviews: number;
  };
  serialNumber?: string | null;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: { id: string; fullName: string | null; avatarUrl: string | null };
  }>;
  status?: string;
  approvalStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

function readable(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(readable).join(", ");
  return JSON.stringify(value);
}

function mapSpecifications(value: Record<string, unknown> | null): GearSpecification[] {
  return value
    ? Object.entries(value).map(([label, specification]) => ({
        label,
        value: readable(specification),
      }))
    : [];
}

function mapGear(gear: WireGear): Gear {
  return {
    id: gear.id,
    name: gear.name,
    categoryId: gear.categoryId ?? "",
    categoryName: gear.category?.name ?? "",
    shortDescription:
      [gear.brand, gear.model].filter(Boolean).join(" ") || gear.description || "",
    description: gear.description ?? "",
    condition: "",
    rating: gear.rating,
    reviewCount: gear.reviewCount,
    media: [...(gear.media || [])]
      .sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder,
      )
      .map((item) => ({
        id: item.id,
        imageUrl: item.url,
        alt: `${gear.name} - ${item.type}`,
        type: item.type,
        isPrimary: item.isPrimary,
        sortOrder: item.sortOrder,
      })),
    specifications: mapSpecifications(gear.specifications),
    pricing: {
      retailPrice: gear.value,
      dailyPrice: gear.rentPricePerDay,
      depositCash: 0,
      creditLineRequired: 0,
    },
    availability: "available",
    lender: {
      id: gear.lender?.id || "",
      name: gear.lender?.fullName ?? "Chủ gear",
      avatarUrl: gear.lender?.avatarUrl,
      rating: gear.lender?.rating || 0,
      totalReviews: gear.lender?.totalReviews || 0,
      tier: "",
      responseRate: 0,
      completedRentals: 0,
      location: "",
    },
    serialNumber: gear.serialNumber,
    reviews: gear.reviews || [],
    status: gear.status,
    approvalStatus: gear.approvalStatus,
    createdAt: gear.createdAt,
    updatedAt: gear.updatedAt,
  };
}

const VALID_SORTS = new Set<string>([
  "relevance",
  "newest",
  "priceAsc",
  "priceDesc",
  "ratingDesc",
]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getGears(
  params: GetGearsParams = {},
): Promise<{ data: Gear[]; meta: PaginationMeta }> {
  const query = new URLSearchParams();

  if (params.page && params.page > 0) {
    query.set("page", String(params.page));
  }
  if (params.limit && params.limit > 0) {
    query.set("limit", String(params.limit));
  }
  if (params.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.category && params.category.trim()) {
    query.set("category", params.category.trim());
  }
  if (params.categoryId && UUID_REGEX.test(params.categoryId)) {
    query.set("categoryId", params.categoryId);
  }
  if (params.minPrice !== undefined && params.minPrice !== "" && !isNaN(Number(params.minPrice))) {
    const min = Number(params.minPrice);
    if (min >= 0) query.set("minPrice", String(min));
  }
  if (params.maxPrice !== undefined && params.maxPrice !== "" && !isNaN(Number(params.maxPrice))) {
    const max = Number(params.maxPrice);
    if (max >= 0) query.set("maxPrice", String(max));
  }
  if (params.sort && VALID_SORTS.has(params.sort)) {
    query.set("sort", params.sort);
  }

  const result = await apiClientPaginated<WireGear[]>(
    `/gears${query.size ? `?${query.toString()}` : ""}`,
    { cache: "no-store" },
  );
  return { data: result.data.map(mapGear), meta: result.meta };
}

export async function getGearById(id: string): Promise<Gear> {
  return mapGear(
    await apiClient<WireGear>(`/gears/${encodeURIComponent(id)}`, {
      cache: "no-store",
    }),
  );
}

export async function getCategories(): Promise<GearCategory[]> {
  return apiClient<WireCategory[]>("/categories", { cache: "no-store" });
}

export async function getMyGears(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
} = {}): Promise<{ data: Gear[]; meta: PaginationMeta }> {
  const query = new URLSearchParams();
  if (params.page && params.page > 0) {
    query.set("page", String(params.page));
  }
  if (params.limit && params.limit > 0) {
    query.set("limit", String(params.limit));
  }
  if (params.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  const result = await apiClientPaginated<WireGear[]>(
    `/gears/mine${query.size ? `?${query.toString()}` : ""}`,
    { cache: "no-store" }
  );
  return { data: result.data.map(mapGear), meta: result.meta };
}

export async function createGear(data: {
  categoryId?: string;
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  specifications?: Record<string, string>;
  value?: number;
  rentPricePerDay: number;
  idempotencyKey?: string;
  imageUrls?: string[];
}): Promise<Gear> {
  return mapGear(
    await apiClient<WireGear>("/gears", {
      method: "POST",
      body: JSON.stringify(data),
    })
  );
}

export async function updateGear(
  id: string,
  data: {
    categoryId?: string;
    name?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    description?: string;
    specifications?: Record<string, string>;
    value?: number;
    rentPricePerDay?: number;
    status?: "available" | "maintenance" | "delisted" | "rented";
    imageUrls?: string[];
  }
): Promise<Gear> {
  return mapGear(
    await apiClient<WireGear>(`/gears/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  );
}

export async function deleteGear(id: string): Promise<Gear> {
  return mapGear(
    await apiClient<WireGear>(`/gears/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
  );
}
