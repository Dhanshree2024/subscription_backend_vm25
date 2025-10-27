import { IsOptional, IsString, IsNumber, IsEmail } from 'class-validator';


export class CreateOrganizationalProfileDto {
  organization_profile_id: number;
  org_name: string | null; 
  industry_type_id: number | null;
  organization_location_name: string | null;
  organization_address: string | null;
  city: string | null ;
  pincode: number;
  state: string | null;
  country: string | null;
  mobile_number: number;
  org_alt_contact_number: number;
  base_currency: string | null;
  financial_year: string | null;
  time_zone: string | null;
  website_url: string | null; 
  gst_no: string | null;
  esi_number: string | null;
  lin_number: string | null;
  pan_number: string | null;
  tan_number: string | null;
  pf_number: string | null;
  report_basis: string | null;
  tenant_org_id: number;
  street: string | null;
  landmark: string | null;
  email:string | null;
  dateformat:string | null;
}

export class UpdateOrganizationalProfileDto {
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


  @IsOptional()
  @IsString()
  organization_location_name?: string;

  @IsOptional()
  @IsString()
  organization_address?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  report_basis?: string;

  @IsOptional()
  @IsString()
  org_profile_image_address?: string;

  @IsOptional()
  @IsString()
  billingContactName?: string;

  @IsOptional()
  @IsEmail()
  billingContactEmail?: string;

  @IsOptional()
  @IsString()
  billingContactPhone?: string; // using string to avoid number formatting issues

  @IsOptional()
  @IsString()
  themeMode?: string;

  @IsOptional()
  @IsString()
  customThemeColor?: string;

  @IsOptional()
  @IsString()
  logo?: string;

 
}


