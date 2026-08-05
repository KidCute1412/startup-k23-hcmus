import { Prisma } from '@prisma/client';
import { PlatformFinanceService } from './platform-finance.service';

describe('PlatformFinanceService', () => {
  it('rounds the platform share down to whole VND and leaves the remainder for lender', () => {
    const service = new PlatformFinanceService({} as never);
    const gross = new Prisma.Decimal(1001);
    const platformFee = (
      service as unknown as {
        fee(amount: Prisma.Decimal, rate: number): Prisma.Decimal;
      }
    ).fee(gross, 3000);
    expect(platformFee.toString()).toBe('300');
    expect(gross.sub(platformFee).toString()).toBe('701');
  });
});
