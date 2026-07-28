import Image from "next/image";
import Link from "next/link";
import { StaggerContainer } from "@/components/ui/animations/stagger-container";
import { TiltCard } from "@/components/ui/animations/tilt-card";
import type { GearCategory } from "./types";

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  // Real backend category slugs
  "ngoai-vi-may-tinh":
    "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=900&q=80",
  "man-hinh":
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80",
  "pc-linh-kien":
    "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80",
  "stream-audio":
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
  "ghe-setup":
    "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=900&q=80",
  // Mock category fallback slugs / IDs
  keyboards:
    "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=900&q=80",
  mice: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=900&q=80",
  audio:
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
  setups:
    "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=900&q=80",
};

export function getCategoryImageUrl(category: GearCategory): string {
  if (category.imageUrl) return category.imageUrl;
  if (category.slug && CATEGORY_IMAGE_MAP[category.slug]) {
    return CATEGORY_IMAGE_MAP[category.slug];
  }
  if (category.id && CATEGORY_IMAGE_MAP[category.id]) {
    return CATEGORY_IMAGE_MAP[category.id];
  }
  return "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=900&q=80";
}

type CategoryGalleryProps = {
  categories: GearCategory[];
};

export function CategoryGallery({ categories }: CategoryGalleryProps) {
  return (
    <StaggerContainer
      staggerDelay={120}
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      {categories.map((category, index) => {
        const imageUrl = getCategoryImageUrl(category);
        const categoryKey = category.slug || category.id;
        const categoryHref = `/gears?category=${encodeURIComponent(categoryKey)}&sort=newest`;

        return (
          <TiltCard key={category.id} className="aspect-[3/4]">
            <Link
              href={categoryHref}
              className="royal-glow group relative block h-full w-full overflow-hidden rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf hover:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
            >
              <Image
                src={imageUrl}
                alt={category.name}
                fill
                sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-vanguard-dark-bg via-vanguard-dark-bg/20 to-transparent" />
              <div className="absolute inset-x-6 bottom-6">
                <p className="font-display text-[10px] font-bold uppercase tracking-widest text-vanguard-primary">
                  Category {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 font-display text-xl font-bold text-vanguard-dark-text">
                  {category.name}
                </h3>
                {category.description ? (
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-vanguard-dark-textMuted">
                    {category.description}
                  </p>
                ) : null}
              </div>
            </Link>
          </TiltCard>
        );
      })}
    </StaggerContainer>
  );
}


