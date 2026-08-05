import { ProofStageEnum } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRentalProofBatchDto {
  @IsEnum(ProofStageEnum)
  stage: ProofStageEnum;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  fileUrls: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
