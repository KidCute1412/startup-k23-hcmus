import { DepositTypeEnum } from '@prisma/client';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateBatchRentalOrdersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('loose', { each: true })
  cartItemIds: string[];

  @IsEnum(DepositTypeEnum)
  depositType: DepositTypeEnum;

  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  shippingName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  shippingPhone: string;
}
