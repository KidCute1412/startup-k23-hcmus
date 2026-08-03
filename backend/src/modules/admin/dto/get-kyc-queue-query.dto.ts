import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum KycQueueStatus {
  pending = 'pending',
  verified = 'verified',
  rejected = 'rejected',
  none = 'none',
}

export class GetKycQueueQueryDto {
  @IsOptional()
  @IsEnum(KycQueueStatus)
  status: KycQueueStatus = KycQueueStatus.pending;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}
