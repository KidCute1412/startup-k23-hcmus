import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { GearStatusType } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export class UpdateGearDto {
  @IsOptional() @IsUUID('loose') categoryId?: string;
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() @MaxLength(100) brand?: string;
  @IsOptional() @IsString() @MaxLength(100) model?: string;
  @IsOptional() @IsString() @MaxLength(100) serialNumber?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsObject() specifications?: Prisma.InputJsonValue;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) value?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rentPricePerDay?: number;
  @IsOptional() @IsEnum(GearStatusType) status?: GearStatusType;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/^(https:\/\/(?:i\.)?ibb\.co\/[^?#\s]+|\/uploads\/[a-zA-Z0-9_-]+\/[^/?#]+)$/, { each: true })
  imageUrls?: string[];
}
