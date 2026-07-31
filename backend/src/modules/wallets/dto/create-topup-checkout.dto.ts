import { Type } from 'class-transformer';
import { Equals, IsNumber, IsString, Min } from 'class-validator';

export class CreateTopupCheckoutDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @Equals('payos')
  method: 'payos';
}
