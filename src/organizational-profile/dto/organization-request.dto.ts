import {
  IsString,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsNumber,
  IsDateString,
  IsInt,
  IsIn,
  IsISO8601,
  Length,
} from 'class-validator';




export class OrganizationRequestDto {
  @IsNumber()
  organization_profile_id: number;

  @IsOptional()
  @IsString()
  organization_name?: string;

  @IsOptional()
  @IsString()
  industry_type_name?: string;

  @IsOptional()
  @IsString()
  gst_no?: string;

  @IsOptional()
  @IsString()
  pan_number?: string;

  @IsOptional()
  @IsString()
  mobile_number?: string;

  @IsOptional()
  @IsString()
  org_alt_contact_number?: string;

  // @IsOptional()
  // @IsString()
  // organization_location_name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  website_url?: string;

  @IsOptional()
  @IsString()
  financial_year?: string;

  @IsOptional()
  @IsString()
  esi_number?: string;

  @IsOptional()
  @IsString()
  pf_number?: string;

  @IsOptional()
  @IsString()
  lin_number?: string;

  @IsOptional()
  @IsString()
  tan_number?: string;

  @IsOptional()
  @IsString()
  base_currency?: string;

  @IsOptional()
  @IsString()
  dateformat?: string;

  @IsOptional()
  @IsString()
  time_zone?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  pincode?: number | null;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  alternative_contact?: string;

  @IsOptional()
  @IsString()
  established_date?: Date;

  @IsOptional()
  @IsNumber()
  users_designation?: number; // Ensures only numbers are allowed

  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsString()
  users_first_name?: string;

  @IsOptional()
  @IsString()
  users_middle_name?: string;

  @IsOptional()
  @IsString()
  users_last_name?: string;

  @IsOptional()
  @IsEmail()
  users_business_email?: string;

  @IsOptional()
  @IsEmail()
  users_phone_number?: string;


  @IsString()
  @IsOptional()
  billing_contact_name: string;

  @IsEmail()
  @IsOptional()
  billing_email: string;

  @IsString()
  //   @Length(10, 10)
  @IsOptional()
  billing_phone_number: string;
 
}

// export class OrganizationRequestDto1 {
//   @IsNumber()
//   organization_profile_id: number;

//   @IsNumber()
//   user_id: number;

//   @IsString()
//   @IsOptional()
//   org_name: string;

//   @IsNumber()
//   @IsOptional()
//   industry_type_id: number;

//   @IsString()
//   @IsOptional()
//   organization_location_name: string;

//   @IsString()
//   @IsOptional()
//   organization_address: string;

//   @IsString()
//   @IsOptional()
//   city: string;

//   @IsNumber()
//   @IsOptional()
//   pincode: number;

//   @IsString()
//   @IsOptional()
//   state: string;

//   @IsString()
//   @IsOptional()
//   country: string;

//   @IsString()
//   @IsOptional()
//   street: string;

//   @IsString()
//   @IsOptional()
//   landmark: string;

//   @IsEmail()
//   @IsOptional()
//   email: string;

//   @IsString()
// //   @Length(10, 10)
//   @IsOptional()
//   mobile_number: string;

//   @IsString()
// //   @Length(3, 3)
//   @IsOptional()
//   base_currency: string;

//   @IsString()
//   @IsOptional()
//   financial_year: string;

//   @IsString()
//   @IsOptional()
//   time_zone: string;

//   @IsString()
//   @IsOptional()
//   dateformat: string;

//   @IsString()
//   @IsOptional()
//   website_url: string;

//   @IsString()
//   @IsOptional()
//   gst_no: string;

//   @IsNumber()
//   @IsOptional()
//   tenant_org_id: number;

//   @IsDateString()
//   @IsOptional()
//   established_date: string;

//   @IsString()
//   @IsOptional()
//   pf_number: string;

//   @IsString()
//   @IsOptional()
//   tan_number: string;

//   @IsString()
//   @IsOptional()
//   pan_number: string;

//   @IsString()
//   @IsOptional()
//   lin_number: string;

//   @IsString()
//   @IsOptional()
//   esi_number: string;

//   @IsString()
//   @IsOptional()
//   org_alt_contact_number: string;

//   @IsString()
//   @IsOptional()
//   org_profile_image_address: string;

//   @IsString()
//   @IsOptional()
//   billing_contact_name: string;

//   @IsEmail()
//   @IsOptional()
//   billing_email: string;

//   @IsString()
// //   @Length(10, 10)
//   @IsOptional()
//   billing_phone_number: string;
// }




