import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsInt,
    IsOptional,
    IsString,
    ValidateNested,
    IsNotEmpty
  } from 'class-validator';
  import { Type } from 'class-transformer';
export class CreateSubscriptionTypeDto {
    @IsString()
    @IsNotEmpty()
    typeName: string;
  
    @IsOptional()
    @IsString()
    description?: string;
  }