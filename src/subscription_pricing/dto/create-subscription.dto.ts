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
    @IsInt()
    payment_mode?: number;
  
    @IsDateString()
    purchase_date: Date;
  }
  