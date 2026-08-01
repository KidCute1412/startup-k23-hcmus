import { DepositTypeEnum } from '@prisma/client';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
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

  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ giao nhận không được để trống' })
  @MinLength(5, { message: 'Địa chỉ giao nhận phải có ít nhất 5 ký tự' })
  shippingAddress: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @MaxLength(255, { message: 'Tên người nhận tối đa 255 ký tự' })
  shippingName: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại người nhận không được để trống' })
  @Matches(/^0[35789][0-9]{8}$/, {
    message:
      'Số điện thoại không hợp lệ (10 chữ số bắt đầu bằng 03, 05, 07, 08, 09)',
  })
  shippingPhone: string;
}
