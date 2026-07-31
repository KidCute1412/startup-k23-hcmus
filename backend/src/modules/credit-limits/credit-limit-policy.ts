export const CREDIT_LIMIT_TIERS = [3_000_000, 5_000_000, 10_000_000] as const;

export function nextCreditLimitTiers(currentLimit: number): number[] {
  return CREDIT_LIMIT_TIERS.filter((tier) => tier > currentLimit);
}

export function completedOrdersRequired(requestedLimit: number): number {
  if (requestedLimit === 3_000_000) return 0;
  if (requestedLimit === 5_000_000) return 3;
  if (requestedLimit === 10_000_000) return 10;
  return Number.POSITIVE_INFINITY;
}

export function isConfiguredCreditTier(value: number): boolean {
  return CREDIT_LIMIT_TIERS.includes(
    value as (typeof CREDIT_LIMIT_TIERS)[number],
  );
}
