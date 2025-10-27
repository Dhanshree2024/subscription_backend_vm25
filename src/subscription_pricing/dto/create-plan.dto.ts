import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsInt,
    IsOptional,
    IsString,
    ValidateNested,
    IsNotEmpty,
    IsNumber
  } from 'class-validator';
import { Type } from 'class-transformer';
export class CreatePlanDto {
    @IsString()
    plan_name: string;
  
    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsString()
    billing_cycle: string; // e.g. "monthly", "yearly", etc.
  
    @IsNotEmpty()
    @IsNumber()
    price: number;
  
    @IsNotEmpty()
    subscription_type: number; // or string if you send it as string from frontend

    @IsOptional()
    @IsNumber()
    product_id?: number; 

      @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  set_trial?: boolean;

  @IsOptional()
  @IsString()
  trial_period?: 'days' | 'months' | 'years';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  trial_period_count?: number;

  }
  