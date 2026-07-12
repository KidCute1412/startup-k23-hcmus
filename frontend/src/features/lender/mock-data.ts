import type { LenderGear } from "./types";

export const myGears: LenderGear[] = [
  {
    id: "lg-apex-pro",
    name: "Vanguard Apex Pro",
    slug: "vanguard-apex-pro",
    categoryId: "keyboards",
    categoryName: "Bàn phím chế tác",
    shortDescription: "Bàn phím cơ vỏ gỗ óc chó Thụy Sĩ, plate đồng mạ vàng.",
    imageUrl:
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80",
    badge: "Bespoke",
    condition: "Like new, đã kiểm định 12 điểm",
    availability: "available",
    listingStatus: "active",
    dailyPrice: 65000,
    depositCash: 1800000,
    creditLineRequired: 4200000,
    totalRentals: 24,
    totalRevenue: 4680000,
    rating: 5.0,
    reviewCount: 18,
    createdAt: "2026-03-15",
    updatedAt: "2026-07-01",
  },
  {
    id: "lg-carbon-m1",
    name: "Carbon M1 Gold",
    slug: "carbon-m1-gold",
    categoryId: "mice",
    categoryName: "Chuột quý tộc",
    shortDescription: "Chuột 49g phủ carbon, nút mạ vàng 18K, sensor 8K.",
    imageUrl:
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
    badge: "Royal Tier",
    condition: "Xuất sắc, feet mới thay",
    availability: "reserved",
    listingStatus: "active",
    dailyPrice: 99000,
    depositCash: 3200000,
    creditLineRequired: 6500000,
    totalRentals: 11,
    totalRevenue: 3267000,
    rating: 4.9,
    reviewCount: 9,
    createdAt: "2026-04-02",
    updatedAt: "2026-07-08",
  },
  {
    id: "lg-aether-v2",
    name: "Aether Royal V2",
    slug: "aether-royal-v2",
    categoryId: "audio",
    categoryName: "Âm thanh hi-end",
    shortDescription: "Tai nghe tĩnh điện vỏ gỗ, âm trường rộng.",
    imageUrl:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    condition: "Rất tốt, pad mới vệ sinh",
    availability: "available",
    listingStatus: "paused",
    dailyPrice: 145000,
    depositCash: 4500000,
    creditLineRequired: 9000000,
    totalRentals: 5,
    totalRevenue: 2175000,
    rating: 5.0,
    reviewCount: 4,
    createdAt: "2026-05-20",
    updatedAt: "2026-06-30",
  },
  {
    id: "lg-imperial-keycaps",
    name: "Imperial Keycaps",
    slug: "imperial-keycaps",
    categoryId: "keyboards",
    categoryName: "Bàn phím chế tác",
    shortDescription: "Bộ keycap đồng thau và xà cừ cho layout 65% tới TKL.",
    imageUrl:
      "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80",
    condition: "Like new, không bóng mặt",
    availability: "available",
    listingStatus: "pending_approval",
    dailyPrice: 39000,
    depositCash: 900000,
    creditLineRequired: 1500000,
    totalRentals: 0,
    totalRevenue: 0,
    rating: 0,
    reviewCount: 0,
    createdAt: "2026-07-10",
    updatedAt: "2026-07-10",
  },
  {
    id: "lg-silk-deskmat",
    name: "Artisan Silk Deskmat",
    slug: "artisan-silk-deskmat",
    categoryId: "setups",
    categoryName: "Thiết lập không gian",
    shortDescription: "Deskmat tơ tằm dệt tay, surface speed-control cân bằng.",
    imageUrl:
      "https://images.unsplash.com/photo-1632292224971-0d45778bd364?auto=format&fit=crop&w=800&q=80",
    condition: "Tốt, đã hấp vệ sinh",
    availability: "available",
    listingStatus: "draft",
    dailyPrice: 28000,
    depositCash: 600000,
    creditLineRequired: 1200000,
    totalRentals: 0,
    totalRevenue: 0,
    rating: 0,
    reviewCount: 0,
    createdAt: "2026-07-11",
    updatedAt: "2026-07-11",
  },
];

export function getMyGears() {
  return myGears;
}

export function getMyGearById(id: string) {
  return myGears.find((g) => g.id === id || g.slug === id);
}

export function getLenderStats() {
  const active = myGears.filter((g) => g.listingStatus === "active").length;
  const totalRevenue = myGears.reduce((sum, g) => sum + g.totalRevenue, 0);
  const totalRentals = myGears.reduce((sum, g) => sum + g.totalRentals, 0);
  const avgRating =
    myGears.filter((g) => g.reviewCount > 0).reduce((sum, g) => sum + g.rating, 0) /
    (myGears.filter((g) => g.reviewCount > 0).length || 1);

  return { active, totalRevenue, totalRentals, avgRating };
}
