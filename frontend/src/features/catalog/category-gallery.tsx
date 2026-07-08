import Image from "next/image";
import Link from "next/link";
import type { GearCategory } from "./types";

type CategoryGalleryProps = {
  categories: GearCategory[];
};

export function CategoryGallery({ categories }: CategoryGalleryProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category, index) => (
        <Link
          key={category.id}
          href={`/gears?category=${category.id}`}
          className="royal-glow group relative block aspect-[3/4] overflow-hidden rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf hover:-translate-y-1 hover:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
        >
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
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
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-vanguard-dark-textMuted">
              {category.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
