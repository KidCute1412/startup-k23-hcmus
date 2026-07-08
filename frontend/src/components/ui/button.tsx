import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "dark";

const variants: Record<Variant, string> = {
  primary:
    "gold-shimmer bg-gold-metal text-vanguard-dark-bg shadow-lg hover:scale-[1.02]",
  outline:
    "border border-vanguard-primary text-vanguard-primary hover:bg-vanguard-primary hover:text-vanguard-dark-bg",
  ghost:
    "text-vanguard-light-textMuted hover:bg-vanguard-light-surfDim hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfBright dark:hover:text-vanguard-dark-text",
  dark:
    "border border-vanguard-primary/40 bg-vanguard-dark-surf text-vanguard-dark-text hover:border-vanguard-primary",
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  icon?: ReactNode;
};

type LinkButtonProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: Variant;
  icon?: ReactNode;
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-v-sm px-5 py-3 text-center font-display text-xs font-bold uppercase tracking-widest transition-all duration-500 ease-royal focus:outline-none focus:ring-2 focus:ring-vanguard-primary/60 focus:ring-offset-2 focus:ring-offset-vanguard-light-bg disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-vanguard-dark-bg";

export function Button({
  className,
  variant = "primary",
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
      {icon}
    </button>
  );
}

export function LinkButton({
  className,
  variant = "primary",
  icon,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={cn(base, variants[variant], className)} {...props}>
      {children}
      {icon}
    </Link>
  );
}
