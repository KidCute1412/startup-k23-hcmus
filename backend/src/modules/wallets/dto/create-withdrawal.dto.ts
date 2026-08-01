import { Type } from 'class-transformer';
import { IsNumber, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @MaxLength(20)
  bankCode: string;

  @IsString()
  @Matches(/^[0-9]{6,50}$/)
  accountNumber: string;

  @IsString()
  @MaxLength(255)
  accountHolder: string;
}
