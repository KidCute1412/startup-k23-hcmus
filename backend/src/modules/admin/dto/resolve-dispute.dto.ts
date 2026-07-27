import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum ResolutionType {
  refund = 'refund',
  deposit_deduct = 'deposit_deduct',
  compensation = 'compensation',
  no_action = 'no_action',
}

export class ResolveDisputeDto {
  @IsEnum(ResolutionType)
  resolutionType: ResolutionType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  deductAmount?: number;

  @IsOptional()
  @IsString()
  resolutionNote?: string;
}
