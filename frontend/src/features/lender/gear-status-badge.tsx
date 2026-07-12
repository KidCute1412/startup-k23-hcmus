import { cn } from "@/lib/cn";
import type { ListingStatus } from "./types";

const statusConfig: Record<
  ListingStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Đang cho thuê",
    className:
      "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  },
  paused: {
    label: "Tạm dừng",
    className:
      "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  },
  draft: {
    label: "Bản nháp",
    className:
      "bg-vanguard-light-surfBright/80 text-vanguard-light-textMuted border border-vanguard-light-border dark:bg-vanguard-dark-surfBright/80 dark:text-vanguard-dark-textMuted dark:border-vanguard-dark-border",
  },
  pending_approval: {
    label: "Chờ duyệt",
    className:
      "bg-vanguard-primary/10 text-vanguard-primary border border-vanguard-primary/20",
  },
  rejected: {
    label: "Bị từ chối",
    className:
      "bg-red-500/10 text-red-500 border border-red-500/20",
  },
};

type Props = {
  status: ListingStatus;
  className?: string;
};

export function GearStatusBadge({ status, className }: Props) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-v-sm px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-widest",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
