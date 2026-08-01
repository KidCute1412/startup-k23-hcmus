import { DepositTypeEnum } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRentalOrderDto {
  @IsUUID('loose', { message: 'ID thiết bị không đúng định dạng' })
  gearId: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Ngày bắt đầu phải có định dạng YYYY-MM-DD',
  })
  @IsDateString({ strict: true }, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Ngày kết thúc phải có định dạng YYYY-MM-DD',
  })
  @IsDateString({ strict: true }, { message: 'Ngày kết thúc không hợp lệ' })
  endDate: string;

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
