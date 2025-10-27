import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit number' }) // Ensure OTP is a 6-digit number
  otp: string;
  user_id: number;
}
