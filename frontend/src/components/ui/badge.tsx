import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeProps = {
  children: ReactNode;
  tone?: "gold" | "burgundy" | "muted" | "destructive";
  className?: string;
};

export function Badge({ children, tone = "gold", className }: BadgeProps) {
  const tones = {
    gold: "bg-vanguard-primary text-vanguard-dark-bg",
    burgundy: "bg-vanguard-accent text-white",
    muted:
      "border border-vanguard-primary/30 bg-vanguard-primary/5 text-vanguard-primary",
    destructive:
      "border border-red-500/30 bg-red-500/10 text-red-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-v-sm px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
