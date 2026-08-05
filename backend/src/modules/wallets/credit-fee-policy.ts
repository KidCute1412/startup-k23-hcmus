import { Prisma } from '@prisma/client';

export const CREDIT_USAGE_FEE = new Prisma.Decimal(30_000);
export const CREDIT_USAGE_FEE_AMOUNT = CREDIT_USAGE_FEE.toNumber();

export function creditFeeReference(userId: string, date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
    })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  return `CREDIT-FEE-${userId}-${parts.year}-${parts.month}`;
}

export function creditFeeMonthStart(date = new Date()): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
    })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  return new Date(`${parts.year}-${parts.month}-01T00:00:00.000Z`);
}
