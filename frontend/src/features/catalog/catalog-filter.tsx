"use client";

import { ArrowUpDown, ChevronDown, Filter, RotateCcw, Search, Tag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GearCategory } from "./types";

type CatalogFilterProps = {
  categories: GearCategory[];
  search?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  resultCount: number;
};

type CategoryGroup = {
  parent: GearCategory;
  children: GearCategory[];
};

function buildCategoryGroups(categories: GearCategory[]): {
  groups: CategoryGroup[];
  standalone: GearCategory[];
} {
  const parentMap = new Map<string, GearCategory>();
  const childrenMap = new Map<string, GearCategory[]>();
  const standalone: GearCategory[] = [];

  categories.forEach((cat) => {
    if (!cat.parentId) {
      parentMap.set(cat.id, cat);
      childrenMap.set(cat.id, []);
    }
  });

  categories.forEach((cat) => {
    if (cat.parentId) {
      const parentChildren = childrenMap.get(cat.parentId);
      if (parentChildren) {
        parentChildren.push(cat);
      } else {
        standalone.push(cat);
      }
    }
  });

  const groups: CategoryGroup[] = [];
  parentMap.forEach((parent) => {
    const children = childrenMap.get(parent.id) ?? [];
    children.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    groups.push({ parent, children });
  });

  groups.sort((a, b) => a.parent.name.localeCompare(b.parent.name, "vi"));
  return { groups, standalone };
}

