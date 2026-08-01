import type { Metadata } from "next";
import { ActiveFilters } from "@/features/catalog/active-filters";
import { CatalogFilter } from "@/features/catalog/catalog-filter";
import { CatalogPagination } from "@/features/catalog/catalog-pagination";
import { ProductGrid } from "@/features/catalog/product-grid";
import type { Gear, GearCategory } from "@/types/catalog";
import { getCategories, getGears, type GearCatalogSort } from "@/services/gearService";

export const metadata: Metadata = {
  title: "Catalog gear | Mutux",
  description: "Tìm và thuê gear gaming đã được duyệt trên Mutux.",
};

type Query = {
  search?: string;
  category?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

export default async function GearsPage({ searchParams }: { searchParams: Query }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const [categoryResult, gearResult] = await Promise.allSettled([
    getCategories(),
    getGears({
      page,
      limit: 12,
      search: searchParams.search,
      category: searchParams.category,
      categoryId: searchParams.categoryId,
      minPrice: searchParams.minPrice,
      maxPrice: searchParams.maxPrice,
      sort: searchParams.sort as GearCatalogSort | undefined,
    }),
  ]);
  const categories: GearCategory[] = categoryResult.status === "fulfilled" ? categoryResult.value : [];
  const gears: Gear[] = gearResult.status === "fulfilled" ? gearResult.value.data : [];
  const meta = gearResult.status === "fulfilled" ? gearResult.value.meta : { total: 0, page, limit: 12, totalPages: 0 };

  return (
    <>
      <section className="border-b border-vanguard-light-border bg-vanguard-light-surfDim px-4 py-12 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">Catalog gear</p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">Thuê Gear Gaming Cao Cấp</h1>
          <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Khám phá danh sách bàn phím, chuột, tai nghe, màn hình gaming chính hãng sẵn sàng cho thuê với mức giá hấp dẫn.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <CatalogFilter
            categories={categories}
            search={searchParams.search}
            category={searchParams.category}
            categoryId={searchParams.categoryId}
            minPrice={searchParams.minPrice}
            maxPrice={searchParams.maxPrice}
            sort={searchParams.sort}
            resultCount={meta.total}
          />
        </aside>

        <div className="min-w-0 space-y-6">
          {gearResult.status === "rejected" ? (
            <div role="alert" className="rounded-v-sm border border-vanguard-accent/50 p-6">
              <h2 className="font-display text-xl font-bold">Không thể tải catalog</h2>
              <p className="mt-2 text-sm">Dịch vụ gear đang tạm thời không khả dụng. Vui lòng thử lại sau.</p>
            </div>
          ) : (
            <>
              <ActiveFilters
                categories={categories}
                search={searchParams.search}
                category={searchParams.category}
                categoryId={searchParams.categoryId}
                minPrice={searchParams.minPrice}
                maxPrice={searchParams.maxPrice}
                sort={searchParams.sort}
                resultCount={meta.total}
              />
              <ProductGrid gears={gears} />
              <CatalogPagination page={meta.page} totalPages={meta.totalPages} searchParams={searchParams} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
