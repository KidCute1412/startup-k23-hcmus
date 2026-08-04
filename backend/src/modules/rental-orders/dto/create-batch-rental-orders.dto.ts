import { DepositTypeEnum } from '@prisma/client';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsUUID,
} from 'class-validator';

export class CreateBatchRentalOrdersDto {
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Danh sách sản phẩm thanh toán không được để trống',
  })
  @ArrayUnique()
  @IsUUID('loose', { each: true, message: 'ID sản phẩm không đúng định dạng' })
  cartItemIds: string[];

  @IsEnum(DepositTypeEnum, { message: 'Hình thức đặt cọc không hợp lệ' })
  depositType: DepositTypeEnum;

  @IsUUID('loose', { message: 'ID địa chỉ giao nhận không đúng định dạng' })
  addressId: string;
}
