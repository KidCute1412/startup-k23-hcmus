import { ApprovalStatusType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetGearQueueQueryDto {
  @IsOptional()
  @IsEnum(ApprovalStatusType)
  approvalStatus: ApprovalStatusType = ApprovalStatusType.pending;

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
