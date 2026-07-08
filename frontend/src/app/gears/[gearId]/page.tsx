import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/features/catalog/product-detail";
import { ProductGallery } from "@/features/catalog/product-gallery";
import { ProductGrid } from "@/features/catalog/product-grid";
import { SpecificationTable } from "@/features/catalog/specification-table";
import {
  getGearById,
  getGears,
  getRelatedGears,
} from "@/features/catalog/mock-data";

type GearDetailPageProps = {
  params: {
    gearId: string;
  };
};

export function generateStaticParams() {
  return getGears().map((gear) => ({ gearId: gear.slug }));
}

export default function GearDetailPage({ params }: GearDetailPageProps) {
  const gear = getGearById(params.gearId);

  if (!gear) {
    notFound();
  }

  const related = getRelatedGears(gear);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <nav className="mb-8 flex flex-wrap gap-2 font-display text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
        <Link href="/" className="hover:text-vanguard-primary">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/gears" className="hover:text-vanguard-primary">
          Catalog
        </Link>
        <span>/</span>
        <span className="text-vanguard-primary">{gear.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <ProductGallery media={gear.media} />
        </div>
        <div className="lg:col-span-6">
          <ProductDetail gear={gear} />
        </div>
      </div>

      <section className="mt-16 border-t border-vanguard-light-border pt-12 dark:border-vanguard-dark-border">
        <h2 className="mb-6 font-display text-2xl font-bold uppercase tracking-wider">
          Hồ sơ kiểm định
        </h2>
        <SpecificationTable specifications={gear.specifications} />
      </section>

      {related.length ? (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold uppercase tracking-wider">
            Cùng danh mục
          </h2>
          <ProductGrid gears={related} />
        </section>
      ) : null}
    </section>
  );
}
