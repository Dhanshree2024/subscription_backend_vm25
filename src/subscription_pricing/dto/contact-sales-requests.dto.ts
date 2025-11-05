import { IsString, IsOptional, IsNumber, IsEmail, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

// 🟢 CREATE DTO
export class CreateContactSalesRequestDto {
  // References
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  plan_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  org_id?: number;

  // Personal Information
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  // Company Information
  @IsNotEmpty()
  @IsString()
  company_name: string;

  @IsOptional()
  @IsString()
  job_title?: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  company_size_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  industry_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budget_range_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  implementation_timeline_id?: number;

  // Project Info
  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  message?: string;

  // Status
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}

// 🟡 UPDATE DTO
export class UpdateContactSalesRequestDto {
  @Type(() => Number)
  @IsNumber()
  contact_request_id: number; // primary key for update

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  plan_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  org_id?: number;

  // Personal Information
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Company Info
  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  job_title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_size_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  industry_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budget_range_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  implementation_timeline_id?: number;

  // Project Info
  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  message?: string;

  // Status & flags
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
