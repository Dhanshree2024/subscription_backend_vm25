import { IsEmail, IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  businessEmail: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  industryName: string;

  @IsNotEmpty()
  industryId: number;

  // Optional billing details
  @IsOptional()
  @IsString()
  billingFirstName?: string;

  @IsOptional()
  @IsString()
  billingLastName?: string;

  @IsOptional()
  @IsEmail()
  billingEmail?: string;

  @IsOptional()
  @IsString()
  billingPhone?: string;
  
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  productId: number;

  // @IsNumber()
  // @IsOptional()

  // planId: number;

  // @IsString()
  // @IsOptional()

  // billingCycle: string; // e.g. "monthly" | "yearly"

  // @IsString()
  // @IsOptional()
  // startDate?: string; // ISO string from frontend

  // @IsString()
  // @IsOptional()
  // endDate?: string;

  // @IsString()
  // @IsOptional()
  // price?: string;

  @IsBoolean()
  @IsOptional()
  sameAsPrimary?: boolean;

  // @IsBoolean()
  // @IsOptional()
  // autoRenewal?: boolean;

  // @IsBoolean()
  // @IsOptional()
  // isTrialPeriod?: boolean;

  // // 🔹 New fields
  // @IsNumber()
  // @IsOptional()

  // paymentMethodId: number;
}