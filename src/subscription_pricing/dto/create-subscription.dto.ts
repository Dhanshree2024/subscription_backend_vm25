import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsInt,
    IsOptional,
    IsString,
    ValidateNested,
    IsNotEmpty,
    IsEnum
  } from 'class-validator';
  import { Type } from 'class-transformer';
export class CreateOrgSubscriptionDto {
    @IsInt()
    organization_profile_id: number;
  
    @IsInt()
    plan_id: number;
  
    @IsInt()
    subscription_type_id: number;
  
    @IsEnum(['pending', 'completed', 'failed'])
    payment_status: 'pending' | 'completed' | 'failed';
  
    @IsOptional()
    @IsString()
    payment_mode?: string;
  
    @IsDateString()
    purchase_date: Date;
  }
  