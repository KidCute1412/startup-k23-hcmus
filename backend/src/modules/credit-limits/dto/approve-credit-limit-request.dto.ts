import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveCreditLimitRequestDto {
  @IsIn([3_000_000, 5_000_000, 10_000_000])
  approvedLimit: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNote?: string;
}
