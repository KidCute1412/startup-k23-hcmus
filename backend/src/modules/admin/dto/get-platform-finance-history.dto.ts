import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  RentalFeeSettlementStatus,
  PlatformLedgerType,
  EscrowStatusType,
} from '@prisma/client';

export class GetRentalSettlementsQueryDto {
  @IsOptional()
  @IsEnum(RentalFeeSettlementStatus)
  status?: RentalFeeSettlementStatus;

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

export class GetRevenueTransactionsQueryDto {
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

export class GetLenderPayableTransactionsQueryDto {
  @IsOptional()
  @IsEnum(PlatformLedgerType)
  type?: PlatformLedgerType;

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

export class GetEscrowHistoryQueryDto {
  @IsOptional()
  @IsEnum(EscrowStatusType)
  status?: EscrowStatusType;

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
