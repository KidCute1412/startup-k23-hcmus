import { IsBoolean, IsIn } from 'class-validator';

export class CreateCreditLimitRequestDto {
  @IsIn([3_000_000, 5_000_000, 10_000_000])
  requestedLimit: number;

  @IsBoolean()
  @IsIn([true])
  consentAccepted: boolean;
}
