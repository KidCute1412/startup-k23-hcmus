import { Type } from 'class-transformer';
import type { Prisma } from '@prisma/client';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateGearDto {
  @IsOptional()
  @IsUUID('loose')
  categoryId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  specifications?: Prisma.InputJsonValue;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rentPricePerDay: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(
    /^(https:\/\/(?:i\.)?ibb\.co\/[^?#\s]+|\/uploads\/[a-zA-Z0-9_-]+\/[^/?#]+)$/,
    { each: true },
  )
  imageUrls?: string[];
}