export function CatalogFilter({
  categories,
  search,
  categoryId,
  minPrice,
  maxPrice,
  sort,
  resultCount,
}: CatalogFilterProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>();

  const activeCategoryId = categoryId ?? "all";

  // Controlled states synced with incoming props
  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategoryId);
  const [selectedSort, setSelectedSort] = useState<string>(sort ?? "default");

  useEffect(() => {
    setSelectedCategory(activeCategoryId);
  }, [activeCategoryId]);

  useEffect(() => {
    setSelectedSort(sort ?? "default");
  }, [sort]);

  const { groups, standalone } = useMemo(() => buildCategoryGroups(categories), [categories]);

  const parsePriceInput = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return "";
    const num = Number(trimmed);
    if (isNaN(num) || num < 0) return "";
    return String(num);
  };

  const navigateWithFilters = (overrides: {
    categoryId?: string;
    sort?: string;
    searchVal?: string;
    minP?: string;
    maxP?: string;
  }) => {
    const query = new URLSearchParams();
    const cat = overrides.categoryId !== undefined ? overrides.categoryId : selectedCategory;
    const s = overrides.sort !== undefined ? overrides.sort : selectedSort;
    const srch = overrides.searchVal !== undefined ? overrides.searchVal : (search ?? "");
    const min = overrides.minP !== undefined ? overrides.minP : (minPrice ?? "");
    const max = overrides.maxP !== undefined ? overrides.maxP : (maxPrice ?? "");

    if (srch.trim()) query.set("search", srch.trim());
    if (cat && cat !== "all") query.set("categoryId", cat);
    if (min.trim()) query.set("minPrice", min.trim());
    if (max.trim()) query.set("maxPrice", max.trim());
    if (s && s !== "default") query.set("sort", s);

    router.push(query.size ? `/gears?${query.toString()}` : "/gears");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawMin = String(formData.get("minPrice") ?? "").trim();
    const rawMax = String(formData.get("maxPrice") ?? "").trim();
    const searchValue = String(formData.get("search") ?? "").trim();

    const minimum = parsePriceInput(rawMin);
    const maximum = parsePriceInput(rawMax);

    if (minimum && maximum && Number(minimum) > Number(maximum)) {
      setError("Giá tối thiểu không thể lớn hơn giá tối đa.");
      return;
    }

    setError(undefined);
    navigateWithFilters({
      searchVal: searchValue,
      minP: minimum,
      maxP: maximum,
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setSelectedCategory("all");
    setSelectedSort("default");
    setError(undefined);
    router.push("/gears");
    setIsOpen(false);
  };

  return (
    <Card className="overflow-hidden border border-vanguard-light-border p-0 dark:border-vanguard-dark-border md:sticky md:top-24">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="catalog-filter-fields"
        className="flex min-h-14 w-full items-center justify-between px-5 text-left transition hover:bg-vanguard-primary/5 md:pointer-events-none"
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-vanguard-light-text dark:text-vanguard-dark-text">
          <Filter size={16} className="text-vanguard-primary" />
          Bộ lọc tìm kiếm
        </span>
        {isOpen ? <X size={17} className="md:hidden" /> : <ChevronDown size={17} className="md:hidden" />}
      </button>

      <div
        id="catalog-filter-fields"
        className={`${isOpen ? "block" : "hidden"} border-t border-vanguard-light-border px-5 pb-5 pt-5 dark:border-vanguard-dark-border md:block`}
      >
        <form
          key={[search, categoryId, minPrice, maxPrice, sort].join("|")}
          className="grid gap-5"
          onSubmit={submit}
        >
          {/* Keyword Search */}
          <div className="grid gap-2">
            <label htmlFor="filter-search" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              <Search size={13} className="text-vanguard-primary" /> Từ khóa
            </label>
            <Input
              id="filter-search"
              name="search"
              defaultValue={search}
              placeholder="Tên gear, brand, model…"
              maxLength={100}
            />
          </div>

          {/* Clean Category Grouped Dropdown Menu */}
          <div className="grid gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              <Tag size={13} className="text-vanguard-primary" /> Danh mục gear
            </span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger aria-label="Chọn danh mục gear" className="w-full">
                <SelectValue placeholder="Tất cả danh mục" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="all" className="font-semibold text-vanguard-primary">
                  Tất cả gear gaming
                </SelectItem>
                <SelectSeparator />

                {groups.map(({ parent, children }) => (
                  <SelectGroup key={parent.id}>
                    <SelectLabel className="font-bold text-vanguard-primary uppercase tracking-wider text-[11px] pt-2 pb-1">
                      {parent.name}
                    </SelectLabel>
                    <SelectItem value={parent.id} className="font-semibold text-xs text-vanguard-light-text dark:text-vanguard-dark-text">
                      Tất cả {parent.name}
                    </SelectItem>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id} className="pl-6 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                        • {child.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator className="my-1.5" />
                  </SelectGroup>
                ))}

                {standalone.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel className="font-bold text-vanguard-primary uppercase tracking-wider text-[11px] pt-2 pb-1">
                      Danh mục khác
                    </SelectLabel>
                    {standalone.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="text-xs">
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <fieldset className="grid gap-2">
            <legend className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Mức giá thuê (VNĐ/ngày)
            </legend>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="grid gap-1">
                <span className="text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Thấp nhất</span>
                <Input name="minPrice" type="number" min="0" step="1000" defaultValue={minPrice} placeholder="100.000 đ" />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Cao nhất</span>
                <Input name="maxPrice" type="number" min="0" step="1000" defaultValue={maxPrice} placeholder="Không giới hạn" />
              </label>
            </div>
          </fieldset>

          {/* Instant Sort Radix Dropdown Menu */}
          <div className="grid gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              <ArrowUpDown size={13} className="text-vanguard-primary" /> Sắp xếp theo
            </span>
            <Select value={selectedSort} onValueChange={setSelectedSort}>
              <SelectTrigger aria-label="Sắp xếp danh sách gear" className="w-full">
                <SelectValue placeholder="Mặc định" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Mặc định</SelectItem>
                <SelectItem value="relevance">Liên quan nhất</SelectItem>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="priceAsc">Giá thuê: Thấp → Cao</SelectItem>
                <SelectItem value="priceDesc">Giá thuê: Cao → Thấp</SelectItem>
                <SelectItem value="ratingDesc">Đánh giá cao nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? <p role="alert" className="text-xs font-semibold text-red-500">{error}</p> : null}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex min-h-11 items-center justify-center gap-2 rounded-v-sm border border-vanguard-light-border px-3 text-xs font-bold uppercase tracking-wider transition hover:border-vanguard-primary dark:border-vanguard-dark-border"
            >
              <RotateCcw size={14} /> Xóa lọc
            </button>
            <button
              type="submit"
              className="gold-shimmer min-h-11 rounded-v-sm bg-gold-metal px-3 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg transition hover:brightness-110 shadow-md"
            >
              Áp dụng
            </button>
          </div>
        </form>

        <p className="mt-5 border-t border-vanguard-light-border pt-4 text-center text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:text-vanguard-dark-textMuted">
          Tìm thấy <span className="font-bold text-vanguard-primary">{resultCount}</span> gear
        </p>
      </div>
    </Card>
  );
}
