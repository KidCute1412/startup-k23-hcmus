"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { GearCategory } from "@/types/catalog";

type ActiveFiltersProps = {
  categories: GearCategory[];
  search?: string;
  category?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  resultCount: number;
};

const SORT_LABELS: Record<string, string> = {
  relevance: "Liên quan nhất",
  newest: "Mới nhất",
  priceAsc: "Giá thuê: Thấp → Cao",
  priceDesc: "Giá thuê: Cao → Thấp",
  ratingDesc: "Đánh giá cao nhất",
};

export function ActiveFilters({
  categories,
  search,
  category,
  categoryId,
  minPrice,
  maxPrice,
  sort,
  resultCount,
}: ActiveFiltersProps) {
  const router = useRouter();

  const activeCategoryKey = category || categoryId;

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => {
      map.set(cat.id, cat.name);
      if (cat.slug) map.set(cat.slug, cat.name);
    });
    return map;
  }, [categories]);

  const activeCategoryName = useMemo(() => {
    if (!activeCategoryKey) return null;
    const matched = categories.find(
      (c) => c.slug === activeCategoryKey || c.id === activeCategoryKey
    );
    if (matched) return matched.name;
    return categoryMap.get(activeCategoryKey) || activeCategoryKey;
  }, [categories, categoryMap, activeCategoryKey]);

  const removeFilter = (keysToRemove: string | string[]) => {
    const removed = new Set(
      Array.isArray(keysToRemove) ? keysToRemove : [keysToRemove],
    );
    const query = new URLSearchParams();
    if (search && !removed.has("search")) query.set("search", search);
    if (category && !removed.has("category") && !removed.has("categoryId"))
      query.set("category", category);
    if (categoryId && !removed.has("categoryId") && !removed.has("category"))
      query.set("categoryId", categoryId);
    if (minPrice && !removed.has("minPrice"))
      query.set("minPrice", minPrice);
    if (maxPrice && !removed.has("maxPrice"))
      query.set("maxPrice", maxPrice);
    if (sort && !removed.has("sort")) query.set("sort", sort);

    router.push(query.size ? `/gears?${query.toString()}` : "/gears");
  };

  const clearAll = () => {
    router.push("/gears");
  };

  const hasActiveFilters = Boolean(
    search || category || categoryId || minPrice || maxPrice || (sort && sort !== "default")
  );

  const formatPrice = (val: string) => {
    const num = Number(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  return (
    <div className="royal-glow flex flex-wrap items-center justify-between gap-3 rounded-v-sm border border-vanguard-light-border bg-white px-4 py-3 text-xs dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf transition-all duration-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display font-semibold uppercase tracking-widest text-vanguard-light-text dark:text-vanguard-dark-text">
          Tìm thấy <span className="text-vanguard-primary font-bold">{resultCount}</span> gear
        </span>

        {hasActiveFilters ? (
          <>
            <span className="h-3.5 w-px bg-vanguard-light-border dark:bg-vanguard-dark-border" />
            
            {search ? (
              <span className="inline-flex items-center gap-1.5 rounded-v-sm border border-vanguard-primary/30 bg-vanguard-primary/5 px-2.5 py-1 text-[11px] font-semibold text-vanguard-primary">
                Từ khóa: &quot;{search}&quot;
                <button
                  type="button"
                  onClick={() => removeFilter("search")}
                  className="rounded-full p-0.5 hover:bg-vanguard-primary/20 transition"
                  aria-label="Xóa bộ lọc tìm kiếm"
                >
                  <X size={12} />
                </button>
              </span>
            ) : null}

            {activeCategoryName ? (
              <span className="inline-flex items-center gap-1.5 rounded-v-sm border border-vanguard-primary/30 bg-vanguard-primary/5 px-2.5 py-1 text-[11px] font-semibold text-vanguard-primary">
                Danh mục: {activeCategoryName}
                <button
                  type="button"
                  onClick={() => removeFilter(["category", "categoryId"])}
                  className="rounded-full p-0.5 hover:bg-vanguard-primary/20 transition"
                  aria-label="Xóa bộ lọc danh mục"
                >
                  <X size={12} />
                </button>
              </span>
            ) : null}

            {minPrice || maxPrice ? (
              <span className="inline-flex items-center gap-1.5 rounded-v-sm border border-vanguard-primary/30 bg-vanguard-primary/5 px-2.5 py-1 text-[11px] font-semibold text-vanguard-primary">
                Giá: {minPrice ? `${formatPrice(minPrice)}đ` : "0đ"} - {maxPrice ? `${formatPrice(maxPrice)}đ` : "∞"}
                <button
                  type="button"
                  onClick={() => removeFilter(["minPrice", "maxPrice"])}
                  className="rounded-full p-0.5 hover:bg-vanguard-primary/20 transition"
                  aria-label="Xóa bộ lọc giá"
                >
                  <X size={12} />
                </button>
              </span>
            ) : null}

            {sort && sort !== "default" && SORT_LABELS[sort] ? (
              <span className="inline-flex items-center gap-1.5 rounded-v-sm border border-vanguard-primary/30 bg-vanguard-primary/5 px-2.5 py-1 text-[11px] font-semibold text-vanguard-primary">
                Sắp xếp: {SORT_LABELS[sort]}
                <button
                  type="button"
                  onClick={() => removeFilter("sort")}
                  className="rounded-full p-0.5 hover:bg-vanguard-primary/20 transition"
                  aria-label="Xóa sắp xếp"
                >
                  <X size={12} />
                </button>
              </span>
            ) : null}
          </>
        ) : null}
      </div>

      {hasActiveFilters ? (
        <button
          type="button"
          onClick={clearAll}
          className="text-[11px] font-bold uppercase tracking-wider text-vanguard-light-textMuted transition hover:text-vanguard-primary dark:text-vanguard-dark-textMuted"
        >
          Xóa tất cả
        </button>
      ) : null}
    </div>
  );
}
