import { DisputeReasonEnum } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export enum DisputeEvidenceMediaType {
  image = 'image',
}

export class CreateDisputeEvidenceDto {
  @IsEnum(DisputeEvidenceMediaType)
  mediaType: DisputeEvidenceMediaType;

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class CreateDisputeDto {
  @IsUUID()
  rentalOrderId: string;

  @IsEnum(DisputeReasonEnum)
  reason: DisputeReasonEnum;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => CreateDisputeEvidenceDto)
  evidences: CreateDisputeEvidenceDto[];
}
