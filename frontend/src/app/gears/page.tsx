import { CatalogFilter } from "@/features/catalog/catalog-filter";
import { ProductGrid } from "@/features/catalog/product-grid";
import { filterGears, getCategories } from "@/features/catalog/mock-data";

type GearsPageProps = {
  searchParams: {
    category?: string;
    sort?: string;
  };
};

export default function GearsPage({ searchParams }: GearsPageProps) {
  const categories = getCategories();
  const gears = filterGears(searchParams.category, searchParams.sort);

  return (
    <>
      <section className="border-b border-vanguard-light-border bg-vanguard-light-surfDim px-4 py-12 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
            Elite Catalog
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
            Bảo vật Atelier
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Lựa chọn gear chế tác giới hạn, có giá thuê theo ngày, cọc rõ ràng
            và chủ gear đã xác thực.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <CatalogFilter
            categories={categories}
            category={searchParams.category}
            sort={searchParams.sort}
            resultCount={gears.length}
          />
        </aside>
        <div className="space-y-5">
          <div className="rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-4 text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-textMuted">
            Hiển thị {gears.length} tuyệt phẩm
          </div>
          <ProductGrid gears={gears} />
        </div>
      </section>
    </>
  );
}
