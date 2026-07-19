import { IsString, Length } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @Length(1, 20)
  cccd: string;
}
