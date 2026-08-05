import { IsInt, Max, Min } from 'class-validator';

export class UpdatePlatformFeeConfigDto {
  @IsInt()
  @Min(0)
  @Max(10000)
  platformFeeRateBps: number;
}
