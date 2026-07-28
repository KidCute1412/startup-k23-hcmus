import { IsString, Length, Matches } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @Matches(/^[0-9]+$/)
  @Length(9, 20)
  cccd: string;

  @IsString()
  @Matches(/^\/uploads\/[a-zA-Z0-9_-]+\/[^/?#]+$/)
  frontCardUrl: string;

  @IsString()
  @Matches(/^\/uploads\/[a-zA-Z0-9_-]+\/[^/?#]+$/)
  backCardUrl: string;

  @IsString()
  @Matches(/^\/uploads\/[a-zA-Z0-9_-]+\/[^/?#]+$/)
  portraitUrl: string;
}
