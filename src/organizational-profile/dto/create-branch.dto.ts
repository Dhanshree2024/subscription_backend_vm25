import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEmail,
  IsObject,
  IsDateString,
  ValidateNested,
} from 'class-validator';
class PrimaryUserDto {
  @IsOptional()
  @IsString()
  first_name: string;

  @IsOptional()
  @IsString()
  middle_name: string;

  @IsOptional()
  @IsString()
  last_name: string;

  @IsOptional()
  @IsString()
  phone_number: string;

  @IsOptional()
  @IsString()
  user_alternative_contact_number: string;

  @IsOptional()
  @IsEmail()
  users_business_email: string;

  @IsOptional()
  department_id: number;
}

export class CreateBranchDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  branch_name: string;

  @IsOptional()
  @IsString()
  gstNo: string;

  @IsOptional()
  @IsNumber()
  city_id: number;

  @IsOptional()
  @IsNumber()
  country_id: number;

  @IsOptional()
  @IsNumber()
  location_id: number;

  @IsOptional()
  @IsString()
  branch_street: string;

  @IsOptional()
  @IsString()
  branch_landmark: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  pincode: string;

  @IsOptional()
  @IsString()
  contact_number: string;

  @IsOptional()
  @IsEmail()
  branch_email: string;

  @IsOptional()
  @IsString()
  alternative_contact_number: string;

  @IsOptional()
  @IsNumber()
  primary_user_id: number;

  @IsOptional()
  @IsNumber()
  created_by: number;

  @IsOptional()
  @IsBoolean()
  is_active: boolean;

  @IsOptional()
  @IsBoolean()
  is_deleted: boolean;

  @IsOptional()
  @IsString()
  established_date: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => PrimaryUserDto)
  primaryUser: PrimaryUserDto;
}
