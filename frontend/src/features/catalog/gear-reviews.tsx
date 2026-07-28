import { Star } from "lucide-react";
import type { GearReview } from "./types";

export function GearReviews({ reviews }: { reviews: GearReview[] }) {
  if (!reviews.length) {
    return <p className="text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Gear này chưa có đánh giá.</p>;
  }
  return (
    <div className="grid gap-4">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-v-sm border border-vanguard-light-border p-5 dark:border-vanguard-dark-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong>{review.reviewer.fullName ?? "Người thuê"}</strong>
            <span className="flex items-center gap-1 text-vanguard-primary"><Star size={14} fill="currentColor" />{review.rating}/5</span>
          </div>
          {review.comment ? <p className="mt-3 text-sm leading-6">{review.comment}</p> : null}
          <time className="mt-3 block text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted" dateTime={review.createdAt}>{new Intl.DateTimeFormat("vi-VN").format(new Date(review.createdAt))}</time>
        </article>
      ))}
    </div>
  );
}
