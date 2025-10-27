// create-plan-setting.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePlanSettingDto {
  @IsNotEmpty()
  plan_id: number;

  @IsNotEmpty()
  @IsString()
  setting_name: string;

  @IsNotEmpty()
  value: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// update-plan-setting.dto.ts

export class UpdatePlanSettingDto {
  @IsOptional()
  @IsString()
  setting_name?: string;

  @IsOptional()
  value?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
