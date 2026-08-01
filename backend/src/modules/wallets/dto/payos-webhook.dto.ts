import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PayosWebhookDataDto {
  @IsNumber()
  orderCode: number;

  @IsNumber()
  amount: number;

  @IsString()
  reference: string;
}

export class PayosWebhookDto {
  @IsString()
  code: string;

  @IsBoolean()
  success: boolean;

  @IsDefined()
  @ValidateNested()
  @Type(() => PayosWebhookDataDto)
  data: PayosWebhookDataDto;
}
