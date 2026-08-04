import { DepositTypeEnum } from '@prisma/client';
import { IsDateString, IsEnum, IsUUID, Matches } from 'class-validator';

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

  @IsUUID('loose', { message: 'ID địa chỉ giao nhận không đúng định dạng' })
  addressId: string;
}
