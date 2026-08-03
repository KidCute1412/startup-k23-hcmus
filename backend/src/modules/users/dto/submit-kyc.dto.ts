import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @Matches(/^[0-9]+$/)
  @Length(9, 20)
  cccd: string;

  @IsString()
  @Matches(
    /^(https:\/\/(?:i\.)?ibb\.co\/[^?#\s]+|\/uploads\/[a-zA-Z0-9_-]+\/[^/?#]+)$/,
  )
  frontCardUrl: string;

  @IsString()
  @Matches(
    /^(https:\/\/(?:i\.)?ibb\.co\/[^?#\s]+|\/uploads\/[a-zA-Z0-9_-]+\/[^/?#]+)$/,
  )
  backCardUrl: string;

  @IsString()
  @Matches(
    /^(https:\/\/(?:i\.)?ibb\.co\/[^?#\s]+|\/uploads\/[a-zA-Z0-9_-]+\/[^/?#]+)$/,
  )
  portraitUrl: string;

  @IsOptional()
  @IsBoolean()
  creditConsentAccepted?: boolean;
}
