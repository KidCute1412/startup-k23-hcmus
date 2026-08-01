import { IsString } from 'class-validator';

export class UpsertCartItemDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;
}
