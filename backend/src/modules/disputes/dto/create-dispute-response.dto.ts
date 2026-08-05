import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateDisputeEvidenceDto } from './create-dispute.dto';

export class CreateDisputeResponseDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => CreateDisputeEvidenceDto)
  evidences: CreateDisputeEvidenceDto[];
}
