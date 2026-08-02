import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GearReviews } from "@/features/catalog/gear-reviews";
import { ProductDetail } from "@/features/catalog/product-detail";
import { ProductGallery } from "@/features/catalog/product-gallery";
import { ProductGrid } from "@/features/catalog/product-grid";
import { SpecificationTable } from "@/features/catalog/specification-table";
import { GoldSpotlight } from "@/components/ui/animations/gold-spotlight";
import { GoldDustParticles } from "@/components/ui/animations/gold-dust-particles";
import { ApiError } from "@/lib/apiClient";
import { extractGearId } from "@/lib/slug";
import { getGearById, getGears } from "@/services/gearService";

type Props = {
  params: { gearId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const realId = extractGearId(params.gearId);
  try {
    const gear = await getGearById(realId);
    const primaryImage = gear.media[0]?.imageUrl;
    return {
      title: `${gear.name} - Thuê Gear Gaming | Mutux`,
      description: gear.description || `Thuê ${gear.name} chính hãng với giá ${gear.pricing.dailyPrice.toLocaleString("vi-VN")}đ/ngày tại Mutux.`,
      openGraph: {
        title: gear.name,
        description: gear.shortDescription || gear.description,
        images: primaryImage ? [{ url: primaryImage }] : [],
      },
    };
  } catch {
    return {
      title: "Chi tiết gear | Mutux",
    };
  }
}

export default async function GearDetailPage({ params }: Props) {
  const realId = extractGearId(params.gearId);
  let gear;
  try {
    gear = await getGearById(realId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const related = gear.categoryId
    ? await getGears({ categoryId: gear.categoryId, limit: 4, sort: "newest" })
        .then((result) => result.data.filter((item) => item.id !== gear.id).slice(0, 3))
        .catch(() => [])
    : [];

  return (
    <GoldSpotlight className="w-full">
      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <GoldDustParticles count={30} />
        <nav className="mb-8 flex flex-wrap gap-2 text-xs uppercase tracking-widest">
          <Link href="/">Trang chủ</Link><span>/</span><Link href="/gears">Catalog</Link><span>/</span><span className="text-vanguard-primary">{gear.name}</span>
        </nav>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-6"><ProductGallery media={gear.media} /></div>
          <div className="min-w-0 lg:col-span-6"><ProductDetail gear={gear} /></div>
        </div>
        <section className="mt-16 border-t border-vanguard-light-border pt-12 dark:border-vanguard-dark-border">
          <h2 className="mb-6 font-display text-2xl font-bold uppercase tracking-wider">Thông số kỹ thuật</h2>
          <SpecificationTable specifications={gear.specifications} />
        </section>
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold uppercase tracking-wider">Đánh giá từ người thuê</h2>
          <GearReviews reviews={gear.reviews ?? []} />
        </section>
        {related.length ? <section className="mt-16"><h2 className="mb-6 font-display text-2xl font-bold uppercase tracking-wider">Cùng danh mục</h2><ProductGrid gears={related} /></section> : null}
      </section>
    </GoldSpotlight>
  );
}
