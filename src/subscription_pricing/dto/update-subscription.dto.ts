import {
    IsOptional,
    IsString,
    IsNotEmpty,
    IsInt,
    IsDateString,
    IsIn 
  } from 'class-validator';

export class UpdateOrgSubscriptionDto {
    @IsInt()
    subscription_id: number;

    @IsOptional()
    @IsInt()
    organization_profile_id?: number;
  
    @IsOptional()
    @IsInt()
    plan_id?: number;
  
    @IsOptional()
    @IsInt()
    subscription_type_id?: number;
  
    @IsOptional()
    @IsIn(['pending', 'completed', 'failed'])
    payment_status?: 'pending' | 'completed' | 'failed';

    @IsOptional()
    @IsInt()
    payment_mode?: number;
  
    @IsOptional()
    @IsDateString()
    purchase_date?: Date;
  }