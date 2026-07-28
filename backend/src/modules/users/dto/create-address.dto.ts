import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  receiverName: string;

  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/)
  @MaxLength(20)
  phone: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  detailAddress: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  ward: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  district: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  province: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
