"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LinkButton } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

type WalletCtaButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "outline";
};

export function WalletCtaButton({
  children,
  icon,
  variant,
}: WalletCtaButtonProps) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <LinkButton
      href={user ? "/wallet" : "/login?returnTo=%2Fwallet"}
      variant={variant}
      icon={icon}
      onClick={(event) => {
        event.preventDefault();
        router.push(user ? "/wallet" : "/login?returnTo=%2Fwallet");
      }}
    >
      {children}
    </LinkButton>
  );
}
