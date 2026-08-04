import { ArrowRight, Award, CheckCircle2, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Image from "next/image";
import { CategoryGallery } from "@/features/catalog/category-gallery";
import { ProductGrid } from "@/features/catalog/product-grid";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/animations/reveal";
import { GoldSpotlight } from "@/components/ui/animations/gold-spotlight";
import { GoldDustParticles } from "@/components/ui/animations/gold-dust-particles";
import { AtelierLens } from "@/components/ui/animations/atelier-lens";
import type { Gear, GearCategory } from "@/types/catalog";
import { WalletCtaButton } from "@/components/about/wallet-cta-button";
interface HomeViewProps {
  categories: GearCategory[];
  featured: Gear[];
}

export function HomeView({ categories, featured }: HomeViewProps) {
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
                  Mutux - Gear Up & Play
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="space-y-5">
                  <h1 className="text-balance font-display text-4xl font-bold leading-[1.12] tracking-wide text-vanguard-light-text dark:text-vanguard-dark-text sm:text-5xl lg:text-6xl xl:text-7xl">
                    Thuê gear gaming hi-end,{" "}
                    <span className="animate-gradient-text font-normal">
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
                  <WalletCtaButton variant="outline" icon={<ShieldCheck size={15} />}>
                      Xem Hạn Mức Cọc
                  </WalletCtaButton>
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
                        alt="Bàn phím custom"
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

      {/* Mutux Core Value Props & Trust Banner */}
      <section className="border-b border-vanguard-primary/20 bg-vanguard-light-surf/50 px-4 py-10 backdrop-blur-sm dark:bg-vanguard-dark-surf/50 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal delay={0}>
              <div className="flex items-start gap-4 rounded-v-sm border border-vanguard-light-border/80 bg-vanguard-light-surf p-5 shadow-sm transition-all hover:border-vanguard-primary/50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-v-sm bg-vanguard-primary/10 text-vanguard-secondary dark:text-vanguard-primary">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                    Kiểm Định 100%
                  </h3>
                  <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Kiểm tra switch, cảm biến & vệ sinh khử khuẩn vô trùng trước khi giao.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="flex items-start gap-4 rounded-v-sm border border-vanguard-light-border/80 bg-vanguard-light-surf p-5 shadow-sm transition-all hover:border-vanguard-primary/50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-v-sm bg-vanguard-primary/10 text-vanguard-secondary dark:text-vanguard-primary">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                    Cọc Linh Hoạt Escrow
                  </h3>
                  <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Giữ cọc an toàn qua ví Mutux, tự động hoàn trả ngay khi trả gear.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="flex items-start gap-4 rounded-v-sm border border-vanguard-light-border/80 bg-vanguard-light-surf p-5 shadow-sm transition-all hover:border-vanguard-primary/50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-v-sm bg-vanguard-primary/10 text-vanguard-secondary dark:text-vanguard-primary">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                    Chủ Gear KYC 2 Lớp
                  </h3>
                  <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Xác minh danh tính chủ cho thuê, minh bạch lịch sử và đánh giá.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="flex items-start gap-4 rounded-v-sm border border-vanguard-light-border/80 bg-vanguard-light-surf p-5 shadow-sm transition-all hover:border-vanguard-primary/50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-v-sm bg-vanguard-primary/10 text-vanguard-secondary dark:text-vanguard-primary">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                    Giao Nhận Hỏa Tốc
                  </h3>
                  <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Giao tận nơi trong 2 giờ tại nội thành, sẵn sàng cho mọi trận đấu.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <Reveal className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Collections"
            title="Phân nhóm gear"
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
            {/* <span className="inline-flex items-center gap-2 rounded-v-sm bg-gold-metal px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-vanguard-dark-bg shadow-sm">
              <Sparkles size={13} />
              Bespoke Atelier
            </span> */}
            <h2 className="font-display text-3xl font-bold leading-tight text-vanguard-light-text dark:text-vanguard-dark-text md:text-5xl">
              Mượn thử cấu hình đắt giá trước khi đặt chế tác riêng
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Trải nghiệm thực tế chất liệu nhôm nguyên khối, switch mạ vàng, âm thanh thô và cảm giác gõ độc bản trong môi trường của bạn. Đặt cọc an toàn qua ví Mutux Escrow và nhận gear tận nơi.
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
            eyebrow=""
            title="Gear nổi bật tuần này"
            description="Các món đang có rating cao, chủ gear phản hồi nhanh và sẵn sàng cho thuê ngay."
          />
        </Reveal>
        <ProductGrid gears={featured} />
      </section>
    </>
  );
}
