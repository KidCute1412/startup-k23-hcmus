import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/)
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(
    /^(https:\/\/(?:i\.)?ibb\.co\/[^?#\s]+|\/uploads\/[a-zA-Z0-9_-]+\/[^/?#]+)$/,
  )
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dob?: string;
}
