import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectLenderUpgradeRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  reviewNote!: string;
}
