import { ProofStageEnum } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRentalProofDto {
  @IsEnum(ProofStageEnum)
  stage: ProofStageEnum;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
