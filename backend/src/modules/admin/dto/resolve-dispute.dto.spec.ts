import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ResolutionType, ResolveDisputeDto } from './resolve-dispute.dto';

describe('ResolveDisputeDto', () => {
  it.each([
    [{ resolutionType: ResolutionType.refund }, 0],
    [
      {
        resolutionType: ResolutionType.deposit_deduct,
        deductAmount: 1,
      },
      0,
    ],
    [{ resolutionType: ResolutionType.deposit_deduct }, 1],
    [
      {
        resolutionType: ResolutionType.deposit_deduct,
        deductAmount: 0,
      },
      1,
    ],
    [
      {
        resolutionType: ResolutionType.deposit_deduct,
        deductAmount: 1.5,
      },
      1,
    ],
    [
      {
        resolutionType: ResolutionType.refund,
        deductAmount: 1,
      },
      1,
    ],
    [{ resolutionType: ResolutionType.no_action }, 0],
    [
      {
        resolutionType: ResolutionType.no_action,
        deductAmount: 1,
      },
      1,
    ],
  ])(
    'validates conditional deduction rules for %o',
    async (body, errorCount) => {
      const errors = await validate(plainToInstance(ResolveDisputeDto, body));
      expect(errors).toHaveLength(errorCount);
    },
  );

  it('limits the optional resolution note to 2000 characters', async () => {
    const dto = plainToInstance(ResolveDisputeDto, {
      resolutionType: ResolutionType.refund,
      resolutionNote: 'x'.repeat(2001),
    });
    await expect(validate(dto)).resolves.toHaveLength(1);
  });
});
