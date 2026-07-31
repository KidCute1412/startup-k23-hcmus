import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectCreditLimitRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reviewNote: string;
}
