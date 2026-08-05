"use client";

import { ArrowUpDown, ChevronDown, Filter, RotateCcw, Search, Tag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { CustomSelect } from "@/components/ui/custom-select";
import type { GearCategory } from "@/types/catalog";
import { CategoryModal } from "./category-modal";

type CatalogFilterProps = {
  categories: GearCategory[];
  search?: string;
  category?: string;
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function CatalogFilter({
  categories,
  search,
  category,
  categoryId,
  minPrice,
  maxPrice,
  sort,
  resultCount,
}: CatalogFilterProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>();

  // Determine current active category slug or ID
  const activeCategoryKey = useMemo(() => {
    if (category) {
      const matched = categories.find((c) => c.slug === category || c.id === category);
      return matched ? (matched.slug || matched.id) : category;
    }
    if (categoryId) {
      const matched = categories.find((c) => c.id === categoryId);
      return matched ? (matched.slug || matched.id) : categoryId;
    }
    return "all";
  }, [categories, category, categoryId]);

  // Controlled states synced with incoming props
  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategoryKey);
  const [selectedSort, setSelectedSort] = useState<string>(sort ?? "default");

  useEffect(() => {
    setSelectedCategory(activeCategoryKey);
  }, [activeCategoryKey]);

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
    categoryKey?: string;
    sort?: string;
    searchVal?: string;
    minP?: string;
    maxP?: string;
  }) => {
    const query = new URLSearchParams();
    const cat = overrides.categoryKey !== undefined ? overrides.categoryKey : selectedCategory;
    const s = overrides.sort !== undefined ? overrides.sort : selectedSort;
    const srch = overrides.searchVal !== undefined ? overrides.searchVal : (search ?? "");
    const min = overrides.minP !== undefined ? overrides.minP : (minPrice ?? "");
    const max = overrides.maxP !== undefined ? overrides.maxP : (maxPrice ?? "");

    if (srch.trim()) query.set("search", srch.trim());
    if (cat && cat !== "all") {
      if (UUID_REGEX.test(cat)) {
        query.set("categoryId", cat);
      } else {
        query.set("category", cat);
      }
    }
    if (min.trim()) query.set("minPrice", min.trim());
    if (max.trim()) query.set("maxPrice", max.trim());
    if (s && s !== "default") query.set("sort", s);

    router.push(query.size ? `/gears?${query.toString()}` : "/gears");
  };

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [shouldRenderModal, setShouldRenderModal] = useState(false);
  const [modalAnimateState, setModalAnimateState] = useState(false);
  
  const openModal = () => {
    setShouldRenderModal(true);
    requestAnimationFrame(() => {
      setModalAnimateState(true);
    });
  };

  const closeModal = () => {
    setModalAnimateState(false);
    setTimeout(() => {
      setShouldRenderModal(false);
    }, 300);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    navigateWithFilters({ categoryKey: val });
    closeModal();
  };

  const handleSortChange = (val: string) => {
    setSelectedSort(val);
    navigateWithFilters({ sort: val });
  };

  const handleInputChange = (event: React.FocusEvent<HTMLInputElement>) => {
    const name = event.target.name;
    const value = event.target.value.trim();

    if (name === "minPrice" || name === "maxPrice") {
      const parsed = parsePriceInput(value);
      if (name === "minPrice") {
        if (maxPrice && parsed && Number(parsed) > Number(maxPrice)) {
          setError("Giá tối thiểu không thể lớn hơn giá tối đa.");
          return;
        }
        setError(undefined);
        navigateWithFilters({ minP: parsed });
      } else {
        if (minPrice && parsed && Number(minPrice) > Number(parsed)) {
          setError("Giá tối đa không thể nhỏ hơn giá tối thiểu.");
          return;
        }
        setError(undefined);
        navigateWithFilters({ maxP: parsed });
      }
    } else if (name === "search") {
      navigateWithFilters({ searchVal: value });
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const handleReset = () => {
    setSelectedCategory("all");
    setSelectedSort("default");
    setError(undefined);
    router.push("/gears");
    setIsOpen(false);
  };

  // Safe category display resolution for the single button label
  const activeCategoryName = useMemo(() => {
    if (selectedCategory === "all") return "Tất cả gear gaming";
    const matched = categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory);
    return matched ? matched.name : "Tất cả gear gaming";
  }, [categories, selectedCategory]);

  return (
    <>
      <Card className="royal-glow overflow-hidden border border-vanguard-light-border bg-white p-0 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf md:sticky md:top-24 shadow-sm transition-all duration-300">
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
          {isOpen ? <X size={17} className="md:hidden text-vanguard-primary" /> : <ChevronDown size={17} className="md:hidden text-vanguard-primary" />}
        </button>

        <div
          id="catalog-filter-fields"
          className={`${isOpen ? "block" : "hidden"} border-t border-vanguard-light-border px-5 pb-5 pt-5 dark:border-vanguard-dark-border md:block`}
        >
          <form
            key={[search, categoryId, minPrice, maxPrice, sort].join("|")}
            className="grid gap-5"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Keyword Search */}
            <div className="grid gap-2">
              <label htmlFor="filter-search" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-vanguard-primary">
                <Search size={13} /> Từ khóa
              </label>
              <Input
                id="filter-search"
                name="search"
                defaultValue={search}
                placeholder="Tên gear, brand, model…"
                maxLength={100}
                onBlur={handleInputChange}
                onKeyDown={handleInputKeyDown}
                className="bg-transparent border-vanguard-light-border dark:border-vanguard-dark-border focus:border-vanguard-primary dark:focus:border-vanguard-primary"
              />
            </div>

            {/* Single Premium Category Trigger Button */}
            <div className="grid gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-vanguard-primary">
                <Tag size={13} /> Danh mục gear
              </span>
              <button
                type="button"
                onClick={openModal}
                className="flex min-h-12 w-full items-center justify-between rounded-v-sm border border-vanguard-light-border bg-transparent px-4 text-left text-xs font-semibold text-vanguard-light-text hover:border-vanguard-primary dark:border-vanguard-dark-border dark:text-vanguard-dark-text dark:hover:border-vanguard-primary transition-all"
              >
                <span>{activeCategoryName}</span>
                <ChevronDown size={14} className="opacity-70" />
              </button>
            </div>

            {/* Price Range */}
            <fieldset className="grid gap-2">
              <legend className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-vanguard-primary">
                Mức giá thuê (VNĐ/ngày)
              </legend>
              <div className="grid grid-cols-2 gap-2.5">
                <label className="grid gap-1">
                  <span className="text-[10px] uppercase font-semibold text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Thấp nhất</span>
                  <Input
                    name="minPrice"
                    type="number"
                    min="0"
                    step="1000"
                    defaultValue={minPrice}
                    placeholder="100.000 đ"
                    onBlur={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    className="min-h-12 bg-transparent border-vanguard-light-border dark:border-vanguard-dark-border focus:border-vanguard-primary dark:focus:border-vanguard-primary"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-[10px] uppercase font-semibold text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Cao nhất</span>
                  <Input
                    name="maxPrice"
                    type="number"
                    min="0"
                    step="1000"
                    defaultValue={maxPrice}
                    placeholder="Không giới hạn"
                    onBlur={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    className="min-h-12 bg-transparent border-vanguard-light-border dark:border-vanguard-dark-border focus:border-vanguard-primary dark:focus:border-vanguard-primary"
                  />
                </label>
              </div>
            </fieldset>

            {/* Instant Sort Radix Dropdown Menu */}
            <div className="grid gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-vanguard-primary">
                <ArrowUpDown size={13} /> Sắp xếp theo
              </span>
              <CustomSelect
                value={selectedSort}
                onValueChange={handleSortChange}
                className="w-full"
                options={[
                  { value: "default", label: "Mặc định" },
                  { value: "relevance", label: "Liên quan nhất" },
                  { value: "newest", label: "Mới nhất" },
                  { value: "priceAsc", label: "Giá thuê: Thấp → Cao" },
                  { value: "priceDesc", label: "Giá thuê: Cao → Thấp" },
                  { value: "ratingDesc", label: "Đánh giá cao nhất" },
                ]}
              />
            </div>

            {error ? <p role="alert" className="text-xs font-semibold text-red-500">{error}</p> : null}

            {/* Action buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-v-sm border border-vanguard-light-border bg-transparent text-xs font-bold uppercase tracking-wider transition hover:border-vanguard-primary hover:text-vanguard-primary dark:border-vanguard-dark-border dark:text-vanguard-dark-text royal-transition"
              >
                <RotateCcw size={14} /> Xóa bộ lọc
              </button>
            </div>
          </form>

          <p className="mt-5 border-t border-vanguard-light-border pt-4 text-center text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:text-vanguard-dark-textMuted">
            Tìm thấy <span className="font-bold text-vanguard-primary">{resultCount}</span> gear
          </p>
        </div>
      </Card>

      <CategoryModal
        shouldRenderModal={shouldRenderModal}
        modalAnimateState={modalAnimateState}
        selectedCategory={selectedCategory}
        groups={groups}
        standalone={standalone}
        onClose={closeModal}
        onSelectCategory={handleCategoryChange}
      />
    </>
  );
}
