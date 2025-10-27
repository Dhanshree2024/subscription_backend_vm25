import {
  IsString,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class UpdateBranchDto {
  @IsOptional()
  @IsNumber()
  branch_id: number;

  @IsOptional()
  @IsString()
  branch_name?: string;

  @IsOptional()
  @IsString()
  gstNo?: string;

  @IsOptional()
  @IsNumber()
  city_id?: number;

  @IsOptional()
  @IsNumber()
  country_id?: number;

  @IsOptional()
  @IsNumber()
  location_id?: number;

  @IsOptional()
  @IsString()
  branch_street?: string;

  @IsOptional()
  @IsString()
  branch_landmark?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsNumber()
  pincode?: number;

  @IsOptional()
  @IsString()
  contact_number?: string;

  @IsOptional()
  @IsEmail()
  branch_email?: string;

  @IsOptional()
  @IsString()
  alternative_contact_number?: string;

  @IsOptional()
  @IsNumber()
  primary_user_id?: number;

  @IsOptional()
  @IsNumber()
  created_by?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;

  @IsOptional()
  @IsString()
  established_date?: Date;

  @IsOptional()
  primaryUser: {
    primary_user_id?: number;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    phone_number?: string;
    users_business_email?: string;
    user_alternative_contact_number?: string;
  };
}
