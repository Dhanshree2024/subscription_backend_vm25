import { IsString, IsEmail, IsOptional, IsPhoneNumber, IsNumber, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString()
  first_name: string;

  @IsOptional()
  @IsString()
  middle_name: string;

  @IsString()
  @IsOptional()
  last_name: string;

  @IsPhoneNumber()
  @IsOptional()
  phone_number: string;

  @IsPhoneNumber()
  @IsOptional()
  user_alternative_contact_number: string;

  @IsEmail()
  @IsOptional()
  users_business_email: string;

  @IsNumber()
  @IsOptional()
  role_id: number;

  @IsNumber()
  @IsOptional()
  department_id: number;

  @IsNumber()
  @IsOptional()
  designation_id: number;

  @IsNumber()
  branch_id: number;

  @IsString()
  @IsOptional()
  street: string;

  @IsString()
  @IsOptional()
  landmark: string;

  @IsString()
  @IsOptional()
  country: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  state: string;

  @IsString()
  @IsOptional()
  zip: string;


 

}