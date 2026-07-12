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
          src={gear.imageUrl}
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

          {/* Kebab menu */}
          <div className="relative shrink-0">
            <button
              type="button"
              id={`gear-menu-${gear.id}`}
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex size-8 items-center justify-center rounded-v-sm text-vanguard-light-textMuted transition hover:bg-vanguard-light-surfDim hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfBright dark:hover:text-vanguard-dark-text"
              aria-label="Tùy chọn"
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-9 z-20 min-w-[168px] overflow-hidden rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf py-1 shadow-xl dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
                  <Link
                    href={`/lender/gears/${gear.id}/edit`}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-vanguard-light-surfDim dark:hover:bg-vanguard-dark-surfBright"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Edit size={13} />
                    Chỉnh sửa
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePause?.(gear.id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-vanguard-light-surfDim dark:hover:bg-vanguard-dark-surfBright"
                  >
                    {gear.listingStatus === "paused" ? (
                      <>
                        <Eye size={13} />
                        Kích hoạt lại
                      </>
                    ) : (
                      <>
                        <EyeOff size={13} />
                        Tạm dừng
                      </>
                    )}
                  </button>
                  <hr className="my-1 border-vanguard-light-border dark:border-vanguard-dark-border" />
                  <button
                    type="button"
                    onClick={() => {
                      onDelete?.(gear.id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-500 hover:bg-red-500/5"
                  >
                    <Trash2 size={13} />
                    Xóa listing
                  </button>
                </div>
              </>
            )}
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
