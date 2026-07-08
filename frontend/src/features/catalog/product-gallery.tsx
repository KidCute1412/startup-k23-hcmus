"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { GearMedia } from "./types";

type ProductGalleryProps = {
  media: GearMedia[];
};

export function ProductGallery({ media }: ProductGalleryProps) {
  const [activeId, setActiveId] = useState(media[0]?.id);
  const active = media.find((item) => item.id === activeId) ?? media[0];

  return (
    <div className="space-y-5">
      <div className="royal-glow relative aspect-[4/3] overflow-hidden rounded-v-sm border border-vanguard-primary/40 bg-vanguard-light-surf p-3 shadow-royal dark:bg-vanguard-dark-surf">
        <div className="gold-shimmer relative h-full w-full overflow-hidden rounded-v-sm">
          <Image
            src={active.imageUrl}
            alt={active.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            className="object-cover"
          />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {media.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveId(item.id)}
            className={cn(
              "relative aspect-square overflow-hidden rounded-v-sm border bg-vanguard-light-surf p-1 transition-colors dark:bg-vanguard-dark-surf",
              active.id === item.id
                ? "border-2 border-vanguard-primary"
                : "border-vanguard-light-border hover:border-vanguard-primary dark:border-vanguard-dark-border",
            )}
            aria-label={`Xem ảnh ${item.alt}`}
          >
            <Image src={item.imageUrl} alt={item.alt} fill sizes="25vw" className="object-cover p-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
