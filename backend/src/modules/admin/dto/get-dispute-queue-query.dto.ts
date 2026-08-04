import { DisputeStatusType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum DisputeQueueSortBy {
  createdAt = 'createdAt',
  status = 'status',
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class GetDisputeQueueQueryDto {
  @IsOptional()
  @IsEnum(DisputeStatusType)
  status?: DisputeStatusType;

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

  @IsOptional()
  @IsEnum(DisputeQueueSortBy)
  sortBy: DisputeQueueSortBy = DisputeQueueSortBy.createdAt;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.desc;
}
