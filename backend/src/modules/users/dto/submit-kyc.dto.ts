import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @Length(1, 20)
  cccd: string;

  @IsOptional()
  @IsBoolean()
  creditConsentAccepted?: boolean;
}
