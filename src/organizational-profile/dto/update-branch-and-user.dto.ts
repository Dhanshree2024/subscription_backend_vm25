import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Define UpdateBranchDto
export class UpdateBranchDto {
  @IsNotEmpty()
  branch_id: number;

  @IsOptional()
  branch_name?: string;

  @IsOptional()
  contact_number?: string;

  @IsOptional()
  branch_email?: string;

  @IsOptional()
  branch_street?: string;

  @IsOptional()
  branch_landmark?: string;

  @IsOptional()
  city?: string;

  @IsOptional()
  state?: string;

  @IsOptional()
  country?: string;

  @IsOptional()
  pincode?: string;

  @IsOptional()
  gstNo?: string;

  @IsOptional()
  established_date?: string;

  @IsOptional()
  primary_user_id?: number;
}

// Define UpdateUserDto
export class UpdateUserDto {
  @IsNotEmpty()
  user_id: number;

  @IsNotEmpty()
  first_name: string;

  @IsOptional()
  middle_name?: string;

  @IsNotEmpty()
  last_name: string;

  @IsNotEmpty()
  phone_number: string;

  @IsNotEmpty()
  users_business_email: string;

  @IsOptional()
  role_id?: number;

  @IsOptional()
  department_id?: number;

  @IsOptional()
  designation_id?: number;

  @IsOptional()
  branch_id?: number;

  @IsOptional()
  street?: string;

  @IsOptional()
  landmark?: string;

  @IsOptional()
  city?: string;

  @IsOptional()
  state?: string;

  @IsOptional()
  country?: string;

  @IsOptional()
  zip?: string;
}

// Final DTO combining both
export class UpdateBranchAndUserDto {
  @ValidateNested()
  @Type(() => UpdateBranchDto)
  branch: UpdateBranchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserDto)
  user?: UpdateUserDto;
}
