import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  email: string; // Can be email or phone number

  @IsNotEmpty()
  @IsString()
  password: string;

  
}
