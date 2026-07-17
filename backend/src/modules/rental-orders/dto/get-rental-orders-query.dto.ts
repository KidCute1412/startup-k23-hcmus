import { OrderStatusType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetRentalOrdersQueryDto {
  @IsOptional()
  @IsIn(['renter', 'lender'])
  role?: 'renter' | 'lender';

  @IsOptional()
  @IsEnum(OrderStatusType)
  status?: OrderStatusType;

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
