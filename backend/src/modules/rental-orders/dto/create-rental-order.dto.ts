import { DepositTypeEnum } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateRentalOrderDto {
  @IsUUID('loose')
  gearId: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  startDate: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  endDate: string;

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
