import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  receiverName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/)
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  detailAddress?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  ward?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  district?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  province?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
