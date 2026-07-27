import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { CategoryGallery } from "@/features/catalog/category-gallery";
import { ProductGrid } from "@/features/catalog/product-grid";
import { getCategories, getFeaturedGears } from "@/features/catalog/mock-data";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/animations/reveal";
import { GoldSpotlight } from "@/components/ui/animations/gold-spotlight";
import { GoldDustParticles } from "@/components/ui/animations/gold-dust-particles";
import { AtelierLens } from "@/components/ui/animations/atelier-lens";

export default function Home() {
  const categories = getCategories();
  const featured = getFeaturedGears();

  return (
    <>
      <div className="relative w-full overflow-hidden">
        {/* Full-bleed atmospheric gold grid background */}
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(rgba(212,175,55,0.08)_1px,transparent_1px)] [background-size:40px_40px] opacity-70 dark:bg-[radial-gradient(rgba(212,175,55,0.12)_1px,transparent_1px)]" />

        {/* Expansive ambient light orbs bleeding beyond viewport edges */}
        <div className="animate-pulse-glow pointer-events-none absolute -left-48 -top-32 -z-10 size-[700px] rounded-full bg-vanguard-primary/10 blur-[130px] dark:bg-vanguard-primary/15" />
        <div className="animate-pulse-glow pointer-events-none absolute -right-48 top-1/3 -z-10 size-[800px] rounded-full bg-vanguard-primary/15 blur-[140px] dark:bg-vanguard-primary/10" />

        <GoldSpotlight className="w-full px-6 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-36 xl:px-24">
          {/* Atmospheric Gold Particles */}
          <GoldDustParticles count={32} />

          <div className="mx-auto grid max-w-[1536px] items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="space-y-8 lg:col-span-6">
              <Reveal delay={0}>
                <div className="inline-flex items-center gap-2 rounded-full border border-vanguard-primary/40 bg-vanguard-primary/10 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-widest text-vanguard-secondary shadow-sm dark:border-vanguard-primary/30 dark:bg-vanguard-primary/5 dark:text-vanguard-primary">
                  <span className="size-1.5 rounded-full bg-vanguard-secondary dark:bg-vanguard-primary animate-pulse" />
                  Heritage rental marketplace
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="space-y-5">
                  <h1 className="text-balance font-display text-4xl font-bold leading-[1.12] tracking-wide text-vanguard-light-text dark:text-vanguard-dark-text sm:text-5xl lg:text-6xl xl:text-7xl">
                    Thuê gear gaming hi-end,{" "}
                    <span className="animate-gradient-text font-normal italic">
                      giữ trải nghiệm ở đẳng cấp cao
                    </span>
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-lg lg:text-xl">
                    Marketplace cho bàn phím custom, chuột flagship, tai nghe
                    audiophile và setup sự kiện. Mỗi món gear có kiểm định, cọc linh
                    hoạt và chủ gear được xác thực.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={200}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <LinkButton href="/gears" icon={<ArrowRight size={15} />}>
                    Khám phá bộ sưu tập
                  </LinkButton>
                  <LinkButton href="/wallet" variant="outline" icon={<ShieldCheck size={15} />}>
                    Xem hạn mức cọc
                  </LinkButton>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-6">
              <Reveal delay={150} direction="left">
                <div className="animate-float royal-glow relative mx-auto aspect-[4/3] max-w-xl rounded-v-sm border border-vanguard-primary/30 bg-vanguard-light-surf p-2 shadow-2xl dark:bg-vanguard-dark-surf lg:max-w-2xl">
                  <AtelierLens className="h-full w-full rounded-v-sm">
                    <div className="gold-shimmer relative h-full overflow-hidden rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border">
                      <Image
                        src="https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=80"
                        alt="Bàn phím custom Vanguard Elite"
                        fill
                        priority
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                  </AtelierLens>
                  <div className="absolute bottom-5 right-5 z-20 border border-vanguard-primary/40 bg-vanguard-light-surf/90 px-4 py-2 font-display text-[10px] font-semibold uppercase tracking-widest text-vanguard-secondary shadow-md backdrop-blur-md dark:border-vanguard-primary/30 dark:bg-vanguard-dark-bg/85 dark:text-vanguard-primary">
                    Vanguard Atelier Edition
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </GoldSpotlight>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <Reveal className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Collections"
            title="Phân nhóm hoàng gia"
            description="Chọn nhanh theo nhu cầu thi đấu, livestream, setup sự kiện hoặc thử gear trước khi mua."
          />
          <LinkButton href="/gears" variant="outline" icon={<ArrowRight size={15} />}>
            Xem tất cả
          </LinkButton>
        </Reveal>
        <CategoryGallery categories={categories} />
      </section>

      <section className="border-y border-vanguard-primary/30 bg-gradient-to-r from-vanguard-light-surfDim/80 via-vanguard-light-surf to-vanguard-light-surfDim/80 px-4 py-14 text-vanguard-light-text shadow-sm dark:from-vanguard-dark-surfDim dark:via-vanguard-dark-surf dark:to-vanguard-dark-surfDim dark:text-vanguard-dark-text sm:px-6">
        <Reveal className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-12">
          <div className="space-y-5 md:col-span-8">
            <span className="inline-flex items-center gap-2 rounded-v-sm bg-gold-metal px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-vanguard-dark-bg shadow-sm">
              <Sparkles size={13} />
              Bespoke Atelier
            </span>
            <h2 className="font-display text-3xl font-bold leading-tight text-vanguard-light-text dark:text-vanguard-dark-text md:text-5xl">
              Mượn thử cấu hình đắt giá trước khi đặt chế tác riêng
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
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
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <Reveal className="mb-10">
          <SectionHeading
            eyebrow="Featured rentals"
            title="Gear nổi bật tuần này"
            description="Các món đang có rating cao, chủ gear phản hồi nhanh và phù hợp cho thuê ngắn hạn."
          />
        </Reveal>
        <ProductGrid gears={featured} />
      </section>
    </>
  );
}


