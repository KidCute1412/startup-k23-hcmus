import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CloseDisputeDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  closeNote?: string;
}
