import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestLenderUpgradeDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
