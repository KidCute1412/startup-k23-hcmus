import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-v-sm border border-vanguard-light-border bg-white px-3 py-2 text-sm text-vanguard-light-text outline-none transition focus:border-vanguard-primary focus:ring-2 focus:ring-vanguard-primary/20 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: ComponentPropsWithoutRef<"select">) {
  return (
    <select
      className={cn(
        "min-h-11 rounded-v-sm border border-vanguard-light-border bg-white px-3 py-2 text-sm text-vanguard-light-text outline-none transition focus:border-vanguard-primary focus:ring-2 focus:ring-vanguard-primary/20 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-v-sm border border-vanguard-light-border bg-white px-3 py-2 text-sm text-vanguard-light-text outline-none transition focus:border-vanguard-primary focus:ring-2 focus:ring-vanguard-primary/20 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text",
        className,
      )}
      {...props}
    />
  );
}
