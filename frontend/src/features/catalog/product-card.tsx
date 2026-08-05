import { ArrowUpRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { TiltCard } from "@/components/ui/animations/tilt-card";
import { formatCurrency } from "@/lib/format";
import { getGearDetailUrl } from "@/lib/slug";
import { availabilityLabel, availabilityTone } from "./availability";
import { SafeGearImage } from "./safe-gear-image";
import type { Gear } from "@/types/catalog";

type ProductCardProps = {
  gear: Gear;
};

export function ProductCard({ gear }: ProductCardProps) {
  return (
    <TiltCard className="h-full min-w-0 max-w-full">
      <article className="royal-glow group flex h-full flex-col overflow-hidden rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf shadow-sm hover:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf transition-all duration-300">
        {/* Gear Image Container */}
        <div className="gold-shimmer relative aspect-[16/10] overflow-hidden border-b border-vanguard-light-border bg-vanguard-light-surfDim dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfBright">
          {gear.badge ? (
            <Badge
              tone={gear.badge === "Royal Tier" || gear.badge === "Limited" ? "burgundy" : "gold"}
              className="absolute left-3 top-3 z-10 font-bold uppercase tracking-wider text-[10px]"
            >
              {gear.badge}
            </Badge>
          ) : null}
          {gear.limited ? (
            <Badge tone="burgundy" className="absolute right-3 top-3 z-10 font-bold uppercase tracking-wider text-[10px]">
              {gear.limited}
            </Badge>
          ) : null}
          <SafeGearImage
            src={gear.media[0]?.imageUrl ?? "/gear-placeholder.svg"}
            alt={gear.media[0]?.alt ?? gear.name}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content Container */}
        <div className="flex flex-1 flex-col gap-4 p-5">
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base font-bold leading-snug line-clamp-1 group-hover:text-vanguard-primary transition-colors text-vanguard-light-text dark:text-vanguard-dark-text">
                {gear.name}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                {gear.shortDescription}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-v-sm bg-vanguard-primary/10 px-2 py-1 text-vanguard-primary">
              <Star size={13} fill="currentColor" />
              <span className="text-xs font-bold">{gear.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Pricing & Status Section */}
          <div className="mt-auto space-y-3 pt-2">
            <div className="border-t border-vanguard-light-border/60 pt-3 dark:border-vanguard-dark-border/60">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Giá thuê
                </p>
                <span className={`text-[11px] font-bold ${availabilityTone(gear.availability)}`}>
                  ● {availabilityLabel(gear.availability)}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-lg font-bold text-vanguard-secondary dark:text-vanguard-primary sm:text-xl">
                  {formatCurrency(gear.pricing.dailyPrice)}
                </span>
                <span className="text-xs font-normal text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  / ngày
                </span>
              </div>
            </div>

            <LinkButton
              href={getGearDetailUrl(gear.id, gear.name)}
              variant="outline"
              className="w-full text-xs font-bold uppercase tracking-wider group-hover:border-vanguard-primary group-hover:bg-vanguard-primary/10 transition-all"
              icon={<ArrowUpRight size={14} />}
            >
              Xem chi tiết
            </LinkButton>
          </div>
        </div>
      </article>
    </TiltCard>
  );
}
