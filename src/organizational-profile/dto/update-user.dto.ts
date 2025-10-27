import {
  IsString,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsNumber,
} from 'class-validator';

export class UpdateUserDto {
  @IsNumber()
  user_id: number;

  @IsString()
  first_name: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone_number?: string;

  @IsOptional()
  @IsPhoneNumber()
  user_alternative_contact_number?: string;

  @IsOptional()
  @IsEmail()
  users_business_email?: string;

  @IsOptional()
  @IsNumber()
  role_id?: number;

  @IsOptional()
  @IsNumber()
  department_id?: number;

  @IsOptional()
  @IsNumber()
  designation_id?: number;

  @IsOptional()
  @IsNumber()
  branch_id?: number;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zip?: string;

 
}
