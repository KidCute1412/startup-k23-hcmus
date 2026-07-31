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
      <article className="royal-glow flex h-full flex-col overflow-hidden rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf shadow-sm hover:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
        <div className="gold-shimmer relative aspect-video overflow-hidden border-b border-vanguard-light-border bg-vanguard-light-surfDim dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfBright">
          {gear.badge ? (
            <Badge
              tone={gear.badge === "Royal Tier" || gear.badge === "Limited" ? "burgundy" : "gold"}
              className="absolute left-3 top-3 z-10"
            >
              {gear.badge}
            </Badge>
          ) : null}
          {gear.limited ? (
            <Badge tone="burgundy" className="absolute right-3 top-3 z-10">
              {gear.limited}
            </Badge>
          ) : null}
          <SafeGearImage
            src={gear.media[0]?.imageUrl ?? "/gear-placeholder.svg"}
            alt={gear.media[0]?.alt ?? gear.name}
            fill
            sizes="(min-width: 1024px) 28vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold leading-6">
                {gear.name}
              </h3>
              <p className="mt-1 text-xs leading-5 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                {gear.shortDescription}
              </p>
            </div>
            <div className="flex shrink-0 items-center text-vanguard-secondary dark:text-vanguard-primary">
              <Star size={15} fill="currentColor" />
              <span className="ml-1 text-xs font-bold">{gear.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="min-w-0">
                <p className="uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Giá thuê
                </p>
                <p className="mt-1 break-words font-display text-lg font-bold text-vanguard-secondary dark:text-vanguard-primary">
                  {formatCurrency(gear.pricing.dailyPrice)}
                  <span className="text-xs font-normal">/ngày</span>
                </p>
              </div>
              <div>
                <p className="uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Tình trạng
                </p>
                <p className={`mt-1 font-semibold ${availabilityTone(gear.availability)}`}>
                  {availabilityLabel(gear.availability)}
                </p>
              </div>
            </div>
            <LinkButton
              href={getGearDetailUrl(gear.id, gear.name)}
              variant="outline"
              className="w-full"
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
