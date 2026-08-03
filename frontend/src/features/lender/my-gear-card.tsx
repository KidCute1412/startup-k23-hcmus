"use client";

import {
  Edit,
  Eye,
  EyeOff,
  MoreVertical,
  Star,
  Trash2,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { GearStatusBadge } from "./gear-status-badge";
import type { LenderGear } from "./types";
import { resolveMediaUrl } from "@/lib/media";

type Props = {
  gear: LenderGear;
  onTogglePause?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export function MyGearCard({ gear, onTogglePause, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article className="royal-glow group relative flex flex-col overflow-hidden rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf shadow-sm transition-all hover:-translate-y-0.5 hover:border-vanguard-primary/40 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
      {/* Thumbnail */}
      <div className="gold-shimmer relative aspect-video overflow-hidden border-b border-vanguard-light-border bg-vanguard-light-surfDim dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfBright">
        {gear.badge ? (
          <Badge
            tone={gear.badge === "Royal Tier" ? "burgundy" : "gold"}
            className="absolute left-3 top-3 z-10"
          >
            {gear.badge}
          </Badge>
        ) : null}

        {/* Status overlay */}
        {gear.listingStatus !== "active" && (
          <div className="absolute inset-0 z-[5] bg-vanguard-dark-bg/50 backdrop-blur-[1px]" />
        )}
        <GearStatusBadge
          status={gear.listingStatus}
          className="absolute right-3 top-3 z-10"
        />

        <Image
          src={resolveMediaUrl(gear.imageUrl)}
          alt={gear.name}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              {gear.categoryName}
            </p>
            <h3 className="mt-1 truncate font-display text-base font-bold leading-6">
              {gear.name}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              {gear.shortDescription}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/lender/gears/${gear.id}/edit`}
              className="inline-flex size-8 items-center justify-center rounded-v-sm bg-vanguard-light-surfDim text-vanguard-light-textMuted hover:bg-vanguard-primary hover:text-vanguard-dark-bg transition-colors dark:bg-vanguard-dark-surfBright dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-primary dark:hover:text-vanguard-dark-bg"
              aria-label="Chỉnh sửa"
            >
              <Edit size={14} />
            </Link>
            <button
              type="button"
              onClick={() => onDelete?.(gear.id)}
              className="inline-flex size-8 items-center justify-center rounded-v-sm bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-colors dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
              aria-label="Xóa"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onTogglePause?.(gear.id)}
              className="inline-flex size-8 items-center justify-center rounded-v-sm bg-vanguard-light-surfDim text-vanguard-light-textMuted hover:bg-vanguard-light-text transition-colors dark:bg-vanguard-dark-surfBright dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
              aria-label={gear.listingStatus === "paused" ? "Kích hoạt" : "Tạm dừng"}
            >
              {gear.listingStatus === "paused" ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-vanguard-light-border pt-4 dark:border-vanguard-dark-border">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Giá / ngày
            </p>
            <p className="mt-0.5 font-display text-sm font-bold text-vanguard-primary">
              {formatCurrency(gear.dailyPrice)}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Tổng đơn
            </p>
            <p className="mt-0.5 flex items-center gap-1 font-display text-sm font-bold">
              <TrendingUp size={11} className="text-vanguard-primary" />
              {gear.totalRentals}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Đánh giá
            </p>
            <p className="mt-0.5 flex items-center gap-1 font-display text-sm font-bold">
              <Star size={11} className="text-vanguard-primary" fill="currentColor" />
              {gear.reviewCount > 0 ? gear.rating.toFixed(1) : "—"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
