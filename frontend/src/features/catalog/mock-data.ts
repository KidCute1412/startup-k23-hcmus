import type { Gear, GearCategory } from "./types";

const categories: GearCategory[] = [
  {
    id: "keyboards",
    name: "Bàn phím chế tác",
    description: "Custom keyboard, keycap và artisan case hi-end.",
    imageUrl:
      "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "mice",
    name: "Chuột quý tộc",
    description: "Chuột gaming nhẹ, sensor flagship, bản giới hạn.",
    imageUrl:
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "audio",
    name: "Âm thanh hi-end",
    description: "Tai nghe, DAC/AMP và microphone dành cho streaming.",
    imageUrl:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "setups",
    name: "Thiết lập không gian",
    description: "PC, deskmat và phụ kiện cho setup thi đấu cao cấp.",
    imageUrl:
      "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=900&q=80",
  },
];

const gears: Gear[] = [
  {
    id: "gear-apex-pro",
    name: "Vanguard Apex Pro",
    slug: "vanguard-apex-pro",
    categoryId: "keyboards",
    categoryName: "Bàn phím chế tác",
    shortDescription: "Bàn phím cơ vỏ gỗ óc chó Thụy Sĩ, plate đồng mạ vàng.",
    description:
      "Apex Pro là bàn phím custom 75% dành cho buổi thi đấu, livestream hoặc trải nghiệm thử switch cao cấp trước khi đặt chế tác riêng.",
    badge: "Bespoke",
    condition: "Like new, đã kiểm định 12 điểm",
    rating: 5,
    reviewCount: 120,
    media: [
      {
        id: "main",
        imageUrl:
          "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=80",
        alt: "Vanguard Apex Pro keyboard",
      },
      {
        id: "keys",
        imageUrl:
          "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1200&q=80",
        alt: "Artisan keycaps",
      },
      {
        id: "desk",
        imageUrl:
          "https://images.unsplash.com/photo-1632292224971-0d45778bd364?auto=format&fit=crop&w=1200&q=80",
        alt: "Keyboard on artisan desk",
      },
      {
        id: "setup",
        imageUrl:
          "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=1200&q=80",
        alt: "Premium gaming setup",
      },
    ],
    specifications: [
      { label: "Vật liệu lõi", value: "Đồng thau nguyên khối dày 3mm mạ vàng 18K" },
      { label: "Vỏ case", value: "Swiss Walnut sấy tự nhiên 24 tháng" },
      { label: "Kết nối", value: "USB-C bọc dù, Bluetooth 5.3, hot-swap PCB" },
      { label: "Đệm tiêu âm", value: "Poron + da thuộc cao cấp, typing profile trầm" },
      { label: "Nghệ nhân", value: "Atelier Master, chứng nhận độc bản kèm chữ ký laser" },
    ],
    pricing: {
      retailPrice: 6500000,
      dailyPrice: 65000,
      depositCash: 1800000,
      creditLineRequired: 4200000,
    },
    availability: "available",
    lender: {
      name: "Atelier Nguyễn",
      tier: "Royal Verified",
      responseRate: 98,
      completedRentals: 146,
      location: "Quận 1, TP.HCM",
    },
    featured: true,
  },
  {
    id: "gear-carbon-m1-gold",
    name: "Carbon M1 Gold",
    slug: "carbon-m1-gold",
    categoryId: "mice",
    categoryName: "Chuột quý tộc",
    shortDescription: "Chuột 49g phủ carbon, nút mạ vàng 18K, sensor 8K.",
    description:
      "Mẫu chuột nhẹ cho FPS competitive, phù hợp thuê ngắn hạn trước giải hoặc trước khi mua bản giới hạn.",
    badge: "Royal Tier",
    condition: "Xuất sắc, feet mới thay",
    rating: 4.9,
    reviewCount: 84,
    media: [
      {
        id: "main",
        imageUrl:
          "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=80",
        alt: "Carbon M1 Gold mouse",
      },
      {
        id: "setup",
        imageUrl:
          "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=1200&q=80",
        alt: "Mouse in gaming setup",
      },
    ],
    specifications: [
      { label: "Trọng lượng", value: "49g không dây" },
      { label: "Sensor", value: "Flagship 30K DPI, polling 8K" },
      { label: "Vật liệu", value: "Carbon weave + shell phủ UV chống trượt" },
      { label: "Phụ kiện", value: "Dock sạc, grip tape, receiver 8K" },
    ],
    pricing: {
      retailPrice: 12990000,
      dailyPrice: 99000,
      depositCash: 3200000,
      creditLineRequired: 6500000,
    },
    availability: "available",
    lender: {
      name: "Saigon Gear Club",
      tier: "Mutux Plus",
      responseRate: 96,
      completedRentals: 211,
      location: "Bình Thạnh, TP.HCM",
    },
    featured: true,
  },
  {
    id: "gear-aether-royal-v2",
    name: "Aether Royal V2",
    slug: "aether-royal-v2",
    categoryId: "audio",
    categoryName: "Âm thanh hi-end",
    shortDescription: "Tai nghe tĩnh điện vỏ gỗ, âm trường rộng cho gaming cinematic.",
    description:
      "Bộ tai nghe dành cho stream, game nhập vai và kiểm âm. Đi kèm DAC/AMP portable và earpad đã khử khuẩn.",
    condition: "Rất tốt, pad mới vệ sinh",
    rating: 5,
    reviewCount: 63,
    media: [
      {
        id: "main",
        imageUrl:
          "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
        alt: "Aether Royal V2 headset",
      },
    ],
    specifications: [
      { label: "Driver", value: "Planar magnetic open-back" },
      { label: "AMP kèm theo", value: "Portable balanced DAC/AMP 4.4mm" },
      { label: "Phụ kiện", value: "Case cứng, dây balanced, khăn microfiber" },
      { label: "Vệ sinh", value: "Earpad khử khuẩn UV trước mỗi đơn" },
    ],
    pricing: {
      retailPrice: 18500000,
      dailyPrice: 145000,
      depositCash: 4500000,
      creditLineRequired: 9000000,
    },
    availability: "reserved",
    lender: {
      name: "Hifi Arena",
      tier: "Royal Verified",
      responseRate: 99,
      completedRentals: 88,
      location: "Quận 3, TP.HCM",
    },
    featured: true,
  },
  {
    id: "gear-imperial-keycaps",
    name: "Imperial Keycaps",
    slug: "imperial-keycaps",
    categoryId: "keyboards",
    categoryName: "Bàn phím chế tác",
    shortDescription: "Bộ keycap đồng thau và xà cừ cho layout 65% tới TKL.",
    description:
      "Bộ keycap cho người muốn thử profile và âm sắc trước khi đặt bộ riêng.",
    condition: "Like new, không bóng mặt",
    rating: 4.8,
    reviewCount: 42,
    media: [
      {
        id: "main",
        imageUrl:
          "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1200&q=80",
        alt: "Imperial keycaps",
      },
    ],
    specifications: [
      { label: "Profile", value: "Cherry sculpted" },
      { label: "Vật liệu", value: "PBT dye-sub + artisan brass accent" },
      { label: "Layout", value: "65%, 75%, TKL, full-size" },
    ],
    pricing: {
      retailPrice: 3200000,
      dailyPrice: 39000,
      depositCash: 900000,
      creditLineRequired: 1500000,
    },
    availability: "available",
    lender: {
      name: "Keycap Vault",
      tier: "Verified",
      responseRate: 94,
      completedRentals: 74,
      location: "Phú Nhuận, TP.HCM",
    },
  },
  {
    id: "gear-artisan-silk-deskmat",
    name: "Artisan Silk Deskmat",
    slug: "artisan-silk-deskmat",
    categoryId: "setups",
    categoryName: "Thiết lập không gian",
    shortDescription: "Deskmat tơ tằm dệt tay, surface speed-control cân bằng.",
    description:
      "Deskmat dành cho set chụp sản phẩm, livestream hoặc thử cảm giác lót chuột cao cấp.",
    condition: "Tốt, đã hấp vệ sinh",
    rating: 4.9,
    reviewCount: 39,
    media: [
      {
        id: "main",
        imageUrl:
          "https://images.unsplash.com/photo-1632292224971-0d45778bd364?auto=format&fit=crop&w=1200&q=80",
        alt: "Artisan Silk Deskmat",
      },
    ],
    specifications: [
      { label: "Kích thước", value: "900 x 400 x 4mm" },
      { label: "Bề mặt", value: "Tơ dệt speed-control" },
      { label: "Đế", value: "Cao su natural grip" },
    ],
    pricing: {
      retailPrice: 2500000,
      dailyPrice: 28000,
      depositCash: 600000,
      creditLineRequired: 1200000,
    },
    availability: "available",
    lender: {
      name: "Desk Studio",
      tier: "Verified",
      responseRate: 93,
      completedRentals: 57,
      location: "Quận 7, TP.HCM",
    },
  },
  {
    id: "gear-sovereign-rig",
    name: "Vanguard Sovereign Rig",
    slug: "vanguard-sovereign-rig",
    categoryId: "setups",
    categoryName: "Thiết lập không gian",
    shortDescription: "PC water-cooling vỏ đồng thau nguyên khối, RTX flagship.",
    description:
      "Bộ rig cho sự kiện trải nghiệm, booth gaming hoặc quay review. Giao bởi đội kỹ thuật Mutux.",
    badge: "Limited",
    condition: "Sự kiện, cần đặt lịch trước",
    rating: 5,
    reviewCount: 21,
    media: [
      {
        id: "main",
        imageUrl:
          "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80",
        alt: "Vanguard Sovereign Rig",
      },
    ],
    specifications: [
      { label: "GPU", value: "RTX flagship water block" },
      { label: "CPU", value: "16-core desktop class" },
      { label: "Giao nhận", value: "Kỹ thuật viên lắp đặt tại chỗ" },
      { label: "Bảo hiểm", value: "Bắt buộc dùng credit line Mutux" },
    ],
    pricing: {
      retailPrice: 150000000,
      dailyPrice: 950000,
      depositCash: 30000000,
      creditLineRequired: 80000000,
    },
    availability: "maintenance",
    lender: {
      name: "Vanguard Lab",
      tier: "Royal Verified",
      responseRate: 100,
      completedRentals: 18,
      location: "Thủ Đức, TP.HCM",
    },
    limited: "10/10",
  },
];

export function getCategories() {
  return categories;
}

export function getGears() {
  return gears;
}

export function getFeaturedGears() {
  return gears.filter((gear) => gear.featured);
}

export function getGearById(id: string) {
  return gears.find((gear) => gear.id === id || gear.slug === id);
}

export function getRelatedGears(gear: Gear) {
  return gears
    .filter((item) => item.id !== gear.id && item.categoryId === gear.categoryId)
    .slice(0, 3);
}

export function filterGears(category?: string, sort?: string) {
  const filtered =
    category && category !== "all"
      ? gears.filter((gear) => gear.categoryId === category)
      : [...gears];

  return filtered.sort((a, b) => {
    if (sort === "price-asc") return a.pricing.dailyPrice - b.pricing.dailyPrice;
    if (sort === "price-desc") return b.pricing.dailyPrice - a.pricing.dailyPrice;
    if (sort === "rating") return b.rating - a.rating;
    return Number(b.featured ?? false) - Number(a.featured ?? false);
  });
}
