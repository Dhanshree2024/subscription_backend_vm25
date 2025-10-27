// asset-reset-password.dto.ts
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AssetResetPasswordDto {
  @IsNumber()
  userId: number;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
