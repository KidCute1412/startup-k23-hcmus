import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf shadow-sm dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf",
        className,
      )}
      {...props}
    />
  );
}
