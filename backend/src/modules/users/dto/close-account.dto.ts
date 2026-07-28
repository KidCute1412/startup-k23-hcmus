import { IsNotEmpty, IsString } from 'class-validator';

export class CloseAccountDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
