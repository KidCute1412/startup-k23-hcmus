import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { CategoryGallery } from "@/features/catalog/category-gallery";
import { ProductGrid } from "@/features/catalog/product-grid";
import { getCategories, getFeaturedGears } from "@/features/catalog/mock-data";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

export default function Home() {
  const categories = getCategories();
  const featured = getFeaturedGears();

  return (
    <>
      <section className="relative overflow-hidden border-b border-vanguard-light-border bg-gradient-to-b from-transparent to-vanguard-light-surfDim/70 px-4 py-16 dark:border-vanguard-dark-border dark:to-vanguard-dark-surfDim/50 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-vanguard-primary/30 bg-vanguard-primary/5 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
              <span className="size-1.5 rounded-full bg-vanguard-primary" />
              Heritage rental marketplace
            </div>

            <div className="space-y-5">
              <h1 className="text-balance font-display text-4xl font-bold leading-[1.15] tracking-wide sm:text-5xl lg:text-6xl">
                Thuê gear gaming hi-end,{" "}
                <span className="text-gradient font-normal italic">
                  giữ trải nghiệm ở đẳng cấp cao
                </span>
              </h1>
              <p className="max-w-xl text-base leading-8 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-lg">
                Marketplace cho bàn phím custom, chuột flagship, tai nghe
                audiophile và setup sự kiện. Mỗi món gear có kiểm định, cọc linh
                hoạt và chủ gear được xác thực.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/gears" icon={<ArrowRight size={15} />}>
                Khám phá bộ sưu tập
              </LinkButton>
              <LinkButton href="/wallet" variant="outline" icon={<ShieldCheck size={15} />}>
                Xem hạn mức cọc
              </LinkButton>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="royal-glow relative mx-auto aspect-[4/3] max-w-xl rounded-v-sm border border-vanguard-primary/30 bg-vanguard-light-surf p-2 shadow-2xl hover:-translate-y-1 dark:bg-vanguard-dark-surf">
              <div className="gold-shimmer relative h-full overflow-hidden rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border">
                <Image
                  src="https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=80"
                  alt="Bàn phím custom Vanguard Elite"
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-5 right-5 border border-vanguard-primary/30 bg-vanguard-dark-bg/85 px-4 py-2 font-display text-[10px] font-semibold uppercase tracking-widest text-vanguard-primary backdrop-blur-md">
                Vanguard Atelier Edition
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Collections"
            title="Phân nhóm hoàng gia"
            description="Chọn nhanh theo nhu cầu thi đấu, livestream, setup sự kiện hoặc thử gear trước khi mua."
          />
          <LinkButton href="/gears" variant="outline" icon={<ArrowRight size={15} />}>
            Xem tất cả
          </LinkButton>
        </div>
        <CategoryGallery categories={categories} />
      </section>

      <section className="border-y border-vanguard-primary/30 bg-vanguard-dark-surf px-4 py-12 text-vanguard-dark-text sm:px-6">
        <div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-12">
          <div className="space-y-5 md:col-span-8">
            <span className="inline-flex items-center gap-2 rounded-v-sm bg-vanguard-primary px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-vanguard-dark-bg">
              <Sparkles size={13} />
              Bespoke Atelier
            </span>
            <h2 className="font-display text-3xl font-bold leading-tight md:text-5xl">
              Mượn thử cấu hình đắt giá trước khi đặt chế tác riêng
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-vanguard-dark-textMuted">
              Trải nghiệm chất liệu, switch, âm thanh và cảm giác cầm trong bối
              cảnh thật. Khi backend hoàn tất, flow này sẽ nối trực tiếp tới đơn
              thuê và escrow Mutux.
            </p>
          </div>
          <div className="md:col-span-4 md:text-right">
            <LinkButton href="/gears?category=keyboards" icon={<ArrowRight size={15} />}>
              Chọn gear thử
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-10">
          <SectionHeading
            eyebrow="Featured rentals"
            title="Gear nổi bật tuần này"
            description="Các món đang có rating cao, chủ gear phản hồi nhanh và phù hợp cho thuê ngắn hạn."
          />
        </div>
        <ProductGrid gears={featured} />
      </section>
    </>
  );
}
